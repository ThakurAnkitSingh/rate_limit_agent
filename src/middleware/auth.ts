import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";

// Define the structure of the user object
interface User {
  userId: string;
  // Add any other properties specific to your application
}

// Extend the Express `Request` interface to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: User; // Optional because not all requests will have user info
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
    // Verify the JWT and decode user information
    const decoded = verifyJWT(apiKey) as User;

    // Ensure decoded user exists and validate user ID (optional, based on your logic)
    if (
      !decoded ||
      (req.params.appId && decoded.userId != req.params.appId)
    ) {
      res.status(403).json({ message: "Invalid or unauthorized API key" });
      return;
    }

    // Attach user info to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors during JWT verification
    console.error("JWT verification failed:", error);
    res.status(401).json({ message: "Invalid or expired API key" });
    return;
  }
};

export default verifyAPIKey;
