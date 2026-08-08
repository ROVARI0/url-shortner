import { Redis } from "ioredis";

export const redisConnection = {
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConnection);

redis.on("connect", () => console.log("Redis connected successfully"));
redis.on("error", (err) => console.error("Redis connection error:", err));

export default redis;
