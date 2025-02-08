import express, { Request, Response } from "express";
import dotenv from "dotenv";
import apiRouter from "./routes/api";
import authRouter from "./routes/auth";
import proxyRouter from "./routes/proxy";
import healthRouter from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT: number = Number(process.env.PORT) || 5000; // Ensure it's treated as a number

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for testing
app.get("/", (req: Request, res: Response): void => {
  res.send("Rate Limiting Proxy API is running!");
});

app.use("/api", apiRouter);
app.use("/api", authRouter);
app.use("/api", proxyRouter);
app.use("/", healthRouter);

// Error handling
app.use(errorHandler);

// Start the server
app.listen(PORT, (): void => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});
