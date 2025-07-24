import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Order } from '@/types';

/**
 * Check if a product is available for rental during a specific date range
 * @param productId - The ID of the product to check
 * @param deliveryDate - The delivery date for the new rental
 * @param returnDate - The return date for the new rental
 * @param excludeOrderId - Optional order ID to exclude from the check (useful for updates)
 * @returns Promise<{ available: boolean, conflictingOrders: Order[] }>
 */
export async function checkProductAvailabilityForRental(
  productId: string,
  deliveryDate: string,
  returnDate: string,
  excludeOrderId?: string
): Promise<{ available: boolean; conflictingOrders: Order[] }> {
  try {
    // Fetch all orders from the database
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);

    if (!ordersSnapshot.exists()) {
      return { available: true, conflictingOrders: [] };
    }

    const ordersData = ordersSnapshot.val();
    const conflictingOrders: Order[] = [];
    
    // Convert dates to Date objects for comparison
    const newDeliveryDate = new Date(deliveryDate);
    const newReturnDate = new Date(returnDate);

    // Statuses that indicate the product is still rented/unavailable
    const activeRentalStatuses = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Overdue'];

    Object.entries(ordersData).forEach(([orderId, orderData]: [string, any]) => {
      const order = orderData as Order;

      // Skip the order being excluded (useful for updates)
      if (excludeOrderId && orderId === excludeOrderId) {
        return;
      }

      // Only check rental orders with active statuses
      if (order.transactionType !== 'Rental' || !activeRentalStatuses.includes(order.status)) {
        return;
      }

      // Check if this order contains the product we're checking
      let hasProduct = false;
      if (order.items && order.items.length > 0) {
        // New format with items array
        hasProduct = order.items.some(item => item.productId === productId);
      } else if (order.productId === productId) {
        // Legacy format with single productId
        hasProduct = true;
      }

      if (!hasProduct) {
        return;
      }

      // Check for date conflicts
      if (order.deliveryDate && order.returnDate) {
        const existingDeliveryDate = new Date(order.deliveryDate);
        const existingReturnDate = new Date(order.returnDate);

        // Check if the date ranges overlap
        // Two date ranges overlap if: start1 <= end2 && start2 <= end1
        const hasOverlap = newDeliveryDate <= existingReturnDate && existingDeliveryDate <= newReturnDate;

        if (hasOverlap) {
          conflictingOrders.push({ ...order, id: orderId });
        }
      }
    });

    return {
      available: conflictingOrders.length === 0,
      conflictingOrders
    };
  } catch (error) {
    console.error('Error checking product availability for rental:', error);
    throw new Error('Failed to check product availability');
  }
}

/**
 * Check if multiple products are available for rental during a specific date range
 * @param productQuantities - Array of objects with productId and quantity
 * @param deliveryDate - The delivery date for the new rental
 * @param returnDate - The return date for the new rental
 * @param excludeOrderId - Optional order ID to exclude from the check
 * @returns Promise<{ available: boolean, conflicts: Array<{productId: string, productName?: string, conflictingOrders: Order[]}> }>
 */
export async function checkMultipleProductsAvailability(
  productQuantities: Array<{ productId: string; quantity: number; productName?: string }>,
  deliveryDate: string,
  returnDate: string,
  excludeOrderId?: string
): Promise<{
  available: boolean;
  conflicts: Array<{ productId: string; productName?: string; conflictingOrders: Order[] }>;
}> {
  try {
    const conflicts: Array<{ productId: string; productName?: string; conflictingOrders: Order[] }> = [];

    // Check each product individually
    for (const item of productQuantities) {
      const result = await checkProductAvailabilityForRental(
        item.productId,
        deliveryDate,
        returnDate,
        excludeOrderId
      );

      if (!result.available) {
        conflicts.push({
          productId: item.productId,
          productName: item.productName,
          conflictingOrders: result.conflictingOrders
        });
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts
    };
  } catch (error) {
    console.error('Error checking multiple products availability:', error);
    throw new Error('Failed to check products availability');
  }
}

/**
 * Get detailed availability information for a product
 * @param productId - The ID of the product to check
 * @returns Promise<{ productId: string, rentalSchedule: Array<{orderId: string, deliveryDate: string, returnDate: string, status: string}> }>
 */
export async function getProductRentalSchedule(productId: string): Promise<{
  productId: string;
  rentalSchedule: Array<{
    orderId: string;
    deliveryDate: string;
    returnDate: string;
    status: string;
    customerName?: string;
  }>;
}> {
  try {
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);

    if (!ordersSnapshot.exists()) {
      return { productId, rentalSchedule: [] };
    }

    const ordersData = ordersSnapshot.val();
    const rentalSchedule: Array<{
      orderId: string;
      deliveryDate: string;
      returnDate: string;
      status: string;
      customerName?: string;
    }> = [];

    const activeRentalStatuses = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Overdue'];

    Object.entries(ordersData).forEach(([orderId, orderData]: [string, any]) => {
      const order = orderData as Order;

      // Only check rental orders with active statuses
      if (order.transactionType !== 'Rental' || !activeRentalStatuses.includes(order.status)) {
        return;
      }

      // Check if this order contains the product
      let hasProduct = false;
      if (order.items && order.items.length > 0) {
        hasProduct = order.items.some(item => item.productId === productId);
      } else if (order.productId === productId) {
        hasProduct = true;
      }

      if (hasProduct && order.deliveryDate && order.returnDate) {
        rentalSchedule.push({
          orderId,
          deliveryDate: order.deliveryDate,
          returnDate: order.returnDate,
          status: order.status,
          customerName: order.customerName
        });
      }
    });

    // Sort by delivery date
    rentalSchedule.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());

    return { productId, rentalSchedule };
  } catch (error) {
    console.error('Error getting product rental schedule:', error);
    throw new Error('Failed to get product rental schedule');
  }
}
