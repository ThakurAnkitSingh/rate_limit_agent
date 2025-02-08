import { Request, Response, NextFunction } from "express";
import { BaseError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof BaseError) {
    res.status(error.statusCode).json({
      message: error.message,
      status: error.statusCode,
    });
    return;
  }

  res.status(500).json({
    message: "Internal Server Error",
    status: 500,
  });
};
