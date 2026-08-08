import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const deadLetterQueue = new Queue("deadLetterQueue", {
  connection: redisConnection,
});
