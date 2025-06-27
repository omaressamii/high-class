'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Database, Wifi, RefreshCw } from 'lucide-react';

interface DataLoaderProps {
  isLoading?: boolean;
  message?: string;
  className?: string;
  type?: 'data' | 'network' | 'sync';
  showIcon?: boolean;
}

const DataLoaderComponent = ({
  isLoading = true,
  message,
  className,
  type = 'data',
  showIcon = true,
}: DataLoaderProps) => {
  if (!isLoading) return null;

  const getIcon = () => {
    switch (type) {
      case 'network':
        return <Wifi className="w-6 h-6 text-primary animate-pulse" />;
      case 'sync':
        return <RefreshCw className="w-6 h-6 text-primary animate-spin" />;
      default:
        return <Database className="w-6 h-6 text-primary animate-bounce" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'network':
        return 'جار الاتصال بالخادم...';
      case 'sync':
        return 'جار مزامنة البيانات...';
      default:
        return 'جار تحميل البيانات...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4 p-8',
      className
    )}>
      {/* Icon and spinner */}
      {showIcon && (
        <div className="relative">
          {getIcon()}
          <div className="absolute -inset-2 border-2 border-primary/20 rounded-full animate-ping" />
        </div>
      )}

      {/* Loading message */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground">{displayMessage}</p>
        
        {/* Progress dots */}
        <div className="flex space-x-1 rtl:space-x-reverse justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 bg-muted rounded shimmer" />
        <div className="h-2 bg-muted rounded shimmer animation-delay-150" />
        <div className="h-2 bg-muted rounded shimmer animation-delay-300 w-3/4" />
      </div>
    </div>
  );
};

DataLoaderComponent.displayName = 'DataLoader';
export const DataLoader = React.memo(DataLoaderComponent);
