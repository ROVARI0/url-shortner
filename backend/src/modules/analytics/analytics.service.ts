import { prisma } from "../../lib/prisma";
import { RecordClickInput } from "../../types/analytics.types";
import { AnalyticsCursor } from "../../types/analytics.types";

function encodeCursor(cursor: AnalyticsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

function decodeCursor(cursor: string): AnalyticsCursor {
  const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  return {
    clickedAt: new Date(decoded.clickedAt),
    id: decoded.id,
  };
}

export const analyticsService = {
  async recordClick(data: RecordClickInput) {
    await prisma.$transaction([
      prisma.clickAnalytics.create({
        data: {
          shortUrlId: data.shortUrlId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          referrer: data.referrer,
        },
      }),
      prisma.url.update({
        where: { id: data.shortUrlId },
        data: { clicks: { increment: 1 } },
      }),
    ]);
  },
  //---------------------------------------------------------------------------------
  async getAnalytics(shortUrlId: string, limit: number, cursor?: string) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined;

    const analytics = await prisma.clickAnalytics.findMany({
      where: {
        shortUrlId,
        ...(decodedCursor && {
          OR: [
            { clickedAt: { lt: decodedCursor.clickedAt } },
            {
              clickedAt: decodedCursor.clickedAt,
              id: { lt: decodedCursor.id },
            },
          ],
        }),
      },
      orderBy: [{ clickedAt: "desc" }, { id: "desc" }],
      take: safeLimit + 1,
    });

    const hasMore = analytics.length > safeLimit;
    const items = hasMore ? analytics.slice(0, safeLimit) : analytics;

    const nextCursor = hasMore
      ? encodeCursor({
          clickedAt: items[items.length - 1].clickedAt,
          id: items[items.length - 1].id,
        })
      : null;

    return { items, nextCursor, hasMore };
  },
};
