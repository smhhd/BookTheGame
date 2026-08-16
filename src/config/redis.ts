import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({ url: env.REDIS_URL });
let connecting: Promise<void> | undefined;

redis.on("error", (error) => {
  console.warn("Redis unavailable; continuing without cache", { message: error.message });
});

export async function connectRedis(): Promise<boolean> {
  if (redis.isReady) return true;
  if (!connecting) {
    connecting = redis.connect().then(() => undefined).finally(() => {
      connecting = undefined;
    });
  }
  try {
    await connecting;
    return true;
  } catch {
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!(await connectRedis())) return null;
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    if (await connectRedis()) {
      await redis.set(key, JSON.stringify(value), { EX: ttl });
    }
  } catch {
    // Redis is an optimization, not a source of truth.
  }
}

export async function cacheDelete(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    if (await connectRedis()) await redis.del(keys);
  } catch {
    // Database mutation has already committed; stale data remains bounded by TTL.
  }
}

export async function bumpTicketCacheVersion(): Promise<void> {
  try {
    if (await connectRedis()) await redis.incr("cache:tickets:version");
  } catch {
    // Search cache is short-lived and Redis failure must not break writes.
  }
}

export async function getTicketCacheVersion(): Promise<string> {
  try {
    if (!(await connectRedis())) return "0";
    return (await redis.get("cache:tickets:version")) ?? "0";
  } catch {
    return "0";
  }
}

export async function closeRedis(): Promise<void> {
  if (redis.isOpen) await redis.quit();
}
