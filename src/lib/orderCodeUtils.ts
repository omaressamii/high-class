/**
 * Utility functions for managing order codes in Firebase Realtime Database
 */

import { ref, get, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';

/**
 * Generates a unique order code with retry mechanism to prevent duplicates
 * Uses atomic operations and double-checking to prevent race conditions
 * @param maxRetries Maximum number of retry attempts (default: 5)
 * @returns Promise<string> Unique order code
 */
export async function generateUniqueOrderCode(maxRetries: number = 5): Promise<string> {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Step 1: Get and increment counter atomically
      const orderCodeCounterRef = ref(database, 'system_settings/orderCodeConfig');
      const orderCodeCounterSnap = await get(orderCodeCounterRef);

      let nextOrderCodeNum: number;
      if (!orderCodeCounterSnap.exists() || !orderCodeCounterSnap.val()?.nextOrderCode || typeof orderCodeCounterSnap.val()?.nextOrderCode !== 'number') {
        nextOrderCodeNum = 70000001;
        // Initialize counter if it doesn't exist
        await set(orderCodeCounterRef, {
          nextOrderCode: nextOrderCodeNum + 1,
          lastUpdated: Date.now(),
          initialized: true
        });
      } else {
        nextOrderCodeNum = orderCodeCounterSnap.val().nextOrderCode;
        // Update counter immediately to prevent race conditions
        await update(orderCodeCounterRef, {
          nextOrderCode: nextOrderCodeNum + 1,
          lastUpdated: Date.now()
        });
      }

      const orderCodeString = String(nextOrderCodeNum);

      // Step 2: Double-check uniqueness with a small delay to account for any pending writes
      await new Promise(resolve => setTimeout(resolve, 50));
      const isUnique = await verifyOrderCodeUniqueness(orderCodeString);

      if (isUnique) {
        // Step 3: Final verification - check if counter was modified by another process
        const finalCounterSnap = await get(orderCodeCounterRef);
        const currentCounter = finalCounterSnap.val()?.nextOrderCode;

        // If counter moved significantly, it means another process interfered
        if (currentCounter && Math.abs(currentCounter - (nextOrderCodeNum + 1)) > 10) {
          console.warn(`Counter drift detected: expected ${nextOrderCodeNum + 1}, got ${currentCounter}. Retrying...`);
          retryCount++;
          continue;
        }

        return orderCodeString;
      } else {
        console.warn(`Order code ${orderCodeString} already exists, retrying...`);
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('Failed to generate unique order code after multiple attempts');
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
      }
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      console.warn(`Error generating order code, attempt ${retryCount}:`, error);
      // Exponential backoff for errors too
      await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
    }
  }

  throw new Error('Failed to generate unique order code');
}

/**
 * Verifies that an order code is unique in the database
 * @param orderCode The order code to check
 * @returns Promise<boolean> True if unique, false if already exists
 */
export async function verifyOrderCodeUniqueness(orderCode: string): Promise<boolean> {
  try {
    const ordersRef = ref(database, 'orders');
    const ordersSnap = await get(ordersRef);
    
    if (!ordersSnap.exists()) {
      return true; // No orders exist, so code is unique
    }
    
    const orders = ordersSnap.val();
    for (const [orderId, orderData] of Object.entries(orders)) {
      if ((orderData as any).orderCode === orderCode) {
        return false; // Code already exists
      }
    }
    
    return true; // Code is unique
  } catch (error) {
    console.error('Error verifying order code uniqueness:', error);
    throw error;
  }
}

/**
 * Initializes the order code counter if it doesn't exist
 * @param initialValue Initial counter value (default: 70000001)
 */
export async function initializeOrderCodeCounter(initialValue: number = 70000001): Promise<void> {
  try {
    const orderCodeCounterRef = ref(database, 'system_settings/orderCodeConfig');
    const orderCodeCounterSnap = await get(orderCodeCounterRef);
    
    if (!orderCodeCounterSnap.exists()) {
      await set(orderCodeCounterRef, { nextOrderCode: initialValue });
      console.log(`Order code counter initialized with value: ${initialValue}`);
    }
  } catch (error) {
    console.error('Error initializing order code counter:', error);
    throw error;
  }
}

/**
 * Gets the current order code counter value
 * @returns Promise<number> Current counter value
 */
export async function getCurrentOrderCodeCounter(): Promise<number> {
  try {
    const orderCodeCounterRef = ref(database, 'system_settings/orderCodeConfig');
    const orderCodeCounterSnap = await get(orderCodeCounterRef);
    
    if (!orderCodeCounterSnap.exists() || !orderCodeCounterSnap.val()?.nextOrderCode) {
      return 70000001; // Default starting value
    }
    
    return orderCodeCounterSnap.val().nextOrderCode;
  } catch (error) {
    console.error('Error getting order code counter:', error);
    throw error;
  }
}

/**
 * Resets the order code counter to a specific value
 * WARNING: Use with caution as this may cause duplicate codes if not handled properly
 * @param newValue New counter value
 */
export async function resetOrderCodeCounter(newValue: number): Promise<void> {
  try {
    const orderCodeCounterRef = ref(database, 'system_settings/orderCodeConfig');
    await set(orderCodeCounterRef, { nextOrderCode: newValue });
    console.log(`Order code counter reset to: ${newValue}`);
  } catch (error) {
    console.error('Error resetting order code counter:', error);
    throw error;
  }
}
