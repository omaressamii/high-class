
'use client';

import React, { useState, useMemo } from 'react';
import type { Customer } from '@/types';
import { CustomerFilters } from './CustomerFilters';
import { CustomerList } from './CustomerList';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { useRealtimeCustomers } from '@/context/RealtimeDataContext';
import { useAuth } from '@/context/AuthContext';
import { Users as UsersIcon, RefreshCw } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/ui/pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { CustomersPerformanceInfo } from './CustomersPerformanceInfo';
import { CustomerListSkeleton } from './CustomerListSkeleton';

interface CustomerListClientWrapperProps {
  allCustomers: Customer[]; // Fallback data from server
  lang: 'ar' | 'en';
}

export function CustomerListClientWrapper({ allCustomers: fallbackCustomers, lang }: CustomerListClientWrapperProps) {
  const { customers: realtimeCustomers, isLoading: realtimeLoading, connectionStatus } = useRealtimeCustomers();
  const { currentUser, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Use real-time data if available, otherwise fallback to server data
  const allCustomers = realtimeCustomers.length > 0 ? realtimeCustomers : fallbackCustomers;

  const t = {
    noCustomersMatch: lang === 'ar' ? 'لا يوجد عملاء يطابقون بحثك.' : 'No customers match your search.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث.' : 'Try adjusting your search criteria.',
    noCustomersAtAll: lang === 'ar' ? 'لا يوجد عملاء لعرضهم حاليًا.' : 'No customers to display currently.',
    loadingRealtime: lang === 'ar' ? 'جاري تحميل تحديث البيانات...' : 'Loading real-time data...',
    realtimeData: lang === 'ar' ? 'تحديث البيانات' : 'Real-time Data',
  };

  const filteredCustomers = useMemo(() => {
    if (!allCustomers) return [];

    let customers = allCustomers;

    // Apply branch filtering first
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
      customers = customers.filter(customer => customer.branchId === currentUser.branchId);
    }

    // Then apply search filtering using debounced search term
    return customers.filter((customer) => {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      return (
        debouncedSearchTerm === '' ||
        customer.fullName.toLowerCase().includes(searchTermLower) ||
        customer.phoneNumber.includes(searchTermLower) ||
        (customer.idCardNumber && customer.idCardNumber.toLowerCase().includes(searchTermLower)) ||
        customer.id.toLowerCase().includes(searchTermLower)
      );
    });
  }, [allCustomers, debouncedSearchTerm, currentUser, hasPermission]);

  // Pagination configuration
  const ITEMS_PER_PAGE = 15; // 15 customers per page for optimal performance
  const pagination = usePagination(filteredCustomers, {
    itemsPerPage: ITEMS_PER_PAGE,
    initialPage: 1,
  });

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.goToFirstPage();
  }, [debouncedSearchTerm]);

  // Show loading state for real-time data if no fallback data
  if (realtimeLoading && fallbackCustomers.length === 0) {
    return <CustomerListSkeleton count={15} />;
  }

  if (!allCustomers || allCustomers.length === 0) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="text-xl text-muted-foreground mt-4">{t.noCustomersAtAll}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {lang === 'ar' ? 'ابدأ بإضافة عميلك الأول!' : 'Start by adding your first customer!'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Real-time status indicator */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{t.realtimeData}</h3>
          <RealtimeStatus lang={lang} compact showLastUpdated />
        </div>
      </div>

      <CustomerFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {filteredCustomers.length > 0 ? (
        <div className="space-y-6">
          <CustomersPerformanceInfo
            totalCustomers={allCustomers.length}
            filteredCustomers={filteredCustomers.length}
            currentPageItems={pagination.paginatedItems.length}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            lang={lang}
          />

          <CustomerList customers={pagination.paginatedItems} lang={lang} />

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
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">{t.noCustomersMatch}</p>
          <p className="text-sm text-muted-foreground">{t.tryAdjustingFilters}</p>
        </div>
      )}
    </div>
  );
}
