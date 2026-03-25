import { useState, useCallback } from "react";
import { cachedFetch, invalidateCache } from "@/lib/cache";

/**
 * Reusable hook for lazy-loaded, cached data fetching.
 * Replaces the repeated pattern in every widget:
 *   const [data, setData] = useState([]);
 *   const [loaded, setLoaded] = useState(false);
 *   const [loading, setLoading] = useState(false);
 *   if (!loaded && !loading) { load(); }
 */
export function useLazyLoad<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    if (force) invalidateCache(cacheKey);
    try {
      const result = await cachedFetch(cacheKey, fetcher, ttl);
      setData(result);
      setLoaded(true);
    } catch (err) {
      console.error(`Failed to load ${cacheKey}:`, err);
      setError(String(err));
      setLoaded(true);
    }
    setLoading(false);
  }, [cacheKey, fetcher, ttl]);

  // Auto-load on first use
  if (!loaded && !loading) {
    load();
  }

  return { data, loading: loading && !loaded, error, refresh: () => load(true) };
}
