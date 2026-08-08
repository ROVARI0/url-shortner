export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}
export interface RecordClickInput {
  shortUrlId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}
export interface AnalyticsCursor {
  clickedAt: Date;
  id: string;
}
