'use client';

import React from 'react';
import { useOptimizedAuth } from '@/hooks/use-optimized-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OptimizedLoader } from '@/components/shared/OptimizedLoader';

interface ProductDetailsAuthWrapperProps {
  children: React.ReactNode;
  lang: string;
}

export function ProductDetailsAuthWrapper({ children, lang }: ProductDetailsAuthWrapperProps) {
  const { isLoading, commonPermissions } = useOptimizedAuth();

  const t = {
    accessDenied: lang === 'ar' ? 'الوصول مرفوض' : 'Access Denied',
    noPermission: lang === 'ar' ? 'ليس لديك صلاحية لعرض تفاصيل المنتجات.' : 'You do not have permission to view product details.',
    backToProducts: lang === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products',
    contactAdmin: lang === 'ar' ? 'يرجى التواصل مع المسؤول للحصول على الصلاحيات المطلوبة.' : 'Please contact your administrator to get the required permissions.',
  };

  if (isLoading) {
    return <OptimizedLoader size="lg" className="min-h-[400px]" />;
  }

  if (!commonPermissions.canViewProductDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldX className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-destructive">{t.accessDenied}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t.noPermission}</p>
            <p className="text-sm text-muted-foreground">{t.contactAdmin}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/${lang}/products`}>
                <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t.backToProducts}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
