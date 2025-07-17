/**
 * @file src/lib/quantitySync.ts
 * @description Utility functions to sync product quantities with actual order data
 */

import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Product, Order } from '@/types';

/**
 * Calculate actual rented quantity for a product based on active orders
 */
export function calculateActualRentedQuantity(productId: string, orders: Order[]): number {
  const activeStatuses = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Overdue'];
  
  return orders
    .filter(order => 
      order.transactionType === 'Rental' && 
      activeStatuses.includes(order.status)
    )
    .reduce((total, order) => {
      if (order.items && order.items.length > 0) {
        // New format with items array
        const productItems = order.items.filter(item => item.productId === productId);
        return total + productItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      } else if (order.productId === productId) {
        // Legacy format with single productId
        return total + 1;
      }
      return total;
    }, 0);
}

/**
 * Sync all product quantities with actual order data
 */
export async function syncAllProductQuantities(): Promise<{
  updated: number;
  errors: string[];
  report: Array<{
    productId: string;
    productName: string;
    oldQuantity: number;
    newQuantity: number;
  }>;
}> {
  const result = {
    updated: 0,
    errors: [] as string[],
    report: [] as Array<{
      productId: string;
      productName: string;
      oldQuantity: number;
      newQuantity: number;
    }>
  };

  try {
    // Fetch all products
    const productsRef = ref(database, 'products');
    const productsSnapshot = await get(productsRef);
    
    if (!productsSnapshot.exists()) {
      result.errors.push('No products found in database');
      return result;
    }

    // Fetch all orders
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);
    
    const orders: Order[] = [];
    if (ordersSnapshot.exists()) {
      const ordersData = ordersSnapshot.val();
      Object.entries(ordersData).forEach(([id, data]: [string, any]) => {
        orders.push({ id, ...data } as Order);
      });
    }

    const productsData = productsSnapshot.val();
    const updatePromises: Promise<void>[] = [];

    // Process each product
    for (const [productId, productData] of Object.entries(productsData)) {
      try {
        const product = productData as Product;
        const actualRentedQuantity = calculateActualRentedQuantity(productId, orders);
        const currentQuantityRented = product.quantityRented || 0;

        // Only update if there's a difference
        if (actualRentedQuantity !== currentQuantityRented) {
          const productRef = ref(database, `products/${productId}`);
          const updatePromise = update(productRef, {
            quantityRented: actualRentedQuantity,
            updatedAt: new Date().toISOString()
          });
          
          updatePromises.push(updatePromise);
          
          result.report.push({
            productId,
            productName: product.name || 'Unknown Product',
            oldQuantity: currentQuantityRented,
            newQuantity: actualRentedQuantity
          });
          
          result.updated++;
        }
      } catch (error) {
        result.errors.push(`Error processing product ${productId}: ${error}`);
      }
    }

    // Execute all updates
    await Promise.all(updatePromises);

  } catch (error) {
    result.errors.push(`General error: ${error}`);
  }

  return result;
}

/**
 * Sync quantity for a specific product
 */
export async function syncProductQuantity(productId: string): Promise<{
  success: boolean;
  oldQuantity: number;
  newQuantity: number;
  error?: string;
}> {
  try {
    // Fetch the product
    const productRef = ref(database, `products/${productId}`);
    const productSnapshot = await get(productRef);
    
    if (!productSnapshot.exists()) {
      return {
        success: false,
        oldQuantity: 0,
        newQuantity: 0,
        error: 'Product not found'
      };
    }

    // Fetch all orders
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);
    
    const orders: Order[] = [];
    if (ordersSnapshot.exists()) {
      const ordersData = ordersSnapshot.val();
      Object.entries(ordersData).forEach(([id, data]: [string, any]) => {
        orders.push({ id, ...data } as Order);
      });
    }

    const product = productSnapshot.val() as Product;
    const actualRentedQuantity = calculateActualRentedQuantity(productId, orders);
    const currentQuantityRented = product.quantityRented || 0;

    // Update if there's a difference
    if (actualRentedQuantity !== currentQuantityRented) {
      await update(productRef, {
        quantityRented: actualRentedQuantity,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      oldQuantity: currentQuantityRented,
      newQuantity: actualRentedQuantity
    };

  } catch (error) {
    return {
      success: false,
      oldQuantity: 0,
      newQuantity: 0,
      error: String(error)
    };
  }
}
