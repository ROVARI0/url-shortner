import redis from "../../../lib/redis";
import { calculateCacheTTL } from "./cache.helper";

const CACHE_TTL_SECONDS = 3600; // 1 hour base

export const getCache = async (key: string) => {
  const result = await redis
    .multi()
    .get(key)
    .expire(key, CACHE_TTL_SECONDS)
    .exec();

  if (!result) {
    return null;
  }

  const [[getError, value]] = result;

  if (getError) {
    throw getError;
  }

  return value as string | null;
};

export const setCache = (key: string, value: string) => {
  const ttlWithJitter = calculateCacheTTL(CACHE_TTL_SECONDS);
  return redis.set(key, value, "EX", ttlWithJitter);
};
