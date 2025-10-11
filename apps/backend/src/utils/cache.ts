/**
 * Caching Layer
 * Provides in-memory caching with TTL support
 * Can be easily swapped with Redis for distributed caching
 */

import { CACHE } from '../config/constants';
import { logger } from './logger';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

/**
 * In-Memory Cache Implementation
 * For production, replace with Redis
 */
class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
    };
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  set<T>(key: string, value: T, ttl: number = CACHE.DEFAULT_TTL_SECONDS): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Delete multiple keys by pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.stats.deletes += deleted;
      this.stats.size = this.cache.size;
    }

    return deleted;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE.DEFAULT_TTL_SECONDS
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.stats.size = this.cache.size;
      logger.debug(`Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Cache key builders for different resources
 */
export const CacheKeys = {
  campaign: (id: string) => `campaign:${id}`,
  campaignList: (filters: string) => `campaigns:list:${filters}`,
  host: (id: string) => `host:${id}`,
  hostByFid: (fid: number) => `host:fid:${fid}`,
  hostByWallet: (wallet: string) => `host:wallet:${wallet.toLowerCase()}`,
  hostEarnings: (hostId: string) => `host:${hostId}:earnings`,
  hostPerformance: (hostId: string, days: number) => `host:${hostId}:performance:${days}`,
  activeCampaigns: () => 'campaigns:active',
  activeHosts: () => 'hosts:active',
  epoch: (id: string) => `epoch:${id}`,
  adPlacement: (id: string) => `placement:${id}`,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  campaign(id: string) {
    cache.delete(CacheKeys.campaign(id));
    cache.deletePattern(/^campaigns:list:/);
    cache.delete(CacheKeys.activeCampaigns());
  },

  host(id: string) {
    cache.delete(CacheKeys.host(id));
    cache.deletePattern(new RegExp(`^host:${id}:`));
    cache.delete(CacheKeys.activeHosts());
  },

  hostEarnings(hostId: string) {
    cache.delete(CacheKeys.hostEarnings(hostId));
  },

  allCampaigns() {
    cache.deletePattern(/^campaign:/);
    cache.deletePattern(/^campaigns:/);
  },

  allHosts() {
    cache.deletePattern(/^host:/);
    cache.deletePattern(/^hosts:/);
  },

  all() {
    cache.clear();
  },
};

/**
 * Cache decorator for methods
 */
export function cached(
  keyBuilder: (...args: any[]) => string,
  ttl: number = CACHE.DEFAULT_TTL_SECONDS
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyBuilder(...args);
      
      // Try cache first
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit for ${propertyKey}`, { key: cacheKey });
        return cached;
      }

      // Execute and cache
      logger.debug(`Cache miss for ${propertyKey}`, { key: cacheKey });
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Memoization for synchronous functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyBuilder?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyBuilder ? keyBuilder(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Rate limiting cache
 * Tracks request counts per key with sliding window
 */
export class RateLimiter {
  private requests: Map<string, number[]>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * Get remaining requests in window
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

// Singleton cache instance
export const cache = new InMemoryCache();

// Cleanup on process exit
process.on('SIGTERM', () => {
  cache.destroy();
});

process.on('SIGINT', () => {
  cache.destroy();
});

export default cache;



