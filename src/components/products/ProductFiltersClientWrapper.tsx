
'use client';

import React from 'react';
import type { Product, ProductTypeDefinition, ProductCategory, ProductStatus, ProductSize } from '@/types';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductList } from '@/components/products/ProductList';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeProducts, useRealtimeData } from '@/context/RealtimeDataContext';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader, RefreshCw } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/ui/pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ProductsPerformanceInfo } from '@/components/products/ProductsPerformanceInfo';
import { ProductListSkeleton } from '@/components/products/ProductListSkeleton';

interface ProductFiltersClientWrapperProps {
  allProducts: Product[]; // Fallback data from server
  allProductTypes: ProductTypeDefinition[]; // Added prop for dynamic types
  lang: string;
}

export function ProductFiltersClientWrapper({ allProducts: fallbackProducts, allProductTypes: fallbackProductTypes, lang }: ProductFiltersClientWrapperProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { products: realtimeProducts, productTypes: realtimeProductTypes, isLoading: realtimeLoading, connectionStatus } = useRealtimeData();
  const { toast } = useToast();
  const router = useRouter();

  // Use real-time data if available, otherwise fallback to server data
  const allProducts = realtimeProducts.length > 0 ? realtimeProducts : fallbackProducts;
  const allProductTypes = realtimeProductTypes.length > 0 ? realtimeProductTypes : fallbackProductTypes;

  const [filters, setFilters] = React.useState<{
    searchTerm: string;
    type: string | 'all'; // Changed from ProductType to string for type ID
    category: ProductCategory | 'all';
    status: ProductStatus | 'all';
    size: ProductSize | 'all';
  }>({
    searchTerm: '',
    type: 'all',
    category: 'all',
    status: 'all',
    size: 'all',
  });

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 300);

  const filteredProducts = React.useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((product: Product) => {
      const searchTermMatch = debouncedSearchTerm === '' ||
                              product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                              (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                              (product.productCode && product.productCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const typeMatch = filters.type === 'all' || product.type === filters.type; // product.type is now ID
      const categoryMatch = filters.category === 'all' || product.category === filters.category;
      const statusMatch = filters.status === 'all' || product.status === filters.status;
      const sizeMatch = filters.size === 'all' || product.size === filters.size;

      let branchVisibilityMatch = true;
      if (currentUser && !hasPermission('view_all_branches')) {
        if (currentUser.branchId) {
          branchVisibilityMatch = product.isGlobalProduct === true || product.branchId === currentUser.branchId;
        } else {
          branchVisibilityMatch = product.isGlobalProduct === true;
        }
      }

      return searchTermMatch && typeMatch && categoryMatch && statusMatch && sizeMatch && branchVisibilityMatch;
    });
  }, [debouncedSearchTerm, filters.type, filters.category, filters.status, filters.size, allProducts, currentUser, hasPermission]);

  // Pagination configuration
  const ITEMS_PER_PAGE = 16; // 4x4 grid on desktop, responsive on mobile
  const pagination = usePagination(filteredProducts, {
    itemsPerPage: ITEMS_PER_PAGE,
    initialPage: 1,
  });

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.goToFirstPage();
  }, [debouncedSearchTerm, filters.type, filters.category, filters.status, filters.size]);

  const t_wrapper = {
    loadingProducts: lang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...',
    loadingRealtime: lang === 'ar' ? 'جاري تحميل تحديث البيانات...' : 'Loading real-time data...',
    accessDeniedTitle: lang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    accessDeniedDescription: lang === 'ar' ? 'ليس لديك الصلاحية لعرض المنتجات.' : 'You do not have permission to view products.',
    noProductsMatch: lang === 'ar' ? 'لا توجد منتجات تطابق الفلاتر الحالية.' : 'No products match your current filters.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث أو الفلترة.' : 'Try adjusting your search or filter criteria.',
    noProductsYet: lang === 'ar' ? 'لا توجد منتجات حاليًا. قم بإضافة بعض المنتجات!' : 'No products found. Add some products!',
    realtimeData: lang === 'ar' ? 'تحديث البيانات' : 'Real-time Data',
  };

  React.useEffect(() => {
    if (!authIsLoading && !hasPermission('products_view')) {
      router.push(`/${lang}`);
    }
  }, [authIsLoading, hasPermission, lang, router]);

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 rtl:mr-4">{t_wrapper.loadingProducts}</p>
      </div>
    );
  }

  // Show loading state for real-time data if no fallback data
  if (realtimeLoading && fallbackProducts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-4 rtl:mr-4 text-sm text-muted-foreground">{t_wrapper.loadingRealtime}</p>
        </div>
        <ProductListSkeleton count={16} />
      </div>
    );
  }

  if (!hasPermission('products_view')) {
    return null;
  }

  return (
    <>
      {/* Real-time status indicator */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{t_wrapper.realtimeData}</h3>
          <RealtimeStatus lang={lang as 'ar' | 'en'} compact showLastUpdated />
        </div>
      </div>

      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        lang={lang}
        availableProductTypes={allProductTypes} // Pass dynamic types
      />
      {allProducts.length === 0 && !filters.searchTerm ? (
         <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t_wrapper.noProductsYet}</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-6">
          <ProductsPerformanceInfo
            totalProducts={allProducts.length}
            filteredProducts={filteredProducts.length}
            currentPageItems={pagination.paginatedItems.length}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            lang={lang as 'ar' | 'en'}
          />
          <ProductList products={pagination.paginatedItems} allProductTypes={allProductTypes} lang={lang} />
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
          <p className="text-xl text-muted-foreground">{t_wrapper.noProductsMatch}</p>
          <p className="text-sm text-muted-foreground mt-2">{t_wrapper.tryAdjustingFilters}</p>
        </div>
      )}
    </>
  );
}
