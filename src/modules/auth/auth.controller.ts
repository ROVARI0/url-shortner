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
