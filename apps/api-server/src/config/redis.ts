import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 * For Phase 3 dev: uses in-memory mock if Redis unavailable
 */
export function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Try to connect to Redis
    const redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("[Redis] Connection failed, using in-memory cache");
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redis.on("error", () => {
      console.warn("[Redis] Connection error, falling back to in-memory cache");
    });

    redisClient = redis;
    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to initialize:", error);
    // Return mock Redis for development
    return createMockRedis();
  }
}

/**
 * Mock Redis client for development/testing
 */
function createMockRedis() {
  const store = new Map<string, string>();

  return {
    async get(key: string) {
      return store.get(key) || null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
      return "OK";
    },
    async setex(key: string, ttl: number, value: string) {
      store.set(key, value);
      // Simulate TTL by removing after ttl seconds
      setTimeout(() => store.delete(key), ttl * 1000);
      return "OK";
    },
    async del(key: string) {
      store.delete(key);
      return 1;
    },
    async flushAll() {
      store.clear();
      return "OK";
    },
  };
}

export function disconnect() {
  if (redisClient && typeof redisClient.disconnect === "function") {
    redisClient.disconnect();
  }
}
