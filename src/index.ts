import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";
import { redirectToOriginalUrl } from "./modules/url/url.controller";
import authRoutes from "./modules/auth/auth.routes";
import urlRoutes from "./modules/url/url.routes";
import "./lib/redis";

const app = express();
const PORT = 4000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
