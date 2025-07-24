
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EditProductButtonProps {
  productId: string;
  lang: string;
  className?: string;
}

export function EditProductButton({ productId, lang, className }: EditProductButtonProps) {
  const { isLoading: authIsLoading, hasPermission } = useAuth();

  const t = {
    editProduct: lang === 'ar' ? 'تعديل المنتج' : 'Edit Product',
    loading: lang === 'ar' ? 'جار التحميل...' : 'Loading...',
  };

  if (authIsLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
        {t.loading}
      </Button>
    );
  }

  if (!hasPermission('products_edit')) {
    return null; // Don't render the button if user doesn't have permission
  }

  return (
    <Button asChild variant="secondary" className={className}>
      <Link href={`/${lang}/products/${productId}/edit`}>
        <Edit className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
        {t.editProduct}
      </Link>
    </Button>
  );
}
