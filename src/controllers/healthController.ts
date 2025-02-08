import { Request, Response } from "express";
import Redis from "ioredis";
import supabase from "../config/supabase";
import { createRedisClient } from "../config/redis";
import { logger } from "../utils/logger";

class HealthCheckController {
  private redis: Redis;

  constructor() {
    this.redis = createRedisClient();
  }

  basic = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  };

  detailed = async (req: Request, res: Response): Promise<void> => {
    try {
      const [redisHealth, dbHealth] = await Promise.all([
        this.checkRedisHealth(),
        this.checkDatabaseHealth(),
      ]);

      const systemHealth = {
        status:
          redisHealth.healthy && dbHealth.healthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          redis: redisHealth,
          database: dbHealth,
        },
        version: process.env.npm_package_version || "unknown",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      const statusCode = systemHealth.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(systemHealth);
    } catch (error) {
      logger.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Failed to perform health check",
      });
    }
  };

  private async checkRedisHealth() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
        message: "Redis connection successful",
      };
    } catch (error) {
      logger.error("Redis health check failed:", error);
      return {
        healthy: false,
        error: "Redis connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkDatabaseHealth() {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from("apps")
        .select("count")
        .single();
      const latency = Date.now() - start;

      if (error) throw error;

      return {
        healthy: true,
        latency,
        message: "Database connection successful",
      };
    } catch (error) {
      logger.error("Database health check failed:", error);
      return {
        healthy: false,
        error: "Database connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const healthCheckController = new HealthCheckController();
