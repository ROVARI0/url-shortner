# URL Shortener - Learning Guide

## Project Overview

Building a URL shortener backend from scratch, inspired by a reference project. The goal is to understand every concept deeply by building everything step by step.

---

## Current Progress

### Completed Steps

#### Step 1: Add JWT token generation to auth service
- **Files modified**: `src/modules/auth/auth.service.ts`
- **What was done**:
  - Imported `jsonwebtoken`
  - Added `jwt.sign()` in `register()` after user creation
  - Added `jwt.sign()` in `login()` after password verification
  - Both functions now return `{ token, user: { id, name, email, createdAt } }`
- **Files in project**:
  - `src/index.ts` — Express server on port 4000
  - `src/lib/prisma.ts` — Prisma client with adapter-pg
  - `src/modules/auth/auth.service.ts` — Auth logic with JWT
  - `src/modules/auth/auth.controller.ts` — Request handlers
  - `src/modules/auth/auth.routes.ts` — POST /register, POST /login
  - `src/modules/auth/auth.schema.ts` — Zod validation
  - `prisma/schema.prisma` — User model (id, name, email, password, createdAt)

---

## Next Steps (Planned)

1. ~~Add JWT token generation~~ ✅ DONE
2. Create auth middleware (JWT verification for protected routes)
3. Add Express type augmentation (req.user)
4. Create AppError class
5. Create catchAsync wrapper
6. Create sendResponse helper
7. Create global error handler middleware
8. Add CORS middleware
9. Add ShortURL model to Prisma schema
10. Create URL module (create + redirect)
11. Add click tracking (basic)
12. Add user URL listing
13. Add graceful shutdown (SIGINT/SIGTERM handling)
14. Add Zod env validation
15. Introduce repository pattern
16. Add Pino logging
17. Add Redis caching layer
18. Add rate limiting
19. Add BullMQ queues for analytics
20. Add Bloom filter
21. Add distributed locks
22. Add cache warmer
23. Add production deployment setup

---

## Teaching Protocol

When I come back and ask for "next step", the AI must:

### 1. Explore both folders
- Reference: `/home/aizen/Downloads/zips/url_shortner_folder_og`
- My project: `/home/aizen/Downloads/projects/WORKING/url.shortner`

### 2. In the reference project, understand:
- Folder structure, file structure, technologies, dependencies
- Flow of the application and how files connect
- Which features exist and likely build order

### 3. In my project, determine:
- Which files/folders I've created
- What functionality is implemented
- Whether my code is correct
- What's missing or could be improved

### 4. Compare both and identify:
- How far I've progressed
- What's still missing
- The logical next step

### 5. Give only ONE small step at a time in this format:
1. Goal of this step
2. Why this step is needed
3. Concepts I should understand
4. Files/Folders to create or modify
5. What to write (guide, don't dump full code unless I ask)
6. How to verify it works
7. Common beginner mistakes
8. How this connects to the next step

### 6. Code update format (when modifying files):
```
----------------------------------------
Complete Updated File
----------------------------------------
<entire file>

----------------------------------------
Changes Made
----------------------------------------
- Added ...
- Modified ...

----------------------------------------
Only the Added/Modified Code
----------------------------------------
<only the changed parts>
```

### 7. Rules to always follow:
- Never generate the complete project at once
- Never jump multiple steps ahead
- Never overwhelm me
- Explain WHY before HOW
- Explain what problem each step solves
- Compare my approach vs reference approach when relevant
- Preserve my formatting and coding style
- Focus on making me understand, not copy

---

## Current File Contents

### `.env`
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urlshortener?schema=public"
JWT_SECRET="secrettrandommKeyy"
JWT_EXPIRES_IN="7d"
```

### `package.json`
```json
{
  "name": "url.shortner",
  "version": "1.0.0",
  "scripts": { "dev": "ts-node-dev --respawn --transpile-only src/index.ts" },
  "type": "commonjs",
  "dependencies": {
    "@prisma/adapter-pg": "^7.9.0",
    "@prisma/client": "^7.9.0",
    "bcrypt": "^6.0.0",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.22.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0", "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10", "@types/node": "^26.1.1",
    "@types/pg": "^8.20.0", "prisma": "^7.9.0",
    "ts-node-dev": "^2.0.0", "typescript": "^5.5.4"
  }
}
```

### `prisma/schema.prisma`
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

### `src/index.ts`
```ts
import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";
import authRoutes from "./modules/auth/auth.routes";

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### `src/lib/prisma.ts`
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

### `src/modules/auth/auth.service.ts`
```ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { RegisterInput, LoginInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new Error("An account with this email already exists");
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashedPassword },
    });
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    return { token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new Error("Invalid email or password");
    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) throw new Error("Invalid email or password");
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    return { token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } };
  },
};
```

### `src/modules/auth/auth.controller.ts`
```ts
import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema";
import { authService } from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};
```

### `src/modules/auth/auth.routes.ts`
```ts
import { Router } from "express";
import { register, login } from "./auth.controller";
const router = Router();
router.post("/register", register);
router.post("/login", login);
export default router;
```

### `src/modules/auth/auth.schema.ts`
```ts
import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

### `prisma.config.ts`
```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### `.gitignore`
```
node_modules
.env
dist
/src/generated/prisma
```
