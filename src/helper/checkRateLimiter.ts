import Redis from "ioredis";
import dotenv from "dotenv";
import { 
  applyRollingWindowLimit, 
  applyTokenBucketLimit, 
  applyLeakyBucketLimit, 
  applyFixedWindowLimit,
} from "../utils/rateLimit";

dotenv.config();

const redis = new Redis({
  username: process.env.REDIS_USERNAME,
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

// Test rate limiting with different algorithms
const testRateLimiting = async (
  appId: string,
  apiKey: string,
  requestCount: number,
  timeWindow: number,
  algorithm: 'token' | 'rolling' | 'leaky' | 'fixed'
) => {
  const totalRequests = 30;
  
  for (let i = 1; i <= totalRequests; i++) {
    console.log(`Request #${i}`);
    
    let result;
    switch(algorithm) {
      case 'token':
        result = await applyTokenBucketLimit(appId, apiKey, {
          request_count: requestCount,
          time_window: timeWindow,
        });
        break;
      case 'rolling':
        result = await applyRollingWindowLimit(appId, apiKey, {
          request_count: requestCount,
          time_window: timeWindow,
        });
        break;
      case 'leaky':
        result = await applyLeakyBucketLimit(appId, apiKey, {
          request_count: requestCount,
          time_window: timeWindow,
        });
        break;
      case 'fixed':
        result = await applyFixedWindowLimit(appId, apiKey, {
          request_count: requestCount,
          time_window: timeWindow,
        });
        break;
    }


    console.log(result ? "Rate limit exceeded" : "Request processed");
    console.log("--------------------");
    
    // Add delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const runTest = async () => {
  try {
    const testConfig = {
      appId: "4",
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6NCwiaWF0IjoxNzM2MjU4MDUzLCJleHAiOjE3MzYyNjE2NTN9.Azk76QXM988jw7g6F9wqLCHZjQqO3vJdrTSrRNvapyE",
      requestCount: 10,
      timeWindow: 20
    };

    // Initialize token bucket
    await redis.set(
      `rate_limit:${testConfig.appId}:${testConfig.apiKey}`,
      testConfig.requestCount,
      "EX",
      testConfig.timeWindow
    );

    // Test each algorithm
    console.log("Testing Token Bucket Algorithm:");
    await testRateLimiting(
      testConfig.appId,
      testConfig.apiKey,
      testConfig.requestCount,
      testConfig.timeWindow,
      'token'
    );

    console.log("\nTesting Rolling Window Algorithm:");
    await testRateLimiting(
      testConfig.appId,
      testConfig.apiKey,
      testConfig.requestCount,
      testConfig.timeWindow,
      'rolling'
    );

    console.log("\nTesting Leaky Bucket Algorithm:");
    await testRateLimiting(
      testConfig.appId,
      testConfig.apiKey,
      testConfig.requestCount,
      testConfig.timeWindow,
      'leaky'
    );
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await redis.disconnect();
  }
};

// Run test with: npm start
export { runTest };