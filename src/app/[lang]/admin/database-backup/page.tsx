'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Database, Shield } from 'lucide-react';
import { PageTitle } from '@/components/shared/PageTitle';
import DatabaseBackupManager from '@/components/admin/DatabaseBackupManager';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminDatabaseBackupPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading, hasPermission } = useAuth();
  const { toast } = useToast();

  const effectiveLang = (params.lang === 'ar' || params.lang === 'en') ? params.lang as string : 'ar';

  // Check permissions client-side
  const hasBackupPermission = hasPermission('database_backup');
  const hasRestorePermission = hasPermission('database_restore');

  useEffect(() => {
    if (!authIsLoading) {
      if (!currentUser) {
        router.push(`/${effectiveLang}/login`);
      } else if (!hasBackupPermission && !hasRestorePermission) {
        toast({
          title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
          description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية للوصول لهذه الصفحة.' : 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push(`/${effectiveLang}/dashboard`);
      }
    }
  }, [authIsLoading, currentUser, hasBackupPermission, hasRestorePermission, effectiveLang, router, toast]);

  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{effectiveLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!hasBackupPermission && !hasRestorePermission) {
    return null; // Will be redirected by useEffect
  }

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة النسخ الاحتياطي للقاعدة' : 'Database Backup & Restore',
    pageDescription: effectiveLang === 'ar' 
      ? 'إدارة النسخ الاحتياطية واستعادة قاعدة البيانات' 
      : 'Manage database backups and restore operations',
    backToAdmin: effectiveLang === 'ar' ? 'العودة للأدوات الإدارية' : 'Back to Admin Tools',
    adminOnly: effectiveLang === 'ar' ? 'للمديرين فقط' : 'Admin Only',
    adminOnlyDescription: effectiveLang === 'ar' 
      ? 'هذه الصفحة مخصصة للمديرين الذين لديهم صلاحيات إدارة قاعدة البيانات. العمليات هنا تؤثر على النظام بالكامل.' 
      : 'This page is for administrators with database management permissions. Operations here affect the entire system.',
    dangerZone: effectiveLang === 'ar' ? 'منطقة خطر' : 'Danger Zone',
    dangerZoneDescription: effectiveLang === 'ar' 
      ? 'العمليات في هذه الصفحة يمكن أن تؤثر على جميع البيانات في النظام. تأكد من فهم العواقب قبل المتابعة.' 
      : 'Operations on this page can affect all data in the system. Make sure you understand the consequences before proceeding.',
    permissionNote: effectiveLang === 'ar' 
      ? 'تحتاج إلى صلاحيات خاصة لتنفيذ عمليات النسخ الاحتياطي والاستعادة.' 
      : 'You need special permissions to perform backup and restore operations.',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <PageTitle className="mb-2">{t.pageTitle}</PageTitle>
          <p className="text-muted-foreground">{t.pageDescription}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/admin/order-codes`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToAdmin}
          </Link>
        </Button>
      </div>

      {/* Admin Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>{t.adminOnly}</strong>
          <br />
          {t.adminOnlyDescription}
        </AlertDescription>
      </Alert>

      {/* Danger Zone Alert */}
      <Alert variant="destructive">
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>{t.dangerZone}</strong>
          <br />
          {t.dangerZoneDescription}
        </AlertDescription>
      </Alert>

      {/* Permission Check */}
      {(!hasBackupPermission || !hasRestorePermission) && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t.permissionNote}
            <br />
            {!hasBackupPermission && (effectiveLang === 'ar' ? 'لا تملك صلاحية النسخ الاحتياطي.' : 'You do not have backup permission.')}
            {!hasRestorePermission && (effectiveLang === 'ar' ? 'لا تملك صلاحية الاستعادة.' : 'You do not have restore permission.')}
          </AlertDescription>
        </Alert>
      )}

      {/* Database Backup Manager */}
      <DatabaseBackupManager lang={effectiveLang} />
    </div>
  );
}
