import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { redirectToOriginalUrl } from "./modules/url/url.controller";
import { bloomService } from "./modules/bloom/bloom.service";
import { globalRateLimiter } from "./middlewares/rate-limit/global-rate-limit.middleware";
import { logger } from "./config/logger";
import authRoutes from "./modules/auth/auth.routes";
import urlRoutes from "./modules/url/url.routes";
import "./lib/redis";

const app = express();
const PORT = 4000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(globalRateLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.get("/test-db", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json({ count: users.length, users });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/urls", urlRoutes);

app.get("/:shortCode", redirectToOriginalUrl);

bloomService.initialize().catch((err) => {
  logger.error(err, "Failed to initialize bloom filter:");
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
