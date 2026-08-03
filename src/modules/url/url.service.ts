import { prisma } from "../../lib/prisma";
import { CreateUrlInput } from "./url.schema";
import { getCache, setCache } from "./cache/cache.service";
import { bloomService } from "../bloom/bloom.service";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_CODE_LENGTH = 8;
let generateCode: () => string;
async function getGenerateCode() {
  if (!generateCode) {
    const { customAlphabet } = await import("nanoid");
    generateCode = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);
  }
  return generateCode;
}

export const urlService = {
  async createShortUrl(data: CreateUrlInput, userId: string) {
    const MAX_RETRIES = 5;
    const generate = await getGenerateCode();

    for (let i = 0; i < MAX_RETRIES; i++) {
      const shortCode = generate();

      const existing = await prisma.url.findUnique({
        where: { shortCode },
      });

      if (existing) continue;

      const url = await prisma.url.create({
        data: {
          originalUrl: data.originalUrl,
          shortCode,
          userId,
        },
      });
      await bloomService.add(shortCode);
      return url;
    }

    throw new Error("Failed to generate a unique short code, please try again");
  },

  async getOriginalUrl(shortCode: string) {
    const exists = await bloomService.mightExist(shortCode);

    if (!exists) {
      throw new Error("Short URL not found");
    }

    const cacheKey = `shortUrl:${shortCode}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      await prisma.url.update({
        where: { shortCode },
        data: { clicks: { increment: 1 } },
      });
      return { originalUrl: cached };
    }

    const url = await prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new Error("Short URL not found");
    }

    await prisma.url.update({
      where: { shortCode },
      data: { clicks: { increment: 1 } },
    });

    await setCache(cacheKey, url.originalUrl);

    return url;
  },
};
// Short code abc123 gets created → added to Bloom filter (permanent) → also cached in Redis (temporary, 1hr TTL)
// An hour passes, cache entry for abc123 expires and gets evicted
// Someone visits abc123 again → Bloom filter check: "maybe exists" (correctly — it really was created, the filter never forgets that)
// Since Bloom filter says "maybe," proceed to cache check → miss (since it expired)
// Fall through to Postgres → finds the real row → re-populates the cache → returns the redirect