import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

// Token Bucket Rate Limiting
export const applyTokenBucketLimit = async (
  userId: string,
  apikey: string,
  appData: any
) => {
  const bucketKey = `rate_limit:${userId}:${apikey}`;
  const { request_count, time_window } = appData; // e.g., 100 requests per hour

  const currentTokens = await redis.get(bucketKey);

  console.log(currentTokens, "Tokens")

  // If the bucket is empty, deny request
  if (currentTokens === null || parseInt(currentTokens) <= 0) {
    return true; // Rate limit exceeded
  }

  // Decrement the token count
  await redis.decr(bucketKey);

  // Refill tokens periodically (this should happen regardless of current tokens)
  if (currentTokens === null || parseInt(currentTokens) < request_count) {
    await redis.set(bucketKey, request_count - 1, "EX", time_window);
  }

  return false; // Rate limit not exceeded
};

// Rolling Window Rate Limiting
export const applyRollingWindowLimit = async (
  userId: string,
  apiKey: string,
  appData: any
) => {
  const windowKey = `rolling_window:${userId}:${apiKey}`;
  const { request_count, time_window } = appData; // e.g., 100 requests per 1 hour

  // Get the list of timestamps for the user's previous requests
  const timestamps = await redis.lrange(windowKey, 0, -1);

  // Filter out timestamps outside of the time window
  const currentTime = Date.now();
  const validTimestamps = timestamps.filter(
    (timestamp) => currentTime - parseInt(timestamp) <= time_window
  );

  // If the number of valid requests exceeds the limit, deny the request
  if (validTimestamps.length >= request_count) {
    return true; // Rate limit exceeded
  }

  // Add the current timestamp to the list of timestamps
  await redis.lpush(windowKey, currentTime.toString());
  await redis.expire(windowKey, time_window); // Set expiration time for the list

  return false; // Rate limit not exceeded
};
