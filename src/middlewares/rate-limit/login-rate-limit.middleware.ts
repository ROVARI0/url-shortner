import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../../lib/redis";
import { Request, Response } from "express";
import { logger } from "../../config/logger";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const loginRateLimit = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  max: MAX_ATTEMPTS,

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return redis.call(args[0], ...args.slice(1)) as Promise<any>;
    },
    prefix: "rate-limit:login",
  }),

  handler: (req: Request, res: Response) => {
    logger.warn(
      { ip: req.ip, path: req.originalUrl },
      "LOGIN_RATE_LIMIT_EXCEEDED",
    );
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later",
    });
  },
});

// A rate limiter controls how many times a client can call an API within a certain amount of time.
// In your code, it is mainly protecting the login endpoint from brute-force attacks.
// In your case You have:
// const WINDOW_MINUTES = 15;
// const MAX_ATTEMPTS = 5;
// So the rule is essentially:
// Allow a maximum of 5 failed login attempts from an IP within 15 minutes.

//Main idea : For login requests, allow up to 5 unsuccessful attempts within 15 minutes. Track the attempts in Redis. Don't count successful logins. If the limit is exceeded, return HTTP 429 and log the event.
