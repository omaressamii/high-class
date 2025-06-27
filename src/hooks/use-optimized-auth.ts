'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PermissionString } from '@/types';

/**
 * Optimized hook for authentication and permission checks
 * Reduces re-renders and improves performance
 */
export function useOptimizedAuth() {
  const { currentUser, isLoading, hasPermission, logout, permissions } = useAuth();

  // Memoize authentication state
  const authState = useMemo(() => ({
    isAuthenticated: !!currentUser,
    isLoading,
    user: currentUser,
    permissions: permissions || [],
  }), [currentUser, isLoading, permissions]);

  // Memoize permission checker
  const checkPermission = useMemo(() => ({
    has: (permission: PermissionString) => hasPermission(permission),
    hasAny: (permissionList: PermissionString[]) => 
      permissionList.some(permission => hasPermission(permission)),
    hasAll: (permissionList: PermissionString[]) => 
      permissionList.every(permission => hasPermission(permission)),
  }), [hasPermission]);

  // Memoize common permission checks
  const commonPermissions = useMemo(() => ({
    canViewDashboard: hasPermission('dashboard_view'),
    canViewProducts: hasPermission('products_view'),
    canAddProducts: hasPermission('products_add'),
    canViewOrders: hasPermission('orders_view'),
    canPrepareOrders: hasPermission('orders_prepare'),
    canViewCustomers: hasPermission('customers_view'),
    canManageCustomers: hasPermission('customers_manage'),
    canViewUsers: hasPermission('users_view'),
    canManageUsers: hasPermission('users_manage'),
    canViewReports: hasPermission('reports_view'),
    canViewFinancials: hasPermission('financials_view'),
    canManageBranches: hasPermission('branches_manage'),
    canReceiveReturns: hasPermission('returns_receive'),
    canViewProductAvailability: hasPermission('products_availability_view'),
  }), [hasPermission]);

  return {
    ...authState,
    checkPermission,
    commonPermissions,
    logout,
  };
}
