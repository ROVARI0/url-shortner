import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createShortUrl } from "./url.controller";
import { shortUrlTokenBucketRateLimit } from "../../middlewares/rate-limit/short-url-token-bucket-rate-limit";
import { getAnalytics } from "../analytics/analytics.controller";
const router = Router();

router.post(
  "/create-short-url",
  authMiddleware,
  shortUrlTokenBucketRateLimit,
  createShortUrl,
);

router.get("/:id/analytics", authMiddleware, getAnalytics);

export default router;
