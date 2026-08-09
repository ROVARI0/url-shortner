import { Request, Response } from "express";
import { createUrlSchema } from "./url.schema";
import { urlService } from "./url.service";

export const createShortUrl = async (req: Request, res: Response) => {
  try {
    const input = createUrlSchema.parse(req.body);
    const userId = req.userId!;
    const result = await urlService.createShortUrl(input, userId);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const redirectToOriginalUrl = async (req: Request, res: Response) => {
  try {
    const shortCode = req.params.shortCode as string;

    const url = await urlService.getOriginalUrl(shortCode, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      referrer: req.headers["referer"],
    });

    return res.redirect(url.originalUrl);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
};
