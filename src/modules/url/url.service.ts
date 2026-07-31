import { customAlphabet } from "nanoid";
import { prisma } from "../../lib/prisma";
import { CreateUrlInput } from "./url.schema";
import { getCache, setCache } from "./cache/cache.service";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_CODE_LENGTH = 8;
const generateCode = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);

export const urlService = {
  async createShortUrl(data: CreateUrlInput, userId: string) {
    const MAX_RETRIES = 5;

    for (let i = 0; i < MAX_RETRIES; i++) {
      const shortCode = generateCode();

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

      return url;
    }

    throw new Error("Failed to generate a unique short code, please try again");
  },

  async getOriginalUrl(shortCode: string) {
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
