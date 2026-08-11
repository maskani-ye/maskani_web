/**
 * Lightweight in-memory cache for the admin web app.
 *
 * - TTL-based: entries expire automatically.
 * - Pattern-based invalidation via `invalidate(prefix)`.
 * - Designed for short-lived admin reads (stats, lists) to avoid
 *   redundant identical requests on the same page load.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /** TTL constants (milliseconds). */
  static readonly TTL = {
    STATS:        60 * 60 * 1000,   // 1 h  — admin stats dashboard
    CITY_LIST:    24 * 60 * 60 * 1000, // 24 h — cities never change
    USER_LIST:    30 * 1000,        // 30 s — users change often
    PROPERTY_LIST: 60 * 1000,        // 1 min
    FRAUD_LIST:   60 * 1000,        // 1 min
    REQUEST_LIST: 60 * 1000,        // 1 min
    SERVICE_LIST: 2 * 60 * 1000,    // 2 min
  };

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  /** Delete all entries whose key starts with [prefix]. */
  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Wipe everything. */
  clear(): void {
    this.store.clear();
  }
}

export const apiCache = new ApiCache();

/**
 * Wraps an async fetcher with cache-aside logic.
 *
 * @param key    Unique cache key (include query params for uniqueness).
 * @param ttl    TTL in milliseconds.
 * @param fetcher  Async function that performs the actual request.
 *
 * @example
 * const stats = await withCache('admin_stats', ApiCache.TTL.STATS, () =>
 *   api.get('/admin/stats/').then(r => r.data)
 * );
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = apiCache.get<T>(key);
  if (cached !== null) return cached;

  const result = await fetcher();
  apiCache.set(key, result, ttl);
  return result;
}
