
'use client'; 

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { OrderList } from '@/components/orders/OrderList';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { Button } from '@/components/ui/button';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { useRealtimeOrders } from '@/context/RealtimeDataContext';
import type { Order, TransactionType, OrderStatus, Product, Customer, User as AppUser, Branch } from '@/types';
import { PlusCircle, Loader, AlertCircle, ListChecks, RefreshCw } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

type OrderWithDetails = Order & {
  // productName is now part of order.items, but we might want a primary display name
  // customerName is already on Order if denormalized
  customerPhoneNumber?: string; // If needed for quick display/filter
  // sellerName is already on Order if denormalized
  // processedByUserName is already on Order if denormalized
};

interface OrdersPageClientContentProps {
  initialOrders: OrderWithDetails[];
  allBranches: {id: string, name: string}[];
  lang: 'ar' | 'en';
  addOrderText: string;
  noOrdersYetText: string;
  pageTitleText: string;
}

export function OrdersPageClientContent({
  initialOrders,
  allBranches,
  lang,
  addOrderText,
  noOrdersYetText,
  pageTitleText
}: OrdersPageClientContentProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { orders: realtimeOrders, isLoading: realtimeLoading, connectionStatus } = useRealtimeOrders();

  // Use real-time data if available, otherwise fallback to server data
  const allOrdersState = realtimeOrders.length > 0 ? realtimeOrders as OrderWithDetails[] : initialOrders;

  const [filters, setFilters] = useState<{
    searchTerm: string;
    transactionType: TransactionType | 'all';
    status: OrderStatus | 'all';
    branchId?: string | 'all';
  }>({
    searchTerm: '',
    transactionType: 'all',
    status: 'all',
    branchId: 'all',
  });

  const filteredOrders = useMemo(() => {
    let orders = allOrdersState;
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
        orders = orders.filter(order => order.branchId === currentUser.branchId);
    } else if (filters.branchId && filters.branchId !== 'all') {
        orders = orders.filter(order => order.branchId === filters.branchId);
    }

    return orders.filter((order) => { 
      const searchTermLower = filters.searchTerm.toLowerCase();
      // Check primary fields and also first item's product name if available
      const firstItemName = order.items[0]?.productName?.toLowerCase() || '';
      const searchTermMatch = order.id.toLowerCase().includes(searchTermLower) ||
                              firstItemName.includes(searchTermLower) || // Search in first item name
                              (order.orderCode && order.orderCode.toLowerCase().includes(searchTermLower)) ||
                              (order.customerName && order.customerName.toLowerCase().includes(searchTermLower)) ||
                              (order.sellerName && order.sellerName.toLowerCase().includes(searchTermLower)) ||
                              (order.processedByUserName && order.processedByUserName.toLowerCase().includes(searchTermLower)) ||
                              (order.customerPhoneNumber && order.customerPhoneNumber.includes(filters.searchTerm)); 
      const typeMatch = filters.transactionType === 'all' || order.transactionType === filters.transactionType;
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      return searchTermMatch && typeMatch && statusMatch;
    });
  }, [filters, allOrdersState, currentUser, hasPermission]);
  
  const t = {
    noOrdersMatch: lang === 'ar' ? 'لا توجد طلبات تطابق الفلاتر الحالية.' : 'No orders match your current filters.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث أو الفلترة.' : 'Try adjusting your search or filter criteria.',
  };
  
  if (authIsLoading && !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[20rem]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading state for real-time data if no fallback data
  if (realtimeLoading && initialOrders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[20rem]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 rtl:mr-4">{lang === 'ar' ? 'جاري تحميل تحديث البيانات...' : 'Loading real-time data...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <PageTitle>{pageTitleText}</PageTitle>
        {hasPermission('orders_add') && (
          <Button asChild variant="default">
            <Link href={`/${lang}/orders/new`}>
              <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {addOrderText}
            </Link>
          </Button>
        )}
      </div>

      {/* Real-time status indicator */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{lang === 'ar' ? 'تحديث البيانات' : 'Real-time Data'}</h3>
          <RealtimeStatus lang={lang} compact showLastUpdated />
        </div>
      </div>

      <OrderFilters 
        filters={filters} 
        setFilters={setFilters} 
        lang={lang}
        branches={allBranches}
        showBranchFilter={hasPermission('view_all_branches')}
      />

      {allOrdersState.length === 0 ? (
         <div className="text-center py-12">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{noOrdersYetText}</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <OrderList orders={filteredOrders} lang={lang} />
      ) : (
         <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t.noOrdersMatch}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.tryAdjustingFilters}</p>
        </div>
      )}
    </>
  );
}
