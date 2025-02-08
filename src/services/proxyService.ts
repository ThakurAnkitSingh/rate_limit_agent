import { Request } from "express";
import { rateLimiter } from "../utils/rateLimit";
import { logger } from "../utils/logger";
import { fetchAppData } from "./appService";
import { ProxyError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export class ProxyService {
  async handleRequest(req: Request, appId: string) {
    try {
      const appData = await fetchAppData(appId);
      const apiKey = req.headers["x-api-key"] as string;

      const rateLimitResult = await rateLimiter.applyRateLimit(
        appData.strategy,
        appId,
        apiKey,
        {
          requestCount: appData.request_count,
          timeWindow: appData.time_window,
        }
      );

      if (rateLimitResult.isLimited) {
        return {
          message: "Rate limit exceeded",
          status: 429,
          retryAfter: rateLimitResult.nextRefillTime,
          queuePosition: rateLimitResult.queuePosition,
        };
      }

      const response = await this.forwardRequest(req, appData.base_url);
      return response;
    } catch (error) {
      logger.error("Proxy request failed:", error);
      throw new ProxyError("Failed to process proxy request", error as Error);
    }
  }

  private async forwardRequest(req: Request, targetUrl: string) {
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
    const response = await fetch(targetUrl, {
      method: targetMethod, // Use the determined target method
      headers: headers,
      body: body,
    });

    // Log and return the response data
    const data = await response.json();
    return data;
  }
}

export const proxyService = new ProxyService();
