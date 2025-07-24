/**
 * Order validation utilities to ensure data integrity
 */

import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Order, OrderItem } from '@/types';

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an order before saving to database
 */
export async function validateOrder(
  orderData: Partial<Order>,
  lang: 'ar' | 'en' = 'en',
  excludeOrderId?: string
): Promise<OrderValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const t = {
    orderCodeRequired: lang === 'ar' ? 'كود الطلب مطلوب' : 'Order code is required',
    orderCodeExists: lang === 'ar' ? 'كود الطلب موجود مسبقاً' : 'Order code already exists',
    itemsRequired: lang === 'ar' ? 'يجب أن يحتوي الطلب على عنصر واحد على الأقل' : 'Order must contain at least one item',
    customerRequired: lang === 'ar' ? 'معرف العميل مطلوب' : 'Customer ID is required',
    invalidDate: lang === 'ar' ? 'تاريخ غير صحيح' : 'Invalid date',
    invalidPrice: lang === 'ar' ? 'السعر يجب أن يكون أكبر من صفر' : 'Price must be greater than zero',
    returnDateBeforeDelivery: lang === 'ar' ? 'تاريخ الإرجاع يجب أن يكون بعد تاريخ التسليم' : 'Return date must be after delivery date',
    paidAmountExceedsTotal: lang === 'ar' ? 'المبلغ المدفوع يتجاوز إجمالي السعر' : 'Paid amount exceeds total price'
  };

  try {
    // Check required fields
    if (!orderData.orderCode) {
      errors.push(t.orderCodeRequired);
    }

    if (!orderData.customerId) {
      errors.push(t.customerRequired);
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push(t.itemsRequired);
    }

    // Validate order code uniqueness
    if (orderData.orderCode) {
      const isDuplicate = await checkOrderCodeExists(orderData.orderCode, excludeOrderId);
      if (isDuplicate) {
        errors.push(t.orderCodeExists);
      }
    }

    // Validate dates
    if (orderData.orderDate) {
      const orderDate = new Date(orderData.orderDate);
      if (isNaN(orderDate.getTime())) {
        errors.push(`${t.invalidDate}: orderDate`);
      }
    }

    if (orderData.deliveryDate) {
      const deliveryDate = new Date(orderData.deliveryDate);
      if (isNaN(deliveryDate.getTime())) {
        errors.push(`${t.invalidDate}: deliveryDate`);
      }
    }

    if (orderData.returnDate && orderData.returnDate !== '2099-12-31') {
      const returnDate = new Date(orderData.returnDate);
      if (isNaN(returnDate.getTime())) {
        errors.push(`${t.invalidDate}: returnDate`);
      } else if (orderData.deliveryDate) {
        const deliveryDate = new Date(orderData.deliveryDate);
        if (returnDate <= deliveryDate) {
          errors.push(t.returnDateBeforeDelivery);
        }
      }
    }

    // Validate prices
    if (orderData.totalPrice !== undefined && orderData.totalPrice <= 0) {
      errors.push(t.invalidPrice);
    }

    if (orderData.paidAmount !== undefined && orderData.totalPrice !== undefined) {
      if (orderData.paidAmount > orderData.totalPrice) {
        warnings.push(t.paidAmountExceedsTotal);
      }
    }

    // Validate items
    if (orderData.items) {
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        const itemErrors = validateOrderItem(item, i, lang);
        errors.push(...itemErrors);
      }
    }

  } catch (error) {
    console.error('Error during order validation:', error);
    errors.push(lang === 'ar' ? 'خطأ في التحقق من صحة الطلب' : 'Error validating order');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates an individual order item
 */
function validateOrderItem(item: OrderItem, index: number, lang: 'ar' | 'en'): string[] {
  const errors: string[] = [];
  
  const t = {
    productIdRequired: lang === 'ar' ? 'معرف المنتج مطلوب' : 'Product ID is required',
    productNameRequired: lang === 'ar' ? 'اسم المنتج مطلوب' : 'Product name is required',
    invalidQuantity: lang === 'ar' ? 'الكمية يجب أن تكون أكبر من صفر' : 'Quantity must be greater than zero',
    invalidPrice: lang === 'ar' ? 'السعر يجب أن يكون أكبر من أو يساوي صفر' : 'Price must be greater than or equal to zero'
  };

  if (!item.productId) {
    errors.push(`${t.productIdRequired} (${lang === 'ar' ? 'العنصر' : 'Item'} ${index + 1})`);
  }

  if (!item.productName) {
    errors.push(`${t.productNameRequired} (${lang === 'ar' ? 'العنصر' : 'Item'} ${index + 1})`);
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push(`${t.invalidQuantity} (${lang === 'ar' ? 'العنصر' : 'Item'} ${index + 1})`);
  }

  if (item.priceAtTimeOfOrder < 0) {
    errors.push(`${t.invalidPrice} (${lang === 'ar' ? 'العنصر' : 'Item'} ${index + 1})`);
  }

  return errors;
}

/**
 * Checks if an order code already exists in the database
 */
export async function checkOrderCodeExists(orderCode: string, excludeOrderId?: string): Promise<boolean> {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);

    if (!snapshot.exists()) {
      return false;
    }

    const orders = snapshot.val();
    for (const [orderId, orderData] of Object.entries(orders)) {
      // Skip the order being edited (if excludeOrderId is provided)
      if (excludeOrderId && orderId === excludeOrderId) {
        continue;
      }

      if ((orderData as any).orderCode === orderCode) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking order code existence:', error);
    throw error;
  }
}

/**
 * Finds all orders with duplicate order codes
 */
export async function findDuplicateOrderCodes(): Promise<{ [code: string]: string[] }> {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);
    
    if (!snapshot.exists()) {
      return {};
    }

    const orders = snapshot.val();
    const codeToOrderIds: { [code: string]: string[] } = {};
    
    // Group order IDs by order code
    for (const [orderId, orderData] of Object.entries(orders)) {
      const orderCode = (orderData as any).orderCode;
      if (orderCode) {
        if (!codeToOrderIds[orderCode]) {
          codeToOrderIds[orderCode] = [];
        }
        codeToOrderIds[orderCode].push(orderId);
      }
    }

    // Filter to only include codes with duplicates
    const duplicates: { [code: string]: string[] } = {};
    for (const [code, orderIds] of Object.entries(codeToOrderIds)) {
      if (orderIds.length > 1) {
        duplicates[code] = orderIds;
      }
    }

    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate order codes:', error);
    throw error;
  }
}

/**
 * Repairs duplicate order codes by assigning new unique codes
 */
export async function repairDuplicateOrderCodes(lang: 'ar' | 'en' = 'en'): Promise<{
  repaired: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let repaired = 0;

  try {
    const duplicates = await findDuplicateOrderCodes();
    
    for (const [duplicateCode, orderIds] of Object.entries(duplicates)) {
      // Keep the first order with the original code, update the rest
      for (let i = 1; i < orderIds.length; i++) {
        try {
          const { generateUniqueOrderCode } = await import('./orderCodeUtils');
          const newCode = await generateUniqueOrderCode();
          
          const orderRef = ref(database, `orders/${orderIds[i]}`);
          const { update } = await import('firebase/database');
          await update(orderRef, { 
            orderCode: newCode,
            updatedAt: new Date().toISOString()
          });
          
          repaired++;
        } catch (error) {
          const errorMsg = lang === 'ar' 
            ? `فشل في إصلاح الطلب ${orderIds[i]}: ${error}`
            : `Failed to repair order ${orderIds[i]}: ${error}`;
          errors.push(errorMsg);
        }
      }
    }
  } catch (error) {
    const errorMsg = lang === 'ar' 
      ? `خطأ في إصلاح الأكواد المكررة: ${error}`
      : `Error repairing duplicate codes: ${error}`;
    errors.push(errorMsg);
  }

  return { repaired, errors };
}
