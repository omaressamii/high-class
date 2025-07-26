import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FinancialTransaction, UserCashout } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the total cash balance for a user since their last cashout
 * Only counts 'Payment Received' transactions after the last cashout date
 * @param userId - The user ID to calculate balance for
 * @param transactions - Array of all financial transactions
 * @param cashouts - Array of user cashouts (optional, for optimization)
 * @returns The total cash balance for the user since last cashout
 */
export function calculateUserCashBalance(
  userId: string,
  transactions: FinancialTransaction[],
  cashouts: UserCashout[] = []
): number {
  // Find the last cashout date for this user
  const userCashouts = cashouts.filter(cashout => cashout.userId === userId);
  const lastCashout = userCashouts.length > 0
    ? userCashouts.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      )
    : null;

  const lastCashoutDate = lastCashout ? new Date(lastCashout.createdAt) : new Date(0);

  // Calculate balance from Payment Received transactions after last cashout
  return transactions
    .filter(transaction =>
      transaction.processedByUserId === userId &&
      transaction.type === 'Payment Received' &&
      new Date(transaction.createdAt || transaction.date) > lastCashoutDate
    )
    .reduce((total, transaction) => total + (transaction.amount || 0), 0);
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
 * Get all cash-related transactions for a user since last cashout
 * @param userId - The user ID to get transactions for
 * @param transactions - Array of all financial transactions
 * @param cashouts - Array of user cashouts
 * @returns Array of payment transactions since last cashout
 */
export function getUserCashTransactions(
  userId: string,
  transactions: FinancialTransaction[],
  cashouts: UserCashout[] = []
): FinancialTransaction[] {
  // Find the last cashout date for this user
  const userCashouts = cashouts.filter(cashout => cashout.userId === userId);
  const lastCashout = userCashouts.length > 0
    ? userCashouts.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      )
    : null;

  const lastCashoutDate = lastCashout ? new Date(lastCashout.createdAt) : new Date(0);

  return transactions.filter(transaction =>
    transaction.processedByUserId === userId &&
    transaction.type === 'Payment Received' &&
    new Date(transaction.createdAt || transaction.date) > lastCashoutDate
  );
}

/**
 * Get the last cashout for a user
 * @param userId - The user ID to get last cashout for
 * @param cashouts - Array of user cashouts
 * @returns The last cashout record or null if none exists
 */
export function getLastUserCashout(userId: string, cashouts: UserCashout[]): UserCashout | null {
  const userCashouts = cashouts.filter(cashout => cashout.userId === userId);
  if (userCashouts.length === 0) return null;

  return userCashouts.reduce((latest, current) =>
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
}

/**
 * Get total amount cashed out for a user (for reporting purposes)
 * @param userId - The user ID to get total cashouts for
 * @param cashouts - Array of user cashouts
 * @returns Total amount cashed out
 */
export function getTotalUserCashouts(userId: string, cashouts: UserCashout[]): number {
  return cashouts
    .filter(cashout => cashout.userId === userId)
    .reduce((total, cashout) => total + (cashout.amount || 0), 0);
}
