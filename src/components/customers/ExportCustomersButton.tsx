'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Customer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeCustomers } from '@/context/RealtimeDataContext';
import { useToast } from '@/hooks/use-toast';
import { exportCustomersToExcel } from '@/lib/customer-export';

interface ExportCustomersButtonProps {
  lang: 'ar' | 'en';
  customers?: Customer[];
}

export function ExportCustomersButton({ lang, customers }: ExportCustomersButtonProps) {
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { customers: realtimeCustomers, isLoading: realtimeLoading } = useRealtimeCustomers();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const t = {
    exportCustomers: lang === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel',
    exporting: lang === 'ar' ? 'جاري التصدير...' : 'Exporting...',
    exportSuccess: (count: number) =>
      lang === 'ar'
        ? `تم تصدير ${count} عميل بنجاح.`
        : `Successfully exported ${count} customers.`,
    exportError: lang === 'ar' ? 'فشل تصدير العملاء.' : 'Failed to export customers.',
    noCustomers: lang === 'ar' ? 'لا يوجد عملاء للتصدير.' : 'No customers to export.',
  };

  const branchVisibleCustomers = useMemo(() => {
    const sourceCustomers = customers ?? realtimeCustomers;

    return sourceCustomers.filter((customer) => {
      if (!currentUser || hasPermission('view_all_branches')) {
        return true;
      }

      if (currentUser.branchId) {
        return customer.branchId === currentUser.branchId;
      }

      return true;
    });
  }, [customers, realtimeCustomers, currentUser, hasPermission]);

  const handleExport = useCallback(async () => {
    if (branchVisibleCustomers.length === 0) {
      toast({
        title: t.noCustomers,
        variant: 'default',
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportCustomersToExcel(branchVisibleCustomers, lang);
      toast({
        title: t.exportSuccess(branchVisibleCustomers.length),
      });
    } catch (error) {
      console.error('Export customers error:', error);
      toast({
        title: t.exportError,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [branchVisibleCustomers, lang, toast, t.exportError, t.exportSuccess, t.noCustomers]);

  if (authIsLoading || !hasPermission('customers_export')) {
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
      ) : (
        <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
      )}
      {isExporting ? t.exporting : t.exportCustomers}
    </Button>
  );
}
