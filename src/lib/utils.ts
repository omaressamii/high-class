import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FinancialTransaction, UserCashout } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the total cash balance for a user based on their name (matching Financial page logic)
 * This function matches the exact logic used in the Financial page's processorSummaries
 * It counts ALL 'Payment Received' transactions processed by the user, minus any cashouts
 * @param userName - The user's full name (processedByUserName) to calculate balance for
 * @param transactions - Array of all financial transactions
 * @param cashouts - Array of user cashouts to subtract from total
 * @returns The total cash balance for the user
 */
export function calculateUserCashBalance(
  userName: string,
  transactions: FinancialTransaction[],
  cashouts: UserCashout[] = []
): number {
  // Calculate total from all Payment Received transactions processed by this user
  // This matches the exact logic from FinancialsPageClientContent.tsx processorSummaries
  const totalPayments = transactions
    .filter(transaction =>
      transaction.processedByUserName === userName &&
      transaction.type === 'Payment Received'
    )
    .reduce((total, transaction) => total + (transaction.amount || 0), 0);

  // Calculate total cashouts for this user (by userName to match the payment logic)
  const totalCashouts = cashouts
    .filter(cashout => cashout.userName === userName)
    .reduce((total, cashout) => total + (cashout.amount || 0), 0);

  // Return the balance: total payments minus total cashouts
  return totalPayments - totalCashouts;
}

/**
 * Get all payment transactions processed by a specific user (by name)
 * @param userName - The user's full name to get transactions for
 * @param transactions - Array of all financial transactions
 * @returns Array of payment transactions processed by the user
 */
export function getUserPaymentTransactions(userName: string, transactions: FinancialTransaction[]): FinancialTransaction[] {
  return transactions.filter(transaction =>
    transaction.processedByUserName === userName &&
    transaction.type === 'Payment Received'
  );
}

/**
 * Get all cash-related transactions for a user since last cashout
 * @param userName - The user's full name to get transactions for
 * @param transactions - Array of all financial transactions
 * @param cashouts - Array of user cashouts
 * @returns Array of payment transactions since last cashout
 */
export function getUserCashTransactions(
  userName: string,
  transactions: FinancialTransaction[],
  cashouts: UserCashout[] = []
): FinancialTransaction[] {
  // Find the last cashout date for this user (by userName)
  const userCashouts = cashouts.filter(cashout => cashout.userName === userName);
  const lastCashout = userCashouts.length > 0
    ? userCashouts.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      )
    : null;

  const lastCashoutDate = lastCashout ? new Date(lastCashout.createdAt) : new Date(0);

  return transactions.filter(transaction =>
    transaction.processedByUserName === userName &&
    transaction.type === 'Payment Received' &&
    new Date(transaction.createdAt || transaction.date) > lastCashoutDate
  );
}

/**
 * Get the last cashout for a user (by name)
 * @param userName - The user's full name to get last cashout for
 * @param cashouts - Array of user cashouts
 * @returns The last cashout record or null if none exists
 */
export function getLastUserCashout(userName: string, cashouts: UserCashout[]): UserCashout | null {
  const userCashouts = cashouts.filter(cashout => cashout.userName === userName);
  if (userCashouts.length === 0) return null;

  return userCashouts.reduce((latest, current) =>
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
}

/**
 * Get total amount cashed out for a user (for reporting purposes)
 * @param userName - The user's full name to get total cashouts for
 * @param cashouts - Array of user cashouts
 * @returns Total amount cashed out
 */
export function getTotalUserCashouts(userName: string, cashouts: UserCashout[]): number {
  return cashouts
    .filter(cashout => cashout.userName === userName)
    .reduce((total, cashout) => total + (cashout.amount || 0), 0);
}
