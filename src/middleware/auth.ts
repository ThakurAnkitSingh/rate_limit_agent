// import { Request, Response, NextFunction } from 'express';
// import { verifyJWT } from '../utils/jwt';

// const verifyAPIKey = (req: Request, res: Response, next: NextFunction) => {
//   const apiKey = req.headers['x-api-key'];

//   if (!apiKey) {
//     return res.status(401).json({ message: 'API key is required' });
//   }

//   try {
//     const decoded = verifyJWT(apiKey as string);
//     req.user = decoded; // Attach user info to the request
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid or expired API key' });
//   }
// };

// export default verifyAPIKey;

import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";

// // Define the structure of the user object (you can adjust this based on your actual user data structure)
// interface User {
//   userId: string;
//   // Add any other user properties here
// }

// // Extending the Express `Request` interface to include `user`
// declare global {
//   namespace Express {
//     interface Request {
//       user?: User; // Optional because not all requests will have user info
//     }
//   }
// }

const verifyAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({ message: "API key is required" });
  } else {
    try {
      // Assuming the `verifyJWT` function returns the user information
      const decoded = verifyJWT(apiKey as string); // Cast to `User` type
      req.user = decoded // Attach user info to the request object
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired API key" });
    }
  }
};

export default verifyAPIKey;
