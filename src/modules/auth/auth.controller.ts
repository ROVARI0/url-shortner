import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema";
import { authService } from "./auth.service";
import { prisma } from "../../lib/prisma";

export const register = async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
