'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationLoaderProps {
  className?: string;
}

const NavigationLoaderComponent = ({ className }: NavigationLoaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);

      // Auto complete after 5 seconds if still loading
      timeoutId = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, 5000);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);

      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Listen for route changes
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleStart();
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      handleStart();
      return originalReplace.apply(router, args);
    };

    // Listen for pathname changes to detect completion
    const currentPath = pathname;
    const checkPathChange = () => {
      if (pathname !== currentPath && isLoading) {
        handleComplete();
      }
    };

    const observer = new MutationObserver(checkPathChange);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router, pathname, isLoading]);

  // Listen for pathname changes
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }
  }, [pathname, isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent",
        className
      )}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        />
      </div>

      {/* Loading Overlay */}
      <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Logo/Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-secondary rounded-full animate-spin animation-delay-150" />
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground animate-pulse">
              جار التحميل...
            </p>
            <div className="flex space-x-1 rtl:space-x-reverse justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200" />
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </>
  );
};

NavigationLoaderComponent.displayName = 'NavigationLoader';
export const NavigationLoader = React.memo(NavigationLoaderComponent);
