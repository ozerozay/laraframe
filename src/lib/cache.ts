/**
 * Simple in-memory cache with TTL.
 * Prevents hammering the Forge API (60 req/min limit).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60_000; // 1 minute

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  cache.set(key, { data, timestamp: Date.now() });
  // Auto-cleanup after TTL
  setTimeout(() => cache.delete(key), ttl);
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Cached fetch wrapper - returns cached data if fresh, otherwise calls fetcher.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  setCache(key, data, ttl);
  return data;
}

/**
 * Rate limit tracking
 */
let rateLimitRemaining = 60;
let rateLimitTotal = 60;
let rateLimitResetTime = 0;

export function updateRateLimit(remaining: number, total: number): void {
  rateLimitRemaining = remaining;
  rateLimitTotal = total;
  rateLimitResetTime = Date.now() + 60_000;
}

export function getRateLimit() {
  return {
    remaining: rateLimitRemaining,
    total: rateLimitTotal,
    resetTime: rateLimitResetTime,
    isLow: rateLimitRemaining < 10,
    isExhausted: rateLimitRemaining <= 0,
  };
}
