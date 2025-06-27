'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2, Zap } from 'lucide-react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransitionComponent = ({ children, className }: PageTransitionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let completeTimeout: NodeJS.Timeout;

    const startTransition = () => {
      setIsLoading(true);
      setProgress(0);

      // Animate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 20;
        });
      }, 50);

      // Complete transition
      completeTimeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 800);
    };

    startTransition();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (completeTimeout) clearTimeout(completeTimeout);
    };
  }, [pathname]);

  return (
    <div className={cn("relative", className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6 max-w-sm mx-auto text-center">
            {/* Animated Icon */}
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
              <Zap className="absolute inset-0 m-auto w-8 h-8 text-primary animate-bounce" />
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Loading Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                جار تحميل الصفحة
              </h3>
              <p className="text-sm text-muted-foreground">
                يرجى الانتظار قليلاً...
              </p>
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Animated Dots */}
            <div className="flex space-x-1 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={cn(
        "transition-opacity duration-300",
        isLoading ? "opacity-50" : "opacity-100"
      )}>
        {children}
      </div>
    </div>
  );
};

PageTransitionComponent.displayName = 'PageTransition';
export const PageTransition = React.memo(PageTransitionComponent);
