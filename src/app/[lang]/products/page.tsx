
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import type { Product, ProductCategory, ProductStatus, ProductSize, ProductTypeDefinition } from '@/types'; // Updated ProductType to ProductTypeDefinition
import { ClientAuthWrapper } from '@/components/products/ClientAuthWrapper';
import { ProductFiltersClientWrapper } from '@/components/products/ProductFiltersClientWrapper';
import { DeleteAllProductsButton } from '@/components/products/DeleteAllProductsButton';
import { ExportProductsButton } from '@/components/products/ExportProductsButton';

interface ProductsPageProps {
  params: { lang: string };
}



export default async function ProductsPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as string;
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'مجموعتنا' : 'Our Collection',
    addProduct: effectiveLang === 'ar' ? 'إضافة منتج' : 'Add Product',
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle className="mb-0">{t.pageTitle}</PageTitle>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <ClientAuthWrapper lang={effectiveLang} addProductText={t.addProduct} />
            <ExportProductsButton lang={effectiveLang} />
            <DeleteAllProductsButton lang={effectiveLang} />
        </div>
      </div>
      <ProductFiltersClientWrapper
        allProducts={[]}
        allProductTypes={[]}
        lang={effectiveLang}
      />
    </div>
  );
}
