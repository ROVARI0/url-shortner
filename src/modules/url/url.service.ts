import { prisma } from "../../lib/prisma";
import { CreateUrlInput } from "./url.schema";
import { getCache, setCache } from "./cache/cache.service";
import { bloomService } from "../bloom/bloom.service";
import { lockService } from "../lock/lock.service";
import { analyticsService } from "../analytics/analytics.service";
import { RequestMetadata } from "../../types/analytics.types";

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
  //------------------------------------------------------------------------------
  async getOriginalUrl(shortCode: string, metadata: RequestMetadata) {
    const exists = await bloomService.mightExist(shortCode);

    if (!exists) {
      throw new Error("Short URL not found");
    }

    const cacheKey = `shortUrl:${shortCode}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      const url = await prisma.url.findUnique({ where: { shortCode } });
      await analyticsService.recordClick({
        shortUrlId: url!.id,
        ...metadata,
      });
      return { originalUrl: cached };
    }

    // Cache miss — try to acquire the lock before hitting Postgres
    const lock = await lockService.acquireLock(shortCode);

    if (!lock.acquired) {
      // Someone else is already rebuilding the cache — wait briefly, then retry cache
      await new Promise((resolve) => setTimeout(resolve, 100));

      const retryCache = await getCache(cacheKey);
      if (retryCache) {
        const url = await prisma.url.findUnique({ where: { shortCode } });
        await analyticsService.recordClick({
          shortUrlId: url!.id,
          ...metadata,
        });
        return { originalUrl: retryCache };
      }

      throw new Error("Please retry shortly");
    }

    try {
      const url = await prisma.url.findUnique({ where: { shortCode } });

      if (!url) {
        throw new Error("Short URL not found");
      }

      await analyticsService.recordClick({
        shortUrlId: url.id,
        ...metadata,
      });

      await setCache(cacheKey, url.originalUrl);

      return url;
    } finally {
      await lockService.releaseLock(shortCode, lock.lockId!);
    }
  },
};
// Short code abc123 gets created → added to Bloom filter (permanent) → also cached in Redis (temporary, 1hr TTL)
// An hour passes, cache entry for abc123 expires and gets evicted
// Someone visits abc123 again → Bloom filter check: "maybe exists" (correctly — it really was created, the filter never forgets that)
// Since Bloom filter says "maybe," proceed to cache check → miss (since it expired)
// Fall through to Postgres → finds the real row → re-populates the cache → returns the redirect

//getOriginalUrl function path
// Request
//    │
//    ▼
// Bloom Filter
//    │
//    ├── Doesn't exist → Return Error
//    │
//    ▼
// Redis Cache
//    │
//    ├── Cache Hit → Increment Clicks → Return URL
//    │
//    ▼
// Acquire Lock
//    │
//    ├── Lock Not Acquired
//    │       │
//    │       ├── Wait 100ms
//    │       ├── Check Cache Again
//    │       ├── Cache Found → Return
//    │       └── Still Missing → Retry Error
//    │
//    ▼
// Database
//    │
//    ├── URL Not Found → Error
//    │
//    ▼
// Increment Clicks
//    │
//    ▼
// Store in Redis
//    │
//    ▼
// Release Lock
//    │
//    ▼
// Return URL
