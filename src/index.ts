import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
