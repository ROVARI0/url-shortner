import { NextFunction, Request, Response } from "express";
import redis from "../../lib/redis";
import crypto from "crypto";

const WINDOW_IN_SECONDS = 15 * 60; // 15 minutes
const MAX_REQUESTS = 5;

export const loginSlidingWindowRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const identifier = req.ip;
    const key = `login-rate-limit:${identifier}`;

    const now = Date.now();
    const windowStart = now - WINDOW_IN_SECONDS * 1000;

    await redis.zremrangebyscore(key, 0, windowStart);

    const requestCount = await redis.zcard(key);

    if (requestCount >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
      });
    }

    const member = `${now}-${crypto.randomUUID()}`;
    await redis.zadd(key, now, member);
    await redis.expire(key, WINDOW_IN_SECONDS);

    next();
  } catch (error) {
    next(error);
  }
};

// It's basically telling your server: "For each IP, keep track of login attempts from the last 15 minutes; if there are already 5, reject the new request."
