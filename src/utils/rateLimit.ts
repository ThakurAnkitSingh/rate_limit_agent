import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});


// Token Bucket Algorithm
export const applyTokenBucketLimit = async (
  appId: string,
  apiKey: string,
  appData: any
) => {
  const bucketKey = `rate_limit:${appId}:${apiKey}`;
  const queueKey = `queue:${appId}:${apiKey}`;
  const { request_count, time_window } = appData;

  let currentTokens = await redis.get(bucketKey) as any;

  if (currentTokens === null) {
    await redis.set(bucketKey, request_count, "EX", time_window);
    currentTokens = request_count.toString();
  }

  const tokens = parseInt(currentTokens);

  if (tokens <= 0) {
    // Queue the request if no tokens are left
    console.log("No tokens available, queueing request.");
    await redis.lpush(queueKey, JSON.stringify({ appId, apiKey, timestamp: Date.now() }));
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
    await redis.lpush(queueKey, JSON.stringify({ appId, apiKey, timestamp: Date.now() }));
    return true; 
  }

  // Add the current timestamp and process queued requests
  await redis.lpush(windowKey, currentTime.toString());
  await redis.expire(windowKey, Math.ceil(time_window));
  await processRollingWindowQueue(queueKey, windowKey, appId, apiKey, request_count);
  
  return false; // It indicate that our request was processed
};


// Process Queue for Token Bucket
const processTokenBucketQueue = async (queueKey: string, bucketKey: string) => {
  let tokens = await redis.get(bucketKey) as any;
  tokens = tokens ? parseInt(tokens) : 0;
  
  console.log("tokens Available in Queue: ", tokens)
  
  while (tokens > 0) {
    const queuedRequest = await redis.rpop(queueKey);
    if (!queuedRequest) break;
    
    console.log("Processing queued request:", JSON.parse(queuedRequest));
    tokens = await redis.decr(bucketKey);
    console.log("After Decrement tokens Available in Queue: ", tokens)
    
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



// // Leaky Bucket Algorithm
// export const applyLeakyBucketWithQueue = async (
  //   appId: string,
  //   apiKey: string,
  //   appData: any
// ) => {
//   const bucketKey = `leaky_bucket:${appId}:${apiKey}`;
//   const queueKey = `queue:${appId}:${apiKey}`;
//   const { request_count, time_window } = appData;

//   const currentTime = Date.now();
//   let lastProcessedTime = await redis.get(bucketKey);
  
//   if (lastProcessedTime === null) {
  //     await redis.set(bucketKey, currentTime.toString(), "EX", time_window);
  //     lastProcessedTime = currentTime.toString();
  //   }
  
  //   const elapsedTime = currentTime - parseInt(lastProcessedTime);
  //   const tokensDripped = Math.floor(elapsedTime / time_window) * request_count;
  
  //   const tokensAvailable = Math.min(request_count, tokensDripped);
  
  //   if (tokensAvailable <= 0) {
    //     console.log("Bucket is full, queueing request.");
    //     await redis.lpush(queueKey, JSON.stringify({ appId, apiKey, timestamp: Date.now() }));
    //     return true; // Indicate the request is queued
    //   }
    
    //   await redis.set(bucketKey, currentTime.toString(), "EX", time_window);
//   await processLeakyBucketQueue(queueKey, bucketKey);

//   return false; // Indicate the request was processed
// };


// Process Queue for Leaky Bucket
// const processLeakyBucketQueue = async (queueKey: string, bucketKey: string) => {
//   const tokensAvailable = await redis.get(bucketKey);
//   if (!tokensAvailable || parseInt(tokensAvailable) <= 0) return;

//   while (true) {
//     const queuedRequest = await redis.rpop(queueKey);
//     if (!queuedRequest) break;

//     console.log("Processing queued request:", JSON.parse(queuedRequest));
//   }
// };