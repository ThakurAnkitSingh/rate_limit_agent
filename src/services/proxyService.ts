import { Request } from "express"; // Import Request to extend it
import supabase from "../config/supabase";

import {
  applyTokenBucketLimit,
  applyRollingWindowLimit,
} from "../utils/rateLimit";

// Extend Request to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export const proxyRequestService = async (req: Request, userId: string) => {
  try {
    // Fetch app data
    const { data: appData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !appData) {
      throw new Error("App not found");
    }

    // Apply rate limiting
    const apiKey = req.headers["x-api-key"] as string;
    let rateLimitExceeded = false;

    if (appData.rate_limit_strategy === "token_bucket") {
      rateLimitExceeded = await applyTokenBucketLimit(userId, apiKey, appData);
    } else if (appData.rate_limit_strategy === "rolling_window") {
      rateLimitExceeded = await applyRollingWindowLimit(
        userId,
        apiKey,
        appData
      );
    }

    if (rateLimitExceeded) {
      throw new Error("Rate limit exceeded");
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.append(key, value);
        }
      }
    }

    let body = req.body;
    if (body && typeof body === "object") {
      // If the body is an object, assume it's JSON and serialize it
      body = JSON.stringify(body);
      headers.set("Content-Type", "application/json");
      headers.set("Content-Length", Buffer.byteLength(body).toString()); // Manually set Content-Length
    }

    const response = await fetch(appData.base_url, {
      method: req.method,
      headers: headers,
      // body: body, // Pass the request body along with the request
    });
    // Log and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in proxy request:", error);
    return error;
  }
};


// How we know it is GET/POST
// API authenticate/validate
