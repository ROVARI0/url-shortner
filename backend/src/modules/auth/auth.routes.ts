import { Router } from "express";
import { register, login, me } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { loginSlidingWindowRateLimit } from "../../middlewares/rate-limit/login-sliding-window-rate-limit";

const router = Router();

router.post("/register", register);
router.post("/login", loginSlidingWindowRateLimit, login);
router.get("/me", authMiddleware, me);

export default router;
