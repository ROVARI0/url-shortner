import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createShortUrl } from "./url.controller";

const router = Router();

router.post("/create-short-url", authMiddleware, createShortUrl);

export default router;
