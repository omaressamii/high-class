'use client';

/**
 * Navigation cache for improved performance
 * Caches navigation states and reduces re-computations
 */

interface NavigationCacheItem {
  timestamp: number;
  data: any;
}

class NavigationCache {
  private cache = new Map<string, NavigationCacheItem>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const navigationCache = new NavigationCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    navigationCache.cleanup();
  }, 5 * 60 * 1000);
}
