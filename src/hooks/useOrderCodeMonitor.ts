/**
 * Hook for monitoring order codes and detecting duplicates in real-time
 */

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { getCurrentOrderCodeCounter } from '@/lib/orderCodeUtils';

interface OrderCodeStats {
  currentCounter: number | null;
  totalOrders: number;
  duplicateCodes: string[];
  isLoading: boolean;
  error: string | null;
}

export function useOrderCodeMonitor() {
  const [stats, setStats] = useState<OrderCodeStats>({
    currentCounter: null,
    totalOrders: 0,
    duplicateCodes: [],
    isLoading: true,
    error: null
  });

  const checkForDuplicates = useCallback((orders: any) => {
    const codeCount: { [key: string]: number } = {};
    
    // Count occurrences of each order code
    Object.values(orders || {}).forEach((order: any) => {
      if (order.orderCode) {
        codeCount[order.orderCode] = (codeCount[order.orderCode] || 0) + 1;
      }
    });

    // Find duplicates
    return Object.keys(codeCount).filter(code => codeCount[code] > 1);
  }, []);

  const loadCounter = useCallback(async () => {
    try {
      const counter = await getCurrentOrderCodeCounter();
      setStats(prev => ({ ...prev, currentCounter: counter, error: null }));
    } catch (error) {
      console.error('Error loading counter:', error);
      setStats(prev => ({ ...prev, error: String(error) }));
    }
  }, []);

  useEffect(() => {
    let ordersListener: any = null;
    let counterListener: any = null;

    const setupListeners = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Load initial counter value
        await loadCounter();

        // Listen to orders changes
        const ordersRef = ref(database, 'orders');
        ordersListener = onValue(ordersRef, (snapshot) => {
          try {
            const orders = snapshot.val();
            const totalOrders = orders ? Object.keys(orders).length : 0;
            const duplicateCodes = checkForDuplicates(orders);

            setStats(prev => ({
              ...prev,
              totalOrders,
              duplicateCodes,
              isLoading: false,
              error: null
            }));
          } catch (error) {
            console.error('Error processing orders data:', error);
            setStats(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: String(error) 
            }));
          }
        }, (error) => {
          console.error('Error listening to orders:', error);
          setStats(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: String(error) 
          }));
        });

        // Listen to counter changes
        const counterRef = ref(database, 'system_settings/orderCodeConfig');
        counterListener = onValue(counterRef, (snapshot) => {
          try {
            const data = snapshot.val();
            const counter = data?.nextOrderCode || null;
            setStats(prev => ({ ...prev, currentCounter: counter }));
          } catch (error) {
            console.error('Error processing counter data:', error);
          }
        });

      } catch (error) {
        console.error('Error setting up listeners:', error);
        setStats(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: String(error) 
        }));
      }
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      if (ordersListener) {
        const ordersRef = ref(database, 'orders');
        off(ordersRef, 'value', ordersListener);
      }
      if (counterListener) {
        const counterRef = ref(database, 'system_settings/orderCodeConfig');
        off(counterRef, 'value', counterListener);
      }
    };
  }, [checkForDuplicates, loadCounter]);

  const refreshStats = useCallback(async () => {
    await loadCounter();
  }, [loadCounter]);

  return {
    ...stats,
    refreshStats,
    hasDuplicates: stats.duplicateCodes.length > 0
  };
}

/**
 * Hook for validating order codes before creation
 */
export function useOrderCodeValidator() {
  const [isValidating, setIsValidating] = useState(false);

  const validateOrderCode = useCallback(async (orderCode: string): Promise<boolean> => {
    setIsValidating(true);
    try {
      const ordersRef = ref(database, 'orders');
      return new Promise((resolve, reject) => {
        const listener = onValue(ordersRef, (snapshot) => {
          try {
            const orders = snapshot.val();
            let isUnique = true;

            if (orders) {
              for (const [orderId, orderData] of Object.entries(orders)) {
                if ((orderData as any).orderCode === orderCode) {
                  isUnique = false;
                  break;
                }
              }
            }

            // Clean up listener
            off(ordersRef, 'value', listener);
            resolve(isUnique);
          } catch (error) {
            off(ordersRef, 'value', listener);
            reject(error);
          }
        }, (error) => {
          off(ordersRef, 'value', listener);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error validating order code:', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateOrderCode,
    isValidating
  };
}
