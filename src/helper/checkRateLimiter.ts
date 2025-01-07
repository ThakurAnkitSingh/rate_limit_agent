// import Redis from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: parseInt(process.env.REDIS_PORT || "6379"),
//   password: process.env.REDIS_PASSWORD,
// });

// // Test the flow with multiple requests with multiple rate limit algorithms

// import { applyLeakyBucketWithQueue, applyRollingWindowLimit, applyTokenBucketLimit } from "../utils/rateLimit";

// const testRateLimiting = async () => {
//   const appId = "4";
//   const apiKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6NCwiaWF0IjoxNzM2MjU4MDUzLCJleHAiOjE3MzYyNjE2NTN9.Azk76QXM988jw7g6F9wqLCHZjQqO3vJdrTSrRNvapyE`;
//   const request_count = 10; // Max requests allowed per time window
//   const time_window = 20; // Time window in seconds // Time window in seconds

//   // Simulate 5 requests
//   for (let i = 1; i <= 30; i++) {
//     cnt++;
//     console.log(`Request #${i} at ${cnt} seconds`);
//     const result = await applyTokenBucketLimit(appId, apiKey, {
//       request_count,
//       time_window,
//     });

//     // const result = await applyRollingWindowLimit(appId, apiKey, {
//     //   request_count,
//     //   time_window,
//     // });

//     // const result = await applyLeakyBucketWithQueue(appId, apiKey, {
//     //   request_count,
//     //   time_window,
//     // });

//     if (result) {
//       console.log("Rate limit exceeded, can't process the request.");
//     } else {
//       console.log("Request processed.");
//     }
//     console.log("--------------------");
//     // Add a delay of 1 seconds between requests for testing
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   }
// };

// // Test rate limiting behavior
// const runTest = async () => {
//   const appId = "4";
//   const apiKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6NCwiaWF0IjoxNzM2MjU4MDUzLCJleHAiOjE3MzYyNjE2NTN9.Azk76QXM988jw7g6F9wqLCHZjQqO3vJdrTSrRNvapyE`;
//   const request_count = 10; // Max requests allowed per time window
//   const time_window = 20; // Time window in seconds

//   // Initialize the token bucket in Redis for the first time
//   await redis.set(
//     `rate_limit:${appId}:${apiKey}`,
//     request_count,
//     "EX",
//     time_window
//   );

//   // Run the test to simulate the requests
//   await testRateLimiting();
//   redis.disconnect(); // Close the Redis connection after test
// };

// // Start the test
// runTest().catch(console.error);


// // Uncomment all these lines and type the command on terminal `npm start`, it will start the function with demo details, here you find that the function is working fine or not.