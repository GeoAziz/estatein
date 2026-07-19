import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis: InstanceType<typeof Redis> | null };

function createRedisClient(): InstanceType<typeof Redis> | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on("error", (err: Error) => {
    console.error("Redis connection error:", err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
