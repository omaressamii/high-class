'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, Filter, Grid } from 'lucide-react';

interface ProductsPerformanceInfoProps {
  totalProducts: number;
  filteredProducts: number;
  currentPageItems: number;
  currentPage: number;
  totalPages: number;
  lang: 'ar' | 'en';
}

export function ProductsPerformanceInfo({
  totalProducts,
  filteredProducts,
  currentPageItems,
  currentPage,
  totalPages,
  lang,
}: ProductsPerformanceInfoProps) {
  const t = {
    total: lang === 'ar' ? 'إجمالي' : 'Total',
    filtered: lang === 'ar' ? 'مفلترة' : 'Filtered',
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    page: lang === 'ar' ? 'صفحة' : 'Page',
    of: lang === 'ar' ? 'من' : 'of',
    products: lang === 'ar' ? 'منتج' : 'products',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Database className="h-4 w-4" />
        <span>{t.total}: </span>
        <Badge variant="secondary">{totalProducts}</Badge>
      </div>
      
      {filteredProducts !== totalProducts && (
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          <span>{t.filtered}: </span>
          <Badge variant="outline">{filteredProducts}</Badge>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <Grid className="h-4 w-4" />
        <span>{t.showing}: </span>
        <Badge variant="default">{currentPageItems}</Badge>
        <span>{t.products}</span>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
        </div>
      )}
    </div>
  );
}
