'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeData } from '@/context/RealtimeDataContext';
import { useToast } from '@/hooks/use-toast';
import { exportProductsToExcel } from '@/lib/product-export';

interface ExportProductsButtonProps {
  lang: 'ar' | 'en';
  products?: Product[];
}

export function ExportProductsButton({ lang, products }: ExportProductsButtonProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { products: realtimeProducts, productTypes, isLoading: realtimeLoading } = useRealtimeData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const t = {
    exportProducts: lang === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel',
    exporting: lang === 'ar' ? 'جاري التصدير...' : 'Exporting...',
    exportSuccess: (count: number) =>
      lang === 'ar'
        ? `تم تصدير ${count} منتج بنجاح.`
        : `Successfully exported ${count} products.`,
    exportError: lang === 'ar' ? 'فشل تصدير المنتجات.' : 'Failed to export products.',
    noProducts: lang === 'ar' ? 'لا توجد منتجات للتصدير.' : 'No products to export.',
  };

  const branchVisibleProducts = useMemo(() => {
    const sourceProducts = products ?? realtimeProducts;

    return sourceProducts.filter((product) => {
      if (!currentUser || hasPermission('view_all_branches')) {
        return true;
      }

      if (currentUser.branchId) {
        return product.isGlobalProduct === true || product.branchId === currentUser.branchId;
      }

      return product.isGlobalProduct === true;
    });
  }, [products, realtimeProducts, currentUser, hasPermission]);

  const handleExport = useCallback(async () => {
    if (branchVisibleProducts.length === 0) {
      toast({
        title: t.noProducts,
        variant: 'default',
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportProductsToExcel(branchVisibleProducts, productTypes, lang);
      toast({
        title: t.exportSuccess(branchVisibleProducts.length),
      });
    } catch (error) {
      console.error('Export products error:', error);
      toast({
        title: t.exportError,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [branchVisibleProducts, productTypes, lang, toast, t.exportError, t.exportSuccess, t.noProducts]);

  if (authIsLoading || !hasPermission('products_view')) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={isExporting || realtimeLoading}
      className="w-full sm:w-auto"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? t.exporting : t.exportProducts}
    </Button>
  );
}
