/**
 * @file src/lib/product-utils.ts
 * @description Utility functions for product operations
 */

import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Product } from '@/types';

/**
 * Check if a product code (barcode) already exists in the database
 * @param productCode - The product code to check
 * @param excludeProductId - Optional product ID to exclude from the check (useful for updates)
 * @returns Promise<boolean> - true if the product code exists, false otherwise
 */
export async function checkProductCodeExists(
  productCode: string, 
  excludeProductId?: string
): Promise<boolean> {
  try {
    // Get all products from Firebase Realtime Database
    const productsRef = ref(database, 'products');
    const productsSnapshot = await get(productsRef);

    if (!productsSnapshot.exists()) {
      return false; // No products exist, so the code is available
    }

    const productsData = productsSnapshot.val();
    
    // Search through all products to find a matching productCode
    for (const [productId, productData] of Object.entries(productsData)) {
      const product = productData as any;
      
      // Skip the product we're excluding (useful for updates)
      if (excludeProductId && productId === excludeProductId) {
        continue;
      }
      
      // Check if the product code matches
      if (product.productCode === productCode) {
        return true; // Product code already exists
      }
    }

    return false; // Product code is available
  } catch (error) {
    console.error('Error checking product code existence:', error);
    throw new Error('Failed to check product code availability');
  }
}

/**
 * Find a product by its product code
 * @param productCode - The product code to search for
 * @returns Promise<Product | null> - The product if found, null otherwise
 */
export async function findProductByCode(productCode: string): Promise<Product | null> {
  try {
    const productsRef = ref(database, 'products');
    const productsSnapshot = await get(productsRef);

    if (!productsSnapshot.exists()) {
      return null;
    }

    const productsData = productsSnapshot.val();
    
    // Search through all products to find a matching productCode
    for (const [productId, productData] of Object.entries(productsData)) {
      const product = productData as any;
      
      if (product.productCode === productCode) {
        return { id: productId, ...product } as Product;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding product by code:', error);
    throw new Error('Failed to find product by code');
  }
}

/**
 * Generate a unique product code by checking existing codes
 * @param baseCode - The base code to start from
 * @returns Promise<string> - A unique product code
 */
export async function generateUniqueProductCode(baseCode: number): Promise<string> {
  let currentCode = baseCode;
  let codeExists = true;
  
  // Keep incrementing until we find an available code
  while (codeExists) {
    const codeString = String(currentCode);
    codeExists = await checkProductCodeExists(codeString);
    
    if (codeExists) {
      currentCode++;
    }
  }
  
  return String(currentCode);
}
