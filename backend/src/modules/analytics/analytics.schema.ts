import { z } from "zod";

export const getAnalyticsQuerySchema = z.object({
  limit: z.coerce.number().optional().default(20),
  cursor: z.string().optional(),
});
