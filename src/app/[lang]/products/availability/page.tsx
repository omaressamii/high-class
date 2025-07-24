
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { ProductAvailabilityViewer } from '@/components/products/ProductAvailabilityViewer';
import { ClientAuthWrapperForProductAvailability } from '@/components/products/ClientAuthWrapperForProductAvailability';

interface ProductAvailabilityPageProps {
  params: { lang: string };
}

export default async function ProductAvailabilityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const langTyped = lang as 'ar' | 'en';
  const t = {
    pageTitle: langTyped === 'ar' ? 'التحقق من توفر المنتج' : 'Product Availability Check',
    pageDescription: langTyped === 'ar' ? 'أدخل كود المنتج (ID) لعرض جدول التسليم والإرجاع الخاص به لجميع الطلبات التي تحتوي هذا المنتج.' : 'Enter the Product ID to view its delivery and return schedule across all orders containing this item.',
  };

  return (
    <div className="space-y-8">
      <PageTitle>{t.pageTitle}</PageTitle>
      <p className="text-muted-foreground">{t.pageDescription}</p>
      <ClientAuthWrapperForProductAvailability lang={langTyped}>
        <ProductAvailabilityViewer lang={langTyped} />
      </ClientAuthWrapperForProductAvailability>
    </div>
  );
}
