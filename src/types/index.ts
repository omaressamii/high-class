
/**
 * @file src/types/index.ts
 * @description This file contains the main type definitions and interfaces used throughout the application.
 */

// Product-related types
export type ProductType = string; // Changed from 'Suit' | 'Dress' to string (will store type ID)
export type ProductCategory = 'Rental' | 'Sale';
export type ProductStatus = 'Available' | 'Rented' | 'Sold';
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Custom';

export interface ProductTypeDefinition {
  id: string; // e.g., 'suit', 'dress', 'abaya'
  name: string; // English name, e.g., "Suit"
  name_ar: string; // Arabic name, e.g., "بدلة"
  createdAt?: any; // Firestore ServerTimestamp
}

export interface Product {
  id: string;
  name: string;
  productCode: string;
  type: ProductType; // Stores the ID of the ProductTypeDefinition
  category: ProductCategory;
  size: ProductSize;
  price: number;
  status: ProductStatus;
  imageUrl: string;
  description: string;
  notes?: string;
  "data-ai-hint"?: string;
  initialStock: number;
  quantityInStock: number;
  quantityRented: number;
  quantitySold?: number;
  branchId?: string;
  branchName?: string;
  isGlobalProduct?: boolean;
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

// Branch-related type
export interface Branch {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  notes?: string;
  createdAt?: any; // Firestore ServerTimestamp
  createdByUserId?: string;
  updatedAt?: any;
}

// User-related types

export const PERMISSION_STRINGS = [
  'dashboard_view',
  'products_view',
  'products_add',
  'products_edit',
  'products_delete',
  'products_availability_view',
  'customers_view',
  'customers_manage',
  'orders_view',
  'orders_add',
  'orders_edit_price',
  'orders_apply_discount',
  'orders_delete',
  'orders_prepare',
  'returns_receive',
  'financials_view',
  'payments_record',
  'reports_view',
  'users_view',
  'users_manage',
  'branches_manage',
  'view_all_branches'
] as const;

export type PermissionString = typeof PERMISSION_STRINGS[number];
export type UserPermissionsArray = PermissionString[];

export const PERMISSION_STRINGS_FOR_CHECKBOXES = PERMISSION_STRINGS.filter(p => p !== 'view_all_branches');
export type CheckboxPermissionString = typeof PERMISSION_STRINGS_FOR_CHECKBOXES[number];


export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  isSeller?: boolean;
  permissions: UserPermissionsArray;
  branchId?: string;
  branchName?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Customer interface
export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  idCardNumber?: string;
  notes?: string;
  createdAt?: any;
  createdByUserId?: string;
}

// Order-related types
export type TransactionType = 'Rental' | 'Sale';
export type OrderStatus =
  | 'Ongoing'
  | 'Pending Preparation'
  | 'Prepared'
  | 'Delivered to Customer'
  | 'Completed'
  | 'Overdue'
  | 'Cancelled';

export type ProductReturnCondition = 'Good' | 'Damaged';

export interface OrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  priceAtTimeOfOrder: number;
}

export interface Order {
  id: string;
  orderCode?: string;
  items: OrderItem[];
  customerId: string;
  customerName?: string;
  sellerId?: string;
  sellerName?: string;
  processedByUserId?: string;
  processedByUserName?: string;
  branchId?: string;
  branchName?: string;
  transactionType: TransactionType;
  orderDate: string;
  deliveryDate: string;
  returnDate?: string;
  totalPrice: number;
  paidAmount: number;
  discountAmount?: number;
  remainingAmount: number;
  status: OrderStatus;
  notes?: string;
  returnCondition?: ProductReturnCondition;
  returnNotes?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Payment interface
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
export const paymentMethodValues: PaymentMethod[] = ['Cash', 'Card', 'Bank Transfer', 'Other'];

export interface Payment {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  processedByUserId?: string;
  processedByUserName?: string;
  createdAt?: any;
}

// Financials-related types
export type FinancialTransactionType =
  | 'Initial Sale Value'
  | 'Initial Rental Value'
  | 'Payment Received'
  | 'Refund Issued'
  | 'Expense';

export const financialTransactionTypeValues: FinancialTransactionType[] = [
  'Initial Sale Value',
  'Initial Rental Value',
  'Payment Received',
];

export interface FinancialTransaction {
  id: string;
  date: string;
  type: FinancialTransactionType;
  transactionCategory: string;
  description: string;
  customerId?: string;
  customerName?: string;
  sellerId?: string;
  sellerName?: string;
  processedByUserId?: string;
  processedByUserName?: string;
  orderId?: string;
  orderCode?: string;
  productId?: string;
  productName?: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt?: any;
}

// For returns page
export interface OrderItemToReturn {
  productId: string;
  productName: string;
}

// Permission Groups
export interface PermissionGroup {
  id: string;
  nameKey: string;
  permissions: CheckboxPermissionString[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
   {
    id: 'dashboard_group',
    nameKey: 'group_dashboard_access',
    permissions: ['dashboard_view'],
  },
  {
    id: 'products_group',
    nameKey: 'group_products_management',
    permissions: ['products_view', 'products_add', 'products_edit', 'products_delete', 'products_availability_view'],
  },
  {
    id: 'customers_group',
    nameKey: 'group_customers_management',
    permissions: ['customers_view', 'customers_manage'],
  },
  {
    id: 'orders_group',
    nameKey: 'group_orders_management',
    permissions: ['orders_view', 'orders_add', 'orders_edit_price', 'orders_apply_discount', 'orders_delete', 'orders_prepare'],
  },
  {
    id: 'returns_group',
    nameKey: 'group_returns_management',
    permissions: ['returns_receive'],
  },
  {
    id: 'financials_group',
    nameKey: 'group_financials_payments',
    permissions: ['financials_view', 'payments_record'],
  },
  {
    id: 'reports_group',
    nameKey: 'group_reports',
    permissions: ['reports_view'],
  },
  {
    id: 'users_group',
    nameKey: 'group_user_management',
    permissions: ['users_view', 'users_manage'],
  },
  {
    id: 'branches_group',
    nameKey: 'group_branch_management',
    permissions: ['branches_manage'],
  },
];
