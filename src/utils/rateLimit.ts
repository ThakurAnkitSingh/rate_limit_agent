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


// testing 

// const applyTokenBucketLimitTest = async (userId: string, apikey: string, request_count: number, time_window: number) => {
//   const bucketKey = `rate_limit:${userId}:${apikey}`;

//   // Check the current token count in the bucket
//   let currentTokens = await redis.get(bucketKey);
//   if (currentTokens === null) {
//     // If the bucket doesn't exist, initialize it with the maximum token count
//     await redis.set(bucketKey, request_count, "EX", time_window);  // Set expiration for the time window
//     currentTokens = request_count.toString();
//   }

//   currentTokens = parseInt(currentTokens) as any;

//   // If no tokens are available, deny the request
//   if (!currentTokens) {
//     return true;  // Rate limit exceeded
//   }

//   // Decrement the token count
//   await redis.decr(bucketKey);

//   // Refill tokens periodically after the time window
//   setInterval(async () => {
//     const tokens = await redis.get(bucketKey) as string;
//     if (parseInt(tokens) < request_count) {
//       await redis.incr(bucketKey);  // Increment token count to refill
//     }
//   }, time_window * 1000);  // Refills after each time window

//   return false;  // Rate limit not exceeded
// };
// // / Test the flow with multiple requests
// const testRateLimiting = async () => {
//   const userId = "15";
//   const apiKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1LCJpYXQiOjE3MzYyMjg3MTcsImV4cCI6MTczNjIzMjMxN30.Mhsv5h3ZPYzL8lB0rm_hSwIDlaw1vZuJowvvlS0Ookg`;
//   const request_count = 10;  // Max requests allowed per time window
//   const time_window = 60;   // Time window in seconds

//   // Simulate 5 requests
//   for (let i = 1; i <= 100; i++) {
//     console.log(`Request #${i}`);
//     const result = await applyTokenBucketLimitTest(userId, apiKey, request_count, time_window);
//     if (result) {
//       console.log("Rate limit exceeded, can't process the request.");
//     } else {
//       console.log("Request processed.");
//     }
//     console.log("--------------------");
//     // Add a delay of 5 seconds between requests for testing
//     await new Promise(resolve => setTimeout(resolve, 5000));
//   }
// };

// // Test rate limiting behavior
// const runTest = async () => {
//   const userId = "15";
//   const apiKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1LCJpYXQiOjE3MzYyMjg3MTcsImV4cCI6MTczNjIzMjMxN30.Mhsv5h3ZPYzL8lB0rm_hSwIDlaw1vZuJowvvlS0Ookg`;
//   const request_count = 10;  // Max requests allowed per time window
//   const time_window = 60;   // Time window in seconds

//   // Initialize the token bucket in Redis for the first time
//   await redis.set(`rate_limit:${userId}:${apiKey}`, request_count, "EX", time_window);

//   // Run the test to simulate the requests
//   await testRateLimiting();
//   // redis.disconnect();  // Close the Redis connection after test
// };

// // Start the test
// runTest().catch(console.error);