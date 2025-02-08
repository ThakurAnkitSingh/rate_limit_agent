import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export const validateRegisterApp = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { name, baseUrl, strategy, requestCount, timeWindow } = req.body;

    if (!name || typeof name !== "string") {
      throw new ValidationError("Name is required and must be a string");
    }

    if (!baseUrl || typeof baseUrl !== "string") {
      throw new ValidationError("Base URL is required and must be a string");
    }

    if (
      ![
        "token_bucket",
        "rolling_window",
        "leaky_bucket",
        "fixed_window",
      ].includes(strategy)
    ) {
      throw new ValidationError("Invalid rate limiting strategy");
    }

    if (
      !requestCount ||
      typeof requestCount !== "number" ||
      requestCount <= 0
    ) {
      throw new ValidationError("Request count must be a positive number");
    }

    if (!timeWindow || typeof timeWindow !== "number" || timeWindow <= 0) {
      throw new ValidationError("Time window must be a positive number");
    }

    next();
  } catch (error) {
    logger.error("Validation error:", error);
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Invalid request data" });
    }
  }
};
