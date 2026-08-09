import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../../lib/redis";
import { Request, Response } from "express";
import { logger } from "../../config/logger";

// this whole file just configures and exports one piece of Express middleware. When you do app.use(globalRateLimiter), every incoming request now first passes through this check: "has this client (identified by IP, by default) made more than 100 requests in the last 15 minutes?" If yes → blocked with 429. If no → request count increments by one in Redis, and the request proceeds normally to your actual routes.

const WINDOW_MINUTES = 15;
const MAX_REQUESTS = 100;
// const MAX_REQUESTS = 5;

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
    logger.warn(
      { ip: req.ip, path: req.originalUrl },
      "GLOBAL_RATE_LIMIT_EXCEEDED",
    );
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later",
    });
  },
});
