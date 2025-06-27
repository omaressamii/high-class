'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

interface LoadingActions {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

interface UseLoadingStateOptions {
  initialMessage?: string;
  autoComplete?: boolean;
  autoCompleteDelay?: number;
}

export function useLoadingState(options: UseLoadingStateOptions = {}): LoadingState & LoadingActions {
  const {
    initialMessage = 'جار التحميل...',
    autoComplete = false,
    autoCompleteDelay = 3000,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: initialMessage,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      progress: 0,
      message: message || prev.message,
      error: null,
    }));

    // Auto-increment progress
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.progress >= 90) return prev;
        return {
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 15, 90),
        };
      });
    }, 200);

    // Auto complete if enabled
    if (autoComplete) {
      timeoutRef.current = setTimeout(() => {
        stopLoading();
      }, autoCompleteDelay);
    }
  }, [autoComplete, autoCompleteDelay]);

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
    }));

    // Clear intervals and timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset progress after a short delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        progress: 0,
      }));
    }, 500);
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));

    // Clear intervals and timeouts on error
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      message: initialMessage,
      error: null,
    });

    // Clear intervals and timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    reset,
  };
}
