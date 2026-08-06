import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../../lib/redis";
import { Request, Response } from "express";

const WINDOW_MINUTES = 15;
const MAX_REQUESTS = 100;

export const globalRateLimiter = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  max: MAX_REQUESTS,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return redis.call(args[0], ...args.slice(1)) as Promise<any>;
    },
    prefix: "rate-limit:global",
  }),

  handler: (req: Request, res: Response) => {
    console.warn("GLOBAL_RATE_LIMIT_EXCEEDED", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later",
    });
  },
});
