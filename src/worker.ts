import "dotenv/config";
import "./workers/analyticsWorker";
import { logger } from "./config/logger";

logger.info("Worker process started, listening for jobs...");
