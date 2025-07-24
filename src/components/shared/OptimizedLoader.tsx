'use client';

import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  showText?: boolean;
}

const OptimizedLoaderComponent = ({ 
  size = 'md', 
  text, 
  className,
  showText = true 
}: OptimizedLoaderProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div className={cn(
      'flex justify-center items-center min-h-[100px]',
      containerClasses[size],
      className
    )}>
      <Loader className={cn(
        'animate-spin text-primary',
        sizeClasses[size]
      )} />
      {showText && text && (
        <p className="text-muted-foreground text-sm">{text}</p>
      )}
    </div>
  );
};

OptimizedLoaderComponent.displayName = 'OptimizedLoader';
export const OptimizedLoader = React.memo(OptimizedLoaderComponent);
