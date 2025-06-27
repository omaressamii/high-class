'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { navigationCache } from '@/lib/navigation-cache';

// Configuration constants
const PREFETCH_CONFIG = {
  COMMON_ROUTES: ['/dashboard', '/products', '/orders', '/customers', '/reports'],
  PREFETCH_DELAY: 100,
  MAX_PREFETCH_COUNT: 5,
} as const;

const PERFORMANCE_FLAGS = {
  ENABLE_PREFETCH: true,
} as const;

/**
 * Hook for prefetching navigation routes to improve performance
 */
export function useNavigationPrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoute = useCallback((href: string) => {
    if (!PERFORMANCE_FLAGS.ENABLE_PREFETCH) return;

    // Check cache first
    const cacheKey = `prefetch_${href}`;
    if (navigationCache.get(cacheKey) || prefetchedRoutes.current.has(href)) {
      return;
    }

    try {
      router.prefetch(href);
      prefetchedRoutes.current.add(href);
      navigationCache.set(cacheKey, true);
    } catch (error) {
      console.warn('Failed to prefetch route:', href, error);
    }
  }, [router]);

  const prefetchCommonRoutes = useCallback((lang: string) => {
    if (!PERFORMANCE_FLAGS.ENABLE_PREFETCH) return;

    const commonRoutes = PREFETCH_CONFIG.COMMON_ROUTES.map(route => `/${lang}${route}`);

    // Prefetch with delay to avoid blocking main thread
    setTimeout(() => {
      commonRoutes.slice(0, PREFETCH_CONFIG.MAX_PREFETCH_COUNT).forEach(route => {
        prefetchRoute(route);
      });
    }, PREFETCH_CONFIG.PREFETCH_DELAY);
  }, [prefetchRoute]);

  const clearPrefetchCache = useCallback(() => {
    prefetchedRoutes.current.clear();
  }, []);

  return {
    prefetchRoute,
    prefetchCommonRoutes,
    clearPrefetchCache,
  };
}
