import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";
import { authService } from "../services/authService";
import { AuthenticationError } from "../utils/errors";
import { logger } from "../utils/logger";

interface User {
  appId: string;
  // We can add any other properties specific to your application
}

// Extend the Express `Request` interface to include `user`
declare global {
  namespace Express {
    interface Request {
      data: User;
    }
  }
}

export const verifyAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new AuthenticationError("API key is required");
    }

    // Verify the JWT and decode app information
    const decoded = verifyJWT(apiKey);

    // Verify if the API key is still active
    const isValid = await authService.validateAPIKey(apiKey);
    if (!isValid) {
      throw new AuthenticationError("API key is inactive or invalid");
    }

    if (!decoded || (req.params.appId && decoded.appId !== req.params.appId)) {
      throw new AuthenticationError("Invalid or unauthorized API key");
    }

    req.data = decoded;
    next();
  } catch (error) {
    logger.error("API key verification failed:", error);

    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(401).json({ message: "Invalid or expired API key" });
    }
  }
};

export default verifyAPIKey;
