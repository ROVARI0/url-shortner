import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { analyticsService } from "./analytics.service";
import { getAnalyticsQuerySchema } from "./analytics.schema";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;
    const { limit, cursor } = getAnalyticsQuerySchema.parse(req.query);

    const url = await prisma.url.findUnique({ where: { id } });

    if (!url) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    if (url.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not allowed to view this" });
    }

    const result = await analyticsService.getAnalytics(id, limit, cursor);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
