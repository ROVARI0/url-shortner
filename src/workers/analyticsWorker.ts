import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis";
import { analyticsService } from "../modules/analytics/analytics.service";
import { deadLetterQueue } from "../queues/deadLetterQueue";
import { RecordAnalyticsJob } from "../types/workers.types";

new Worker<RecordAnalyticsJob>(
  "analyticsQueue",
  async (job) => {
    try {
      if (job.name === "record-analytics") {
        console.log("ANALYTICS_JOB_STARTED", job.id, job.data.shortUrlId);

        await analyticsService.recordClick({
          shortUrlId: job.data.shortUrlId,
          ipAddress: job.data.ipAddress,
          userAgent: job.data.userAgent,
          referrer: job.data.referrer,
        });

        console.log("ANALYTICS_JOB_COMPLETED", job.id, job.data.shortUrlId);
      }
    } catch (error) {
      console.error(`Job ${job.id} has failed`, error);

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
