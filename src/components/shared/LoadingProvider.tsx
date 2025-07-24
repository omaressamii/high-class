'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadingState } from '@/hooks/use-loading-state';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const loadingState = useLoadingState({
    initialMessage: 'جار التحميل...',
    autoComplete: false,
  });

  return (
    <LoadingContext.Provider value={loadingState}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// HOC for automatic loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage?: string
) {
  const WrappedComponent = (props: P) => {
    const { isLoading, startLoading, stopLoading } = useLoading();

    React.useEffect(() => {
      startLoading(loadingMessage);
      
      // Simulate loading completion
      const timer = setTimeout(() => {
        stopLoading();
      }, 1000);

      return () => clearTimeout(timer);
    }, [startLoading, stopLoading]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{loadingMessage || 'جار التحميل...'}</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
