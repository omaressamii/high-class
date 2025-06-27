'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface PageLoaderProps {
  isLoading?: boolean;
  message?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'fancy';
  size?: 'sm' | 'md' | 'lg';
}

const PageLoaderComponent = ({
  isLoading = true,
  message = 'جار التحميل...',
  className,
  variant = 'default',
  size = 'md',
}: PageLoaderProps) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerSizes = {
    sm: 'min-h-[200px]',
    md: 'min-h-[300px]',
    lg: 'min-h-[400px]',
  };

  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        containerSizes[size],
        className
      )}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
          <span className="text-muted-foreground">{message}</span>
        </div>
      </div>
    );
  }

  if (variant === 'fancy') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        containerSizes[size],
        className
      )}>
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse" />
          
          {/* Inner spinning ring */}
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary border-r-secondary rounded-full animate-spin" />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-bounce" />
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-secondary rounded-full animate-ping animation-delay-300" />
          <div className="absolute top-1/2 -left-4 w-1 h-1 bg-accent rounded-full animate-ping animation-delay-600" />
          
          {/* Loading text */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-sm font-medium text-foreground mb-2">{message}</p>
            <div className="flex space-x-1 rtl:space-x-reverse justify-center">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce animation-delay-100" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce animation-delay-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4',
      containerSizes[size],
      className
    )}>
      {/* Main loader */}
      <div className="relative">
        <div className={cn(
          'border-4 border-primary/20 border-t-primary rounded-full animate-spin',
          sizeClasses[size]
        )} />
        <div className={cn(
          'absolute inset-0 border-4 border-transparent border-r-secondary rounded-full animate-spin animation-delay-150',
          sizeClasses[size]
        )} />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex space-x-1 rtl:space-x-reverse justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>
    </div>
  );
};

PageLoaderComponent.displayName = 'PageLoader';
export const PageLoader = React.memo(PageLoaderComponent);
