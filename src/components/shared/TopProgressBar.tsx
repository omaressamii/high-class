'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TopProgressBarProps {
  className?: string;
  height?: number;
  color?: string;
  speed?: number;
  showSpinner?: boolean;
}

const TopProgressBarComponent = ({
  className,
  height = 3,
  color = 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
  speed = 200,
  showSpinner = true,
}: TopProgressBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      const updateProgress = () => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 30;
          return Math.min(prev + increment, 90);
        });
      };

      progressTimer = setInterval(updateProgress, speed);

      // Auto complete after 3 seconds if still loading
      timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 3000);
    };

    const completeLoading = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);

      if (timer) clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
    };

    // Start loading on route change
    startLoading();

    // Complete loading after a short delay (simulating page load)
    const completeTimer = setTimeout(completeLoading, 500);

    return () => {
      if (timer) clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [pathname, searchParams, speed]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[9999] pointer-events-none",
      className
    )}>
      {/* Progress Bar */}
      <div
        className={cn("transition-all duration-300 ease-out", color)}
        style={{
          height: `${height}px`,
          width: `${progress}%`,
          boxShadow: `0 0 10px rgba(59, 130, 246, 0.5)`,
        }}
      />

      {/* Spinner */}
      {showSpinner && isLoading && (
        <div className="absolute top-2 right-4 rtl:left-4 rtl:right-auto">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

TopProgressBarComponent.displayName = 'TopProgressBar';
export const TopProgressBar = React.memo(TopProgressBarComponent);
