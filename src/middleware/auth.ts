import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";
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

const verifyAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers["x-api-key"] as string;

  // Check if API key is provided
  if (!apiKey) {
    res.status(401).json({ message: "API key is required" });
    return;
  }

  try {
    // Verify the JWT and decode app information
    const decoded = verifyJWT(apiKey) as User;
    if (
      !decoded ||
      (req.params.appId && decoded.appId != req.params.appId)
    ) {
      res.status(403).json({ message: "Invalid or unauthorized API key" });
      return;
    }

    // Attach app info to the request object
    req.data = decoded;
    next();
  } catch (error) {
    // Handle errors during JWT verification
    console.error("JWT verification failed:", error);
    res.status(401).json({ message: "Invalid or expired API key" });
    return;
  }
};

export default verifyAPIKey;
