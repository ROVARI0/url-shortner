import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createShortUrl } from "./url.controller";
import { shortUrlTokenBucketRateLimit } from "../../middlewares/rate-limit/short-url-token-bucket-rate-limit";
const router = Router();

router.post(
  "/create-short-url",
  authMiddleware,
  shortUrlTokenBucketRateLimit,
  createShortUrl,
);

export default router;
