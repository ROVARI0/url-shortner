import redis from "../../lib/redis";
import { logger } from "../../config/logger";

import {
  SHORT_URL_BLOOM_FILTER_KEY,
  BLOOM_CAPACITY,
  BLOOM_ERROR_RATE,
} from "./bloom.constants";

export const bloomService = {
  async initialize() {
    try {
      await redis.call(
        "BF.RESERVE",
        SHORT_URL_BLOOM_FILTER_KEY,
        BLOOM_ERROR_RATE.toString(),
        BLOOM_CAPACITY.toString(),
      );
      logger.info("Bloom filter initialized");
    } catch (err: any) {
      if (err.message.includes("item exists")) {
        logger.info("Bloom filter already exists, skipping init");
      } else {
        throw err;
      }
    }
  },

  async add(shortCode: string) {
    await redis.call("BF.ADD", SHORT_URL_BLOOM_FILTER_KEY, shortCode);
  },

  async mightExist(shortCode: string): Promise<boolean> {
    const result = await redis.call(
      "BF.EXISTS",
      SHORT_URL_BLOOM_FILTER_KEY,
      shortCode,
    );
    return result === 1;
  },
};
