
'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (runs only on client-side)
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
      const documentChangeHandler = () => setMatches(mediaQueryList.matches);

      // Initial check
      documentChangeHandler();

      // Listen for changes
      try {
        mediaQueryList.addEventListener('change', documentChangeHandler);
      } catch (e) {
        // For older browsers
        mediaQueryList.addListener(documentChangeHandler);
      }
      
      return () => {
        try {
          mediaQueryList.removeEventListener('change', documentChangeHandler);
        } catch (e) {
          // For older browsers
          mediaQueryList.removeListener(documentChangeHandler);
        }
      };
    }
  }, [query]);

  return matches;
}
