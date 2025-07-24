
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientAuthWrapperForProductAvailabilityProps {
  children: React.ReactNode;
  lang: 'ar' | 'en';
}

export function ClientAuthWrapperForProductAvailability({ children, lang }: ClientAuthWrapperForProductAvailabilityProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();

  const t = {
    loadingPermissions: lang === 'ar' ? 'جار تحميل الصلاحيات...' : 'Loading permissions...',
    accessDenied: lang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    noPermissionToView: lang === 'ar' ? 'ليس لديك الصلاحية لعرض هذه الصفحة.' : 'You do not have permission to view this page.',
  };

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 rtl:mr-3 text-muted-foreground">{t.loadingPermissions}</p>
      </div>
    );
  }

  // Required permission for this page
  const canViewProductAvailability = hasPermission('products_availability_view');

  if (!canViewProductAvailability) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center text-lg">
            <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.accessDenied}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t.noPermissionToView}</p>
          <p className="text-xs mt-1">
            ({lang === 'ar' ? 'تحتاج إلى صلاحية:' : 'Required permission:'} products_availability_view)
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
