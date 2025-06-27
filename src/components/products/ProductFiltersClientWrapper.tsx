
'use client';

import React from 'react';
import type { Product, ProductTypeDefinition, ProductCategory, ProductStatus, ProductSize } from '@/types';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductList } from '@/components/products/ProductList';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

interface ProductFiltersClientWrapperProps {
  allProducts: Product[];
  allProductTypes: ProductTypeDefinition[]; // Added prop for dynamic types
  lang: string;
}

export function ProductFiltersClientWrapper({ allProducts, allProductTypes, lang }: ProductFiltersClientWrapperProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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

  const filteredProducts = React.useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((product: Product) => {
      const searchTermMatch = product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                              (product.description && product.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
                              (product.productCode && product.productCode.toLowerCase().includes(filters.searchTerm.toLowerCase()));
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
  }, [filters, allProducts, currentUser, hasPermission]);

  const t_wrapper = {
    loadingProducts: lang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...',
    accessDeniedTitle: lang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    accessDeniedDescription: lang === 'ar' ? 'ليس لديك الصلاحية لعرض المنتجات.' : 'You do not have permission to view products.',
    noProductsMatch: lang === 'ar' ? 'لا توجد منتجات تطابق الفلاتر الحالية.' : 'No products match your current filters.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث أو الفلترة.' : 'Try adjusting your search or filter criteria.',
    noProductsYet: lang === 'ar' ? 'لا توجد منتجات حاليًا. قم بإضافة بعض المنتجات!' : 'No products found. Add some products!',
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

  if (!hasPermission('products_view')) {
    return null;
  }

  return (
    <>
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
        <ProductList products={filteredProducts} allProductTypes={allProductTypes} lang={lang} />
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t_wrapper.noProductsMatch}</p>
          <p className="text-sm text-muted-foreground mt-2">{t_wrapper.tryAdjustingFilters}</p>
        </div>
      )}
    </>
  );
}
