import redis from "../../../lib/redis";
import { calculateCacheTTL } from "./cache.helper";

const CACHE_TTL_SECONDS = 3600; // 1 hour base

// getCache is used to get key from redis which point to some value AND resets its TTL back to the full duration on every read (sliding TTL) — both done atomically via redis.multi() so no other command can run between the GET and the EXPIRE.

// getCache is just getting key from redis and also making sure that the TTL[time to live] of key gets reset every time its clicked.
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

//setCache is setting key value pair in redis with differnt TTL[time to live] this is because If you cache a bunch of URLs around the same time (e.g. during a traffic spike), they'll all expire at exactly the same moment — causing a sudden burst of cache misses hitting Postgres all at once (this is called a "thundering herd" or "cache stampede"). Adding small random variation ("jitter") to each TTL spreads out expirations so they don't all happen simultaneously.

export const setCache = (key: string, value: string) => {
  const ttlWithJitter = calculateCacheTTL(CACHE_TTL_SECONDS);
  return redis.set(key, value, "EX", ttlWithJitter);
};
