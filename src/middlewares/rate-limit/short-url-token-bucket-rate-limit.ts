import { NextFunction, Request, Response } from "express";
import redis from "../../lib/redis";

const CAPACITY = 10;
const REFILL_RATE = 1;
const REFILL_INTERVAL = 30_000; // 30 seconds, in ms
const TTL = 3600; // 1 hour

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export const shortUrlTokenBucketRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const key = `token-bucket:${userId}`;
    const cachedBucket = await redis.get(key);

    let bucket: TokenBucket;

    if (!cachedBucket) {
      bucket = {
        tokens: CAPACITY,
        lastRefill: Date.now(),
      };
    } else {
      bucket = JSON.parse(cachedBucket);
    }

    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const refillCount = Math.floor(elapsed / REFILL_INTERVAL);

    if (refillCount > 0) {
      bucket.tokens = Math.min(
        CAPACITY,
        bucket.tokens + refillCount * REFILL_RATE,
      );
      bucket.lastRefill += refillCount * REFILL_INTERVAL;
    }

    if (bucket.tokens <= 0) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later",
      });
    }

    bucket.tokens--;

    await redis.set(key, JSON.stringify(bucket), "EX", TTL);

    next();
  } catch (error) {
    next(error);
  }
};
