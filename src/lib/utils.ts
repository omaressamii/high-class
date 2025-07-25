import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FinancialTransaction } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the total cash balance for a user based on their processed financial transactions
 * Counts 'Payment Received' transactions as positive and 'Cashout' transactions as negative
 * @param userId - The user ID to calculate balance for
 * @param transactions - Array of all financial transactions
 * @returns The total cash balance for the user
 */
export function calculateUserCashBalance(userId: string, transactions: FinancialTransaction[]): number {
  return transactions
    .filter(transaction =>
      transaction.processedByUserId === userId &&
      (transaction.type === 'Payment Received' || transaction.type === 'Cashout')
    )
    .reduce((total, transaction) => {
      const amount = transaction.amount || 0;
      // Payment Received adds to balance, Cashout subtracts from balance
      return total + amount;
    }, 0);
}

/**
 * Get all payment transactions processed by a specific user
 * @param userId - The user ID to get transactions for
 * @param transactions - Array of all financial transactions
 * @returns Array of payment transactions processed by the user
 */
export function getUserPaymentTransactions(userId: string, transactions: FinancialTransaction[]): FinancialTransaction[] {
  return transactions.filter(transaction =>
    transaction.processedByUserId === userId &&
    transaction.type === 'Payment Received'
  );
}

/**
 * Get all cash-related transactions for a user (payments and cashouts)
 * @param userId - The user ID to get transactions for
 * @param transactions - Array of all financial transactions
 * @returns Array of cash-related transactions processed by the user
 */
export function getUserCashTransactions(userId: string, transactions: FinancialTransaction[]): FinancialTransaction[] {
  return transactions.filter(transaction =>
    transaction.processedByUserId === userId &&
    (transaction.type === 'Payment Received' || transaction.type === 'Cashout')
  );
}
