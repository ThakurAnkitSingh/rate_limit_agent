import Redis from "ioredis";
import { logger } from "../utils/logger";

export function createRedisClient(): Redis {
  const redis = new Redis({
    username: process.env.REDIS_USERNAME,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("error", (error) => {
    logger.error("Redis connection error:", error);
  });

  redis.on("connect", () => {
    logger.info("Successfully connected to Redis");
  });

  return redis;
}
