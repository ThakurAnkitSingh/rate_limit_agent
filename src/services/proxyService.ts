import { Request } from "express";
import supabase from "../config/supabase";

import {
  applyTokenBucketLimit,
  applyRollingWindowLimit,
} from "../utils/rateLimit";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export const proxyRequestService = async (req: Request, appId: string) => {
  try {
    // Fetch app data
    const { data: appData, error } = await supabase
      .from("apps")
      .select("*")
      .eq("id", appId)
      .single();

    if (error || !appData) {
      throw new Error("App not found");
    }

    const apiKey = req.headers["x-api-key"] as string;
    let rateLimitExceeded = false;

    // Based on conditions we can apply three varient types of rate limit strategies - token_bucket, rolling_window and leaky_bucket
    if (appData.rate_limit_strategy === "token_bucket") {
      rateLimitExceeded = await applyTokenBucketLimit(appId, apiKey, appData);
    } else if (appData.rate_limit_strategy === "rolling_window") {
      rateLimitExceeded = await applyRollingWindowLimit(appId, apiKey, appData);
    }

    if (rateLimitExceeded) {
      // returning user hits its maximum request in the given period
      return {
        message: "Rate limit exceeded, Queue System On",
        status: 429,
      };
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
      body = JSON.stringify(body);
      headers.set("Content-Type", "application/json");
      headers.set("Content-Length", Buffer.byteLength(body).toString()); 
    } else {
      body = undefined; // Avoid sending a body with GET/HEAD requests
    }

    let targetMethod = req.method;
    if (body == "{}" || !body) {
      targetMethod = "GET";
      body = undefined;
    }

    // Proxy the request to the target API
    const response = await fetch(appData.base_url, {
      method: targetMethod, // Use the determined target method
      headers: headers,
      body: body,
    });

    // Log and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in proxy request:", error);
    return error;
  }
};
