import { Redis } from "ioredis";
import { logger } from "../config/logger";

export const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConnection);

redis.on("connect", () => logger.info("Redis connected successfully"));
redis.on("error", (err) => logger.error(err, "Redis connection error"));

export default redis;
