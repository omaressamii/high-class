
'use client'; 

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { OrderList } from '@/components/orders/OrderList';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { Button } from '@/components/ui/button';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { useRealtimeData } from '@/context/RealtimeDataContext';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/ui/pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { OrderListSkeleton } from '@/components/orders/OrderListSkeleton';
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
  const { orders: realtimeOrders, branches: realtimeBranches, isLoading: realtimeLoading, connectionStatus } = useRealtimeData();

  // Use real-time data if available, otherwise fallback to server data
  const allOrdersState = realtimeOrders.length > 0 ? realtimeOrders as OrderWithDetails[] : initialOrders;
  const allBranchesState = realtimeBranches.length > 0 ? realtimeBranches.map(b => ({ id: b.id, name: b.name })) : allBranches;

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

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 300);

  const filteredOrders = useMemo(() => {
    let orders = allOrdersState;
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
        orders = orders.filter(order => order.branchId === currentUser.branchId);
    } else if (filters.branchId && filters.branchId !== 'all') {
        orders = orders.filter(order => order.branchId === filters.branchId);
    }

    return orders.filter((order) => {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      // Check primary fields and also first item's product name if available
      const firstItemName = order.items[0]?.productName?.toLowerCase() || '';
      const searchTermMatch = debouncedSearchTerm === '' ||
                              order.id.toLowerCase().includes(searchTermLower) ||
                              firstItemName.includes(searchTermLower) || // Search in first item name
                              (order.orderCode && order.orderCode.toLowerCase().includes(searchTermLower)) ||
                              (order.customerName && order.customerName.toLowerCase().includes(searchTermLower)) ||
                              (order.sellerName && order.sellerName.toLowerCase().includes(searchTermLower)) ||
                              (order.processedByUserName && order.processedByUserName.toLowerCase().includes(searchTermLower)) ||
                              (order.customerPhoneNumber && order.customerPhoneNumber.includes(debouncedSearchTerm));
      const typeMatch = filters.transactionType === 'all' || order.transactionType === filters.transactionType;
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      return searchTermMatch && typeMatch && statusMatch;
    });
  }, [debouncedSearchTerm, filters.transactionType, filters.status, filters.branchId, allOrdersState, currentUser, hasPermission]);

  // Pagination configuration
  const ITEMS_PER_PAGE = 20; // 20 orders per page
  const pagination = usePagination(filteredOrders, {
    itemsPerPage: ITEMS_PER_PAGE,
    initialPage: 1,
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.goToFirstPage();
  }, [debouncedSearchTerm, filters.transactionType, filters.status, filters.branchId]);

  const t = {
    noOrdersMatch: lang === 'ar' ? 'لا توجد طلبات تطابق الفلاتر الحالية.' : 'No orders match your current filters.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث أو الفلترة.' : 'Try adjusting your search or filter criteria.',
    loadingOrders: lang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...',
    loadingRealtime: lang === 'ar' ? 'جاري تحميل تحديث البيانات...' : 'Loading real-time data...',
  };

  // Show loading state for real-time data if no fallback data
  if (realtimeLoading && initialOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{pageTitleText}</h1>
        </div>
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-4 rtl:mr-4 text-sm text-muted-foreground">{t.loadingRealtime}</p>
        </div>
        <OrderListSkeleton count={20} />
      </div>
    );
  }
  
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
        branches={allBranchesState}
        showBranchFilter={hasPermission('view_all_branches')}
      />

      {allOrdersState.length === 0 ? (
         <div className="text-center py-12">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{noOrdersYetText}</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{lang === 'ar' ? 'إجمالي الطلبات:' : 'Total Orders:'}</span>
            <span className="font-medium">{allOrdersState.length}</span>
            {filteredOrders.length !== allOrdersState.length && (
              <>
                <span>|</span>
                <span>{lang === 'ar' ? 'مفلترة:' : 'Filtered:'}</span>
                <span className="font-medium">{filteredOrders.length}</span>
              </>
            )}
            <span>|</span>
            <span>{lang === 'ar' ? 'عرض:' : 'Showing:'}</span>
            <span className="font-medium">{pagination.paginatedItems.length}</span>
          </div>
          <OrderList orders={pagination.paginatedItems} lang={lang} />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.goToPage}
            onNextPage={pagination.goToNextPage}
            onPreviousPage={pagination.goToPreviousPage}
            onFirstPage={pagination.goToFirstPage}
            onLastPage={pagination.goToLastPage}
            getPageNumbers={pagination.getPageNumbers}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            lang={lang as 'ar' | 'en'}
          />
        </div>
      ) : (
         <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t.noOrdersMatch}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.tryAdjustingFilters}</p>
        </div>
      )}
    </>
  );
}
