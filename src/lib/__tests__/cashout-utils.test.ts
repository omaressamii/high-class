/**
 * Test file for cashout utility functions
 * This file tests the improved cashout system to ensure accuracy
 */

import { 
  calculateUserCashBalance, 
  getUserPaymentTransactions, 
  getUserCashTransactions,
  getLastUserCashout,
  getTotalUserCashouts
} from '../utils';
import type { FinancialTransaction, UserCashout } from '@/types';

// Mock data for testing
const mockTransactions: FinancialTransaction[] = [
  {
    id: 'tx1',
    date: '2024-01-01',
    type: 'Payment Received',
    transactionCategory: 'Payment',
    description: 'Payment 1',
    processedByUserId: 'user1',
    processedByUserName: 'User One',
    amount: 100,
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'tx2',
    date: '2024-01-02',
    type: 'Payment Received',
    transactionCategory: 'Payment',
    description: 'Payment 2',
    processedByUserId: 'user1',
    processedByUserName: 'User One',
    amount: 200,
    createdAt: '2024-01-02T10:00:00Z'
  },
  {
    id: 'tx3',
    date: '2024-01-04',
    type: 'Payment Received',
    transactionCategory: 'Payment',
    description: 'Payment 3',
    processedByUserId: 'user1',
    processedByUserName: 'User One',
    amount: 150,
    createdAt: '2024-01-04T10:00:00Z'
  },
  {
    id: 'tx4',
    date: '2024-01-05',
    type: 'Payment Received',
    transactionCategory: 'Payment',
    description: 'Payment 4',
    processedByUserId: 'user2',
    processedByUserName: 'User Two',
    amount: 300,
    createdAt: '2024-01-05T10:00:00Z'
  }
];

const mockCashouts: UserCashout[] = [
  {
    id: 'co1',
    userId: 'user1',
    userName: 'User One',
    amount: 300, // Cashed out after tx1 and tx2
    cashoutDate: '2024-01-03',
    processedByUserId: 'admin',
    processedByUserName: 'Admin',
    createdAt: '2024-01-03T15:00:00Z'
  }
];

describe('Cashout Utility Functions', () => {
  
  describe('calculateUserCashBalance', () => {
    test('should calculate balance correctly without any cashouts', () => {
      const balance = calculateUserCashBalance('user2', mockTransactions, []);
      expect(balance).toBe(300); // Only tx4
    });

    test('should calculate balance correctly after cashout', () => {
      const balance = calculateUserCashBalance('user1', mockTransactions, mockCashouts);
      expect(balance).toBe(150); // Only tx3 after cashout
    });

    test('should return 0 for user with no transactions', () => {
      const balance = calculateUserCashBalance('user3', mockTransactions, mockCashouts);
      expect(balance).toBe(0);
    });
  });

  describe('getUserCashTransactions', () => {
    test('should return transactions since last cashout', () => {
      const transactions = getUserCashTransactions('user1', mockTransactions, mockCashouts);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('tx3');
    });

    test('should return all transactions if no cashouts', () => {
      const transactions = getUserCashTransactions('user2', mockTransactions, mockCashouts);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('tx4');
    });
  });

  describe('getLastUserCashout', () => {
    test('should return the last cashout for user', () => {
      const lastCashout = getLastUserCashout('user1', mockCashouts);
      expect(lastCashout).not.toBeNull();
      expect(lastCashout?.id).toBe('co1');
    });

    test('should return null if no cashouts', () => {
      const lastCashout = getLastUserCashout('user2', mockCashouts);
      expect(lastCashout).toBeNull();
    });
  });

  describe('getTotalUserCashouts', () => {
    test('should calculate total cashouts correctly', () => {
      const total = getTotalUserCashouts('user1', mockCashouts);
      expect(total).toBe(300);
    });

    test('should return 0 if no cashouts', () => {
      const total = getTotalUserCashouts('user2', mockCashouts);
      expect(total).toBe(0);
    });
  });

  describe('Integration Test - Complete Cashout Cycle', () => {
    test('should handle complete cashout cycle correctly', () => {
      // Initial state: user1 has 3 transactions totaling 450
      const initialBalance = calculateUserCashBalance('user1', mockTransactions, []);
      expect(initialBalance).toBe(450); // tx1 + tx2 + tx3

      // After first cashout of 300 (tx1 + tx2)
      const balanceAfterCashout = calculateUserCashBalance('user1', mockTransactions, mockCashouts);
      expect(balanceAfterCashout).toBe(150); // Only tx3 remains

      // Verify transactions since last cashout
      const transactionsSinceCashout = getUserCashTransactions('user1', mockTransactions, mockCashouts);
      expect(transactionsSinceCashout).toHaveLength(1);
      expect(transactionsSinceCashout[0].amount).toBe(150);
    });
  });
});

// Manual test function for console testing
export function runManualCashoutTests() {
  console.log('=== Manual Cashout System Tests ===');
  
  console.log('1. User1 initial balance (no cashouts):', 
    calculateUserCashBalance('user1', mockTransactions, []));
  
  console.log('2. User1 balance after cashout:', 
    calculateUserCashBalance('user1', mockTransactions, mockCashouts));
  
  console.log('3. User1 transactions since last cashout:', 
    getUserCashTransactions('user1', mockTransactions, mockCashouts).length);
  
  console.log('4. User2 balance (no cashouts):', 
    calculateUserCashBalance('user2', mockTransactions, mockCashouts));
  
  console.log('5. Last cashout for user1:', 
    getLastUserCashout('user1', mockCashouts)?.amount);
  
  console.log('=== Tests Complete ===');
}
