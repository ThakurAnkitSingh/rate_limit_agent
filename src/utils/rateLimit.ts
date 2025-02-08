import {
  RateLimitResponse,
  QueuedRequest,
  RateLimitConfig,
} from "../interfaces/interface";
import { createRedisClient } from "../config/redis";
import { logger } from "../utils/logger";

const redis = createRedisClient();

export class RateLimiter {
  private static instance: RateLimiter;
  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async applyRateLimit(
    strategy: string,
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    try {
      switch (strategy) {
        case "token_bucket":
          return await this.applyTokenBucketLimit(appId, apiKey, config);
        case "rolling_window":
          return await this.applyRollingWindowLimit(appId, apiKey, config);
        case "leaky_bucket":
          return await this.applyLeakyBucketLimit(appId, apiKey, config);
        case "fixed_window":
          return await this.applyFixedWindowLimit(appId, apiKey, config);
        default:
          throw new Error(`Unsupported rate limiting strategy: ${strategy}`);
      }
    } catch (error) {
      logger.error(`Rate limiting error: ${(error as Error).message}`, {
        appId,
        strategy,
      });
      throw error;
    }
  }

  private async applyTokenBucketLimit(
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const bucketKey = `token_bucket:${appId}:${apiKey}`;
    const { requestCount, timeWindow } = config;

    const tokens = await redis.get(bucketKey);
    const currentTokens = tokens === null ? requestCount : parseInt(tokens);

    if (currentTokens <= 0) {
      const queuePosition = await this.queueRequest(appId, apiKey);
      return {
        isLimited: true,
        remainingTokens: 0,
        queuePosition,
        nextRefillTime: await this.getNextRefillTime(bucketKey),
      };
    }

    await redis.set(bucketKey, currentTokens - 1, "EX", timeWindow);

    return {
      isLimited: false,
      remainingTokens: currentTokens - 1,
    };
  }

  private async applyFixedWindowLimit(
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const windowKey = `fixed_window:${appId}:${apiKey}`;
    const { requestCount, timeWindow } = config;

    const multi = redis.multi();
    multi.incr(windowKey);
    multi.ttl(windowKey);

    const results = await multi.exec();
    if (!results) {
      throw new Error("Redis multi execution failed");
    }

    const [[countErr, count], [ttlErr, ttl]] = results;
    if (countErr || ttlErr) {
      throw new Error("Redis operation failed");
    }

    const currentCount = count as number;
    const currentTtl = ttl as number;

    // Set expiry for new windows
    if (currentTtl === -1) {
      await redis.expire(windowKey, timeWindow);
    }

    if (currentCount > requestCount) {
      const queuePosition = await this.queueRequest(appId, apiKey);
      return {
        isLimited: true,
        remainingTokens: 0,
        queuePosition,
        nextRefillTime: Date.now() + currentTtl * 1000,
      };
    }

    return {
      isLimited: false,
      remainingTokens: requestCount - currentCount,
    };
  }

  private async applyLeakyBucketLimit(
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const bucketKey = `leaky_bucket:${appId}:${apiKey}`;
    const lastLeakKey = `last_leak:${appId}:${apiKey}`;
    const { requestCount, timeWindow } = config;

    const now = Date.now();
    const lastLeakTime = parseInt(
      (await redis.get(lastLeakKey)) || now.toString()
    );
    const elapsedTime = now - lastLeakTime;
    const leakRate = requestCount / timeWindow;
    const leakedTokens = Math.floor(elapsedTime * leakRate);

    // Get current bucket level
    let level = parseInt((await redis.get(bucketKey)) || "0");

    // Calculate new level after leaking
    level = Math.max(0, level - leakedTokens);

    if (level >= requestCount) {
      const queuePosition = await this.queueRequest(appId, apiKey);
      return {
        isLimited: true,
        remainingTokens: 0,
        queuePosition,
        nextRefillTime: now + Math.ceil((level - requestCount + 1) / leakRate),
      };
    }

    // Update bucket level and last leak time
    await redis
      .multi()
      .set(bucketKey, level + 1)
      .set(lastLeakKey, now)
      .expire(bucketKey, timeWindow)
      .expire(lastLeakKey, timeWindow)
      .exec();

    return {
      isLimited: false,
      remainingTokens: requestCount - (level + 1),
    };
  }

  private async applyRollingWindowLimit(
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const windowKey = `rolling_window:${appId}:${apiKey}`;
    const { requestCount, timeWindow } = config;

    const timestamps = await redis.lrange(windowKey, 0, -1);
    const currentTime = Date.now();
    const timeWindowMs = timeWindow * 1000;

    const validTimestamps = timestamps.filter(
      (timestamp) => currentTime - parseInt(timestamp) <= timeWindowMs
    );

    if (validTimestamps.length >= requestCount) {
      const queuePosition = await this.queueRequest(appId, apiKey);
      return {
        isLimited: true,
        remainingTokens: 0,
        queuePosition,
        nextRefillTime: parseInt(validTimestamps[0]) + timeWindowMs,
      };
    }

    await redis.lpush(windowKey, currentTime.toString());
    await redis.expire(windowKey, Math.ceil(timeWindow));

    return {
      isLimited: false,
      remainingTokens: requestCount - validTimestamps.length - 1,
    };
  }

  private async queueRequest(appId: string, apiKey: string): Promise<number> {
    const queueKey = `queue:${appId}:${apiKey}`;
    const request: QueuedRequest = {
      appId,
      apiKey,
      timestamp: Date.now(),
    };

    const position = await redis.rpush(queueKey, JSON.stringify(request));
    await redis.expire(queueKey, 3600); // Queue expires in 1 hour
    return position;
  }

  private async processQueue(
    queueKey: string,
    strategy: string,
    appId: string,
    apiKey: string,
    config: RateLimitConfig
  ): Promise<void> {
    const queuedRequest = await redis.lpop(queueKey);
    if (!queuedRequest) return;

    const request = JSON.parse(queuedRequest);
    const result = await this.applyRateLimit(strategy, appId, apiKey, config);

    if (!result.isLimited) {
      logger.info("Processing queued request:", request);
    } else {
      // Put the request back in the queue
      await redis.rpush(queueKey, JSON.stringify(request));
    }
  }

  private async getNextRefillTime(bucketKey: string): Promise<number> {
    const ttl = await redis.ttl(bucketKey);
    return Date.now() + ttl * 1000;
  }
}

export const rateLimiter = RateLimiter.getInstance();

// Token Bucket Algorithm
export const applyTokenBucketLimit = async (
  appId: string,
  apiKey: string,
  appData: any
) => {
  const bucketKey = `rate_limit:${appId}:${apiKey}`;
  const queueKey = `queue:${appId}:${apiKey}`;
  const { request_count, time_window } = appData;

  let currentTokens = (await redis.get(bucketKey)) as any;

  if (currentTokens === null) {
    await redis.set(bucketKey, request_count, "EX", time_window);
    currentTokens = request_count.toString();
  }

  const tokens = parseInt(currentTokens);

  if (tokens <= 0) {
    // Queue the request if no tokens are left
    console.log("No tokens available, queueing request.");
    await redis.lpush(
      queueKey,
      JSON.stringify({ appId, apiKey, timestamp: Date.now() })
    );
    return true; // Indicate the request is queued
  }

  // Decrement the token count and process queued requests
  await redis.decr(bucketKey);
  await processTokenBucketQueue(queueKey, bucketKey);

  return false; // Indicate the request was processed
};

// Rolling Window Algorithm
export const applyRollingWindowLimit = async (
  appId: string,
  apiKey: string,
  appData: any
) => {
  const windowKey = `rolling_window:${appId}:${apiKey}`;
  const queueKey = `queue:${appId}:${apiKey}`;
  const { request_count, time_window } = appData;

  const timestamps = await redis.lrange(windowKey, 0, -1);
  const currentTime = Date.now();
  const timeWindowMs = time_window * 1000;

  const validTimestamps = timestamps.filter(
    (timestamp) => currentTime - parseInt(timestamp) <= timeWindowMs
  );

  if (validTimestamps.length >= request_count) {
    // Indicate that now our request will be in the queued
    console.log("Rate limit exceeded, queueing request.");
    await redis.lpush(
      queueKey,
      JSON.stringify({ appId, apiKey, timestamp: Date.now() })
    );
    return true;
  }

  // Add the current timestamp and process queued requests
  await redis.lpush(windowKey, currentTime.toString());
  await redis.expire(windowKey, Math.ceil(time_window));
  await processRollingWindowQueue(
    queueKey,
    windowKey,
    appId,
    apiKey,
    request_count
  );

  return false; // It indicate that our request was processed
};

// Process Queue for Token Bucket
const processTokenBucketQueue = async (queueKey: string, bucketKey: string) => {
  let tokens = (await redis.get(bucketKey)) as any;
  tokens = tokens ? parseInt(tokens) : 0;

  console.log("tokens Available in Queue: ", tokens);

  while (tokens > 0) {
    const queuedRequest = await redis.rpop(queueKey);
    if (!queuedRequest) break;

    console.log("Processing queued request:", JSON.parse(queuedRequest));
    tokens = await redis.decr(bucketKey);
    console.log("After Decrement tokens Available in Queue: ", tokens);
  }
};

const processRollingWindowQueue = async (
  queueKey: string,
  windowKey: string,
  appId: string,
  apiKey: string,
  rateLimiter: number
) => {
  let limit = rateLimiter;

  while (limit > 0) {
    const queuedRequest = await redis.rpop(queueKey);
    if (!queuedRequest) break;

    console.log("Processing queued request:", JSON.parse(queuedRequest));

    // Add the current timestamp to the window for each processed request
    await redis.lpush(windowKey, Date.now().toString());

    const bucketKey = `rate_limit:${appId}:${apiKey}`;
    await redis.decr(bucketKey); // Decrement the rate limiter

    limit -= 1;
  }
};


// Fixed Window Rate Limiting
export const applyFixedWindowLimit = async (
  appId: string,
  apiKey: string,
  config: { request_count: number; time_window: number }
): Promise<boolean> => {
  const windowKey = `fixed_window:${appId}:${apiKey}`;
  const queueKey = `fixed_window_queue:${appId}:${apiKey}`;

  // Get current count for this window
  let count = await redis.get(windowKey);
  
  if (!count) {
    // Start new window
    await redis.set(windowKey, 1, 'EX', config.time_window);
    return false;
  }

  const currentCount = parseInt(count);
  
  if (currentCount >= config.request_count) {
    // Queue the request
    await redis.lpush(queueKey, JSON.stringify({ timestamp: Date.now() }));
    return true;
  }

  // Increment counter
  await redis.incr(windowKey);
  return false;
};

// Leaky Bucket Rate Limiting
export const applyLeakyBucketLimit = async (
  appId: string,
  apiKey: string, 
  config: { request_count: number; time_window: number }
): Promise<boolean> => {
  const bucketKey = `leaky_bucket:${appId}:${apiKey}`;
  const queueKey = `leaky_bucket_queue:${appId}:${apiKey}`;

  // Calculate leak rate (requests per second)
  const leakRate = config.request_count / config.time_window;
  
  // Get current bucket level
  let level = await redis.get(bucketKey);
  const currentLevel = level ? parseInt(level) : 0;

  // Calculate time since last request
  const lastRequestKey = `last_request:${appId}:${apiKey}`;
  const lastRequestTime = await redis.get(lastRequestKey);
  const now = Date.now();
  
  if (lastRequestTime) {
    const timePassed = (now - parseInt(lastRequestTime)) / 1000; // Convert to seconds
    const leakedTokens = Math.floor(timePassed * leakRate);
    const newLevel = Math.max(0, currentLevel - leakedTokens);
    
    await redis.set(bucketKey, newLevel);
  }

  // Check if bucket is full
  if (currentLevel >= config.request_count) {
    // Queue the request
    await redis.lpush(queueKey, JSON.stringify({ timestamp: now }));
    return true;
  }

  // Add to bucket and update last request time
  await redis.incr(bucketKey);
  await redis.set(lastRequestKey, now);
  
  return false;
};

const processFixedWindowQueue = async (
  queueKey: string,
  windowKey: string,
  config: { request_count: number }
) => {
  const currentCount = await redis.get(windowKey);
  if (!currentCount) return;

  const remainingCapacity = config.request_count - parseInt(currentCount);

  for (let i = 0; i < remainingCapacity; i++) {
    const queuedRequest = await redis.rpop(queueKey);
    if (!queuedRequest) break;

    console.log("Processing queued request:", JSON.parse(queuedRequest));
    await redis.incr(windowKey);
  }
};

const processLeakyBucketQueue = async (
  queueKey: string,
  bucketKey: string,
  leakRate: number
) => {
  const currentLevel = await redis.get(bucketKey);
  if (!currentLevel) return;

  const capacity = Math.floor(leakRate);
  const remainingCapacity = capacity - parseInt(currentLevel);

  for (let i = 0; i < remainingCapacity; i++) {
    const queuedRequest = await redis.rpop(queueKey);
    if (!queuedRequest) break;

    console.log("Processing queued request:", JSON.parse(queuedRequest));
    await redis.incr(bucketKey);
  }
};
