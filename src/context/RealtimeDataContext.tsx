'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Product, Order, Customer, User, FinancialTransaction, Branch } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface RealtimeDataState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  users: User[];
  financialTransactions: FinancialTransaction[];
  branches: Branch[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastUpdated: {
    products?: Date;
    orders?: Date;
    customers?: Date;
    users?: Date;
    financialTransactions?: Date;
    branches?: Date;
  };
}

interface RealtimeDataContextType extends RealtimeDataState {
  refreshData: (collection?: keyof Omit<RealtimeDataState, 'isLoading' | 'connectionStatus' | 'lastUpdated'>) => void;
  subscribeToCollection: (collection: string) => void;
  unsubscribeFromCollection: (collection: string) => void;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

interface RealtimeDataProviderProps {
  children: ReactNode;
  enableNotifications?: boolean;
}

export function RealtimeDataProvider({ children, enableNotifications = true }: RealtimeDataProviderProps) {
  const { toast } = useToast();
  const [state, setState] = useState<RealtimeDataState>({
    products: [],
    orders: [],
    customers: [],
    users: [],
    financialTransactions: [],
    branches: [],
    isLoading: true,
    connectionStatus: 'connecting',
    lastUpdated: {},
  });

  // Keep track of active listeners
  const listenersRef = React.useRef<Map<string, DatabaseReference>>(new Map());
  const isInitialLoadRef = React.useRef<Map<string, boolean>>(new Map());

  // Helper function to transform Firebase data
  const transformFirebaseData = useCallback(<T extends { id?: string }>(data: any): T[] => {
    if (!data) return [];
    return Object.entries(data).map(([id, item]: [string, any]) => ({
      id,
      ...item,
    })) as T[];
  }, []);

  // Generic function to set up listeners
  const setupListener = useCallback((
    collection: string,
    stateKey: keyof Omit<RealtimeDataState, 'isLoading' | 'connectionStatus' | 'lastUpdated'>
  ) => {
    const collectionRef = ref(database, collection);
    listenersRef.current.set(collection, collectionRef);
    
    const isInitialLoad = !isInitialLoadRef.current.get(collection);
    isInitialLoadRef.current.set(collection, true);

    const listener = onValue(
      collectionRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const transformedData = transformFirebaseData(data);
          
          setState(prev => ({
            ...prev,
            [stateKey]: transformedData,
            connectionStatus: 'connected',
            lastUpdated: {
              ...prev.lastUpdated,
              [stateKey]: new Date(),
            },
          }));

          // Show notification for updates (not initial load)
          if (enableNotifications && !isInitialLoad && transformedData.length > 0) {
            const collectionName = collection.charAt(0).toUpperCase() + collection.slice(1);
            toast({
              title: "تحديث البيانات",
              description: `تم تحديث ${collectionName} في الوقت الفعلي`,
              duration: 3000,
            });
          }
        } catch (error) {
          console.error(`Error processing ${collection} data:`, error);
          setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        }
      },
      (error) => {
        console.error(`Error listening to ${collection}:`, error);
        setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        
        if (enableNotifications) {
          toast({
            title: "خطأ في الاتصال",
            description: `فشل في الاتصال بـ ${collection}`,
            variant: "destructive",
          });
        }
      }
    );

    return listener;
  }, [transformFirebaseData, enableNotifications, toast]);

  // Initialize all listeners
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, connectionStatus: 'connecting' }));

    // Set up listeners for all collections
    const collections = [
      { name: 'products', stateKey: 'products' as const },
      { name: 'orders', stateKey: 'orders' as const },
      { name: 'customers', stateKey: 'customers' as const },
      { name: 'users', stateKey: 'users' as const },
      { name: 'financial_transactions', stateKey: 'financialTransactions' as const },
      { name: 'branches', stateKey: 'branches' as const },
    ];

    collections.forEach(({ name, stateKey }) => {
      setupListener(name, stateKey);
    });

    // Set loading to false after a short delay to allow initial data to load
    const loadingTimeout = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 2000);

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      listenersRef.current.forEach((listenerRef, collection) => {
        off(listenerRef);
      });
      listenersRef.current.clear();
      isInitialLoadRef.current.clear();
    };
  }, [setupListener]);

  // Manual refresh function
  const refreshData = useCallback((collection?: keyof Omit<RealtimeDataState, 'isLoading' | 'connectionStatus' | 'lastUpdated'>) => {
    if (collection) {
      // Refresh specific collection
      const collectionName = collection === 'financialTransactions' ? 'financial_transactions' : collection;
      const existingRef = listenersRef.current.get(collectionName);
      if (existingRef) {
        off(existingRef);
        setupListener(collectionName, collection);
      }
    } else {
      // Refresh all collections
      listenersRef.current.forEach((listenerRef, collectionName) => {
        off(listenerRef);
      });
      listenersRef.current.clear();
      
      // Re-setup all listeners
      const collections = [
        { name: 'products', stateKey: 'products' as const },
        { name: 'orders', stateKey: 'orders' as const },
        { name: 'customers', stateKey: 'customers' as const },
        { name: 'users', stateKey: 'users' as const },
        { name: 'financial_transactions', stateKey: 'financialTransactions' as const },
        { name: 'branches', stateKey: 'branches' as const },
      ];

      collections.forEach(({ name, stateKey }) => {
        setupListener(name, stateKey);
      });
    }
  }, [setupListener]);

  // Subscribe to specific collection
  const subscribeToCollection = useCallback((collection: string) => {
    if (!listenersRef.current.has(collection)) {
      const stateKey = collection === 'financial_transactions' ? 'financialTransactions' : collection;
      setupListener(collection, stateKey as keyof Omit<RealtimeDataState, 'isLoading' | 'connectionStatus' | 'lastUpdated'>);
    }
  }, [setupListener]);

  // Unsubscribe from specific collection
  const unsubscribeFromCollection = useCallback((collection: string) => {
    const listenerRef = listenersRef.current.get(collection);
    if (listenerRef) {
      off(listenerRef);
      listenersRef.current.delete(collection);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    refreshData,
    subscribeToCollection,
    unsubscribeFromCollection,
  }), [state, refreshData, subscribeToCollection, unsubscribeFromCollection]);

  return (
    <RealtimeDataContext.Provider value={contextValue}>
      {children}
    </RealtimeDataContext.Provider>
  );
}

export function useRealtimeData() {
  const context = useContext(RealtimeDataContext);
  if (context === undefined) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  return context;
}

// Specific hooks for individual collections
export function useRealtimeProducts() {
  const { products, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    products,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.products
  };
}

export function useRealtimeOrders() {
  const { orders, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    orders,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.orders
  };
}

export function useRealtimeCustomers() {
  const { customers, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    customers,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.customers
  };
}

export function useRealtimeFinancials() {
  const { financialTransactions, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    financialTransactions,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.financialTransactions
  };
}

export function useRealtimeUsers() {
  const { users, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    users,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.users
  };
}

export function useRealtimeBranches() {
  const { branches, isLoading, connectionStatus, lastUpdated } = useRealtimeData();
  return {
    branches,
    isLoading,
    connectionStatus,
    lastUpdated: lastUpdated.branches
  };
}
