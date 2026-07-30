import redis from "../../../lib/redis";

const CACHE_TTL_SECONDS = 3600; // 1 hour

export const getCache = (key: string) => redis.get(key);

export const setCache = (key: string, value: string) =>
  redis.set(key, value, "EX", CACHE_TTL_SECONDS);
