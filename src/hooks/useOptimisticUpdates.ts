'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdateOptions {
  successMessage?: string;
  errorMessage?: string;
  lang?: 'ar' | 'en';
}

interface OptimisticState<T> {
  data: T[];
  isUpdating: boolean;
  error: string | null;
}

export function useOptimisticUpdates<T extends { id: string }>(
  initialData: T[],
  options: OptimisticUpdateOptions = {}
) {
  const { toast } = useToast();
  const { lang = 'ar', successMessage, errorMessage } = options;

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isUpdating: false,
    error: null,
  });

  // Add item optimistically
  const addOptimistic = useCallback(async (
    newItem: T,
    asyncOperation: () => Promise<void>
  ) => {
    // Add item immediately to UI
    setState(prev => ({
      ...prev,
      data: [...prev.data, newItem],
      isUpdating: true,
      error: null,
    }));

    try {
      await asyncOperation();
      setState(prev => ({
        ...prev,
        isUpdating: false,
      }));

      if (successMessage) {
        toast({
          title: lang === 'ar' ? 'تم بنجاح' : 'Success',
          description: successMessage,
        });
      }
    } catch (error) {
      // Remove the optimistically added item on error
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== newItem.id),
        isUpdating: false,
        error: String(error),
      }));

      toast({
        title: lang === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage || (lang === 'ar' ? 'حدث خطأ أثناء العملية' : 'An error occurred'),
        variant: 'destructive',
      });
    }
  }, [toast, lang, successMessage, errorMessage]);

  // Update item optimistically
  const updateOptimistic = useCallback(async (
    itemId: string,
    updates: Partial<T>,
    asyncOperation: () => Promise<void>
  ) => {
    // Store original item for rollback
    const originalItem = state.data.find(item => item.id === itemId);
    if (!originalItem) return;

    // Update item immediately in UI
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ),
      isUpdating: true,
      error: null,
    }));

    try {
      await asyncOperation();
      setState(prev => ({
        ...prev,
        isUpdating: false,
      }));

      if (successMessage) {
        toast({
          title: lang === 'ar' ? 'تم التحديث' : 'Updated',
          description: successMessage,
        });
      }
    } catch (error) {
      // Rollback to original item on error
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => 
          item.id === itemId ? originalItem : item
        ),
        isUpdating: false,
        error: String(error),
      }));

      toast({
        title: lang === 'ar' ? 'خطأ في التحديث' : 'Update Error',
        description: errorMessage || (lang === 'ar' ? 'فشل في تحديث العنصر' : 'Failed to update item'),
        variant: 'destructive',
      });
    }
  }, [state.data, toast, lang, successMessage, errorMessage]);

  // Delete item optimistically
  const deleteOptimistic = useCallback(async (
    itemId: string,
    asyncOperation: () => Promise<void>
  ) => {
    // Store original item for rollback
    const originalItem = state.data.find(item => item.id === itemId);
    if (!originalItem) return;

    // Remove item immediately from UI
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== itemId),
      isUpdating: true,
      error: null,
    }));

    try {
      await asyncOperation();
      setState(prev => ({
        ...prev,
        isUpdating: false,
      }));

      toast({
        title: lang === 'ar' ? 'تم الحذف' : 'Deleted',
        description: successMessage || (lang === 'ar' ? 'تم حذف العنصر بنجاح' : 'Item deleted successfully'),
      });
    } catch (error) {
      // Restore the deleted item on error
      setState(prev => ({
        ...prev,
        data: [...prev.data, originalItem],
        isUpdating: false,
        error: String(error),
      }));

      toast({
        title: lang === 'ar' ? 'خطأ في الحذف' : 'Delete Error',
        description: errorMessage || (lang === 'ar' ? 'فشل في حذف العنصر' : 'Failed to delete item'),
        variant: 'destructive',
      });
    }
  }, [state.data, toast, lang, successMessage, errorMessage]);

  // Sync with real-time data
  const syncData = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,
      error: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    data: state.data,
    isUpdating: state.isUpdating,
    error: state.error,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    syncData,
    clearError,
  };
}

// Specialized hook for common CRUD operations
export function useOptimisticCrud<T extends { id: string }>(
  initialData: T[],
  lang: 'ar' | 'en' = 'ar'
) {
  return useOptimisticUpdates(initialData, {
    lang,
    successMessage: lang === 'ar' ? 'تمت العملية بنجاح' : 'Operation completed successfully',
    errorMessage: lang === 'ar' ? 'حدث خطأ أثناء العملية' : 'An error occurred during the operation',
  });
}
