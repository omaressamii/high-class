'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PageTitle } from '@/components/shared/PageTitle';
import { QuantitySyncManager } from '@/components/admin/QuantitySyncManager';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Shield, Database } from 'lucide-react';

export default function QuantitySyncAdminPage() {
  const params = useParams();
  const { hasPermission, isLoading } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'مزامنة كميات المنتجات' : 'Product Quantity Sync',
    pageDescription: effectiveLang === 'ar' 
      ? 'مزامنة كميات المنتجات المؤجرة مع الطلبات النشطة الفعلية في قاعدة البيانات' 
      : 'Sync product rented quantities with actual active orders in the database',
    backToAdmin: effectiveLang === 'ar' ? 'العودة إلى الإدارة' : 'Back to Admin',
    accessDenied: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    accessDeniedDescription: effectiveLang === 'ar' 
      ? 'ليس لديك الصلاحية للوصول إلى هذه الصفحة. تحتاج إلى صلاحيات الإدارة.'
      : 'You do not have permission to access this page. Admin permissions are required.',
    adminOnly: effectiveLang === 'ar' ? 'للمديرين فقط' : 'Admin Only',
    adminOnlyDescription: effectiveLang === 'ar'
      ? 'هذه الصفحة مخصصة للمديرين فقط لمزامنة كميات المنتجات مع قاعدة البيانات.'
      : 'This page is for administrators only to sync product quantities with the database.',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle>{t.pageTitle}</PageTitle>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!hasPermission('admin_access')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageTitle>{t.pageTitle}</PageTitle>
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backToAdmin}
            </Link>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>{t.accessDenied}</strong>
            <br />
            {t.accessDeniedDescription}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <PageTitle className="mb-2">{t.pageTitle}</PageTitle>
          <p className="text-muted-foreground">{t.pageDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}/admin/order-codes`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backToAdmin}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}/admin/database-backup`}>
              <Database className="mr-2 h-4 w-4" />
              {effectiveLang === 'ar' ? 'النسخ الاحتياطي' : 'Database Backup'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Admin Notice */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>{t.adminOnly}</strong>
          <br />
          {t.adminOnlyDescription}
        </AlertDescription>
      </Alert>

      {/* Quantity Sync Manager */}
      <QuantitySyncManager lang={effectiveLang} />
    </div>
  );
}
