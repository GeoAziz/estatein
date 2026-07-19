import rateLimit from "express-rate-limit";
import redis from "../config/redis.js";

// Dynamically load rate-limit-redis only when Redis is available
let RedisStore: any;
if (redis) {
  try {
    const mod = await import("rate-limit-redis");
    RedisStore = mod.default;
  } catch {
    // rate-limit-redis not available, fall back to memory store
  }
}

function createRedisStore(prefix: string) {
  if (!redis || !RedisStore) return undefined;
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) => redis!.call(command, ...args) as any,
    prefix: `rl:${prefix}:`,
  });
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    data: null,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth"),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    data: null,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("api"),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    data: null,
    error: {
      code: "RATE_LIMITED",
      message: "Too many upload requests. Please try again later.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("upload"),
});
