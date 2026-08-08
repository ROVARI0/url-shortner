import { pino } from "pino";

const NODE_ENV = process.env.NODE_ENV || "development";

export const logger = pino({
  transport:
    NODE_ENV === "development"
      ? {
          target: "pino-pretty",
        }
      : undefined,
});
