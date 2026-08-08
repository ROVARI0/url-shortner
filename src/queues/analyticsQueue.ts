import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const analyticsQueue = new Queue("analyticsQueue", {
  connection: redisConnection,
});
