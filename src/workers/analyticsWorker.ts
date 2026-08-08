import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis";
import { analyticsService } from "../modules/analytics/analytics.service";
import { deadLetterQueue } from "../queues/deadLetterQueue";
import { RecordAnalyticsJob } from "../types/workers.types";
import { logger } from "../config/logger";

new Worker<RecordAnalyticsJob>(
  "analyticsQueue",
  async (job) => {
    try {
      if (job.name === "record-analytics") {
        logger.info(
          { jobId: job.id, shortUrlId: job.data.shortUrlId },
          "Analytics job started",
        );

        await analyticsService.recordClick({
          shortUrlId: job.data.shortUrlId,
          ipAddress: job.data.ipAddress,
          userAgent: job.data.userAgent,
          referrer: job.data.referrer,
        });

        logger.info(
          { jobId: job.id, shortUrlId: job.data.shortUrlId },
          "Analytics job completed",
        );
      }
    } catch (error) {
      logger.error({ jobId: job.id, err: error }, "Job failed");

      await deadLetterQueue.add("failed-analytics", {
        jobName: job.name,
        jobData: job.data,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);
