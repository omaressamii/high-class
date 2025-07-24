'use client';

import { useCallback, useMemo, useRef } from 'react';

/**
 * Hook for performance optimization utilities
 */
export function usePerformanceOptimization() {
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounce function to prevent excessive calls
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string = 'default'
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        debounceTimers.current.delete(key);
      }, delay);

      debounceTimers.current.set(key, timer);
    };
  }, []);

  // Throttle function to limit execution frequency
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }, []);

  // Memoized empty array to prevent unnecessary re-renders
  const emptyArray = useMemo(() => [], []);

  // Memoized empty object to prevent unnecessary re-renders
  const emptyObject = useMemo(() => ({}), []);

  return {
    debounce,
    throttle,
    emptyArray,
    emptyObject,
  };
}
