'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageTitle } from '@/components/shared/PageTitle';
import { OrderCodeManager } from '@/components/admin/OrderCodeManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOrderCodeMonitor } from '@/hooks/useOrderCodeMonitor';
import { findDuplicateOrderCodes, repairDuplicateOrderCodes } from '@/lib/orderValidation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  Database,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function OrderCodesAdminPage() {
  const params = useParams();
  const { toast } = useToast();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';
  
  const { 
    currentCounter, 
    totalOrders, 
    duplicateCodes, 
    isLoading, 
    error, 
    refreshStats,
    hasDuplicates 
  } = useOrderCodeMonitor();

  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState<{
    repaired: number;
    errors: string[];
  } | null>(null);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة أكواد الطلبات' : 'Order Codes Management',
    pageDescription: effectiveLang === 'ar' ? 'مراقبة وإدارة أكواد الطلبات في النظام' : 'Monitor and manage order codes in the system',
    systemStatus: effectiveLang === 'ar' ? 'حالة النظام' : 'System Status',
    currentCounter: effectiveLang === 'ar' ? 'العداد الحالي' : 'Current Counter',
    totalOrders: effectiveLang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    duplicateCodes: effectiveLang === 'ar' ? 'أكواد مكررة' : 'Duplicate Codes',
    systemHealthy: effectiveLang === 'ar' ? 'النظام يعمل بشكل طبيعي' : 'System is healthy',
    duplicatesDetected: effectiveLang === 'ar' ? 'تم اكتشاف أكواد مكررة' : 'Duplicate codes detected',
    repairDuplicates: effectiveLang === 'ar' ? 'إصلاح الأكواد المكررة' : 'Repair Duplicate Codes',
    repairInProgress: effectiveLang === 'ar' ? 'جاري الإصلاح...' : 'Repairing...',
    repairCompleted: effectiveLang === 'ar' ? 'تم الإصلاح بنجاح' : 'Repair completed successfully',
    repairFailed: effectiveLang === 'ar' ? 'فشل في الإصلاح' : 'Repair failed',
    repairedCount: effectiveLang === 'ar' ? 'تم إصلاح' : 'Repaired',
    orders: effectiveLang === 'ar' ? 'طلبات' : 'orders',
    refresh: effectiveLang === 'ar' ? 'تحديث' : 'Refresh',
    error: effectiveLang === 'ar' ? 'خطأ' : 'Error',
    loading: effectiveLang === 'ar' ? 'جاري التحميل...' : 'Loading...'
  };

  const handleRepairDuplicates = async () => {
    setIsRepairing(true);
    setRepairResults(null);
    
    try {
      const results = await repairDuplicateOrderCodes(effectiveLang);
      setRepairResults(results);
      
      if (results.repaired > 0) {
        toast({
          title: t.repairCompleted,
          description: `${t.repairedCount} ${results.repaired} ${t.orders}`,
        });
        // Refresh stats after repair
        await refreshStats();
      } else if (results.errors.length > 0) {
        toast({
          title: t.repairFailed,
          description: results.errors[0],
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error repairing duplicates:', error);
      toast({
        title: t.error,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsRepairing(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <PageTitle 
          title={t.pageTitle}
          description={t.pageDescription}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle 
        title={t.pageTitle}
        description={t.pageDescription}
      />

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t.systemStatus}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Counter */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.currentCounter}</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : (currentCounter || 'N/A')}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
            
            {/* Total Orders */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalOrders}</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : totalOrders}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            
            {/* Duplicate Codes */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.duplicateCodes}</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : duplicateCodes.length}
                </p>
              </div>
              {hasDuplicates ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>

            {/* System Health */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={hasDuplicates ? "destructive" : "default"}>
                  {hasDuplicates ? t.duplicatesDetected : t.systemHealthy}
                </Badge>
              </div>
              {hasDuplicates ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              onClick={refreshStats} 
              disabled={isLoading} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.refresh}
            </Button>
            
            {hasDuplicates && (
              <Button 
                onClick={handleRepairDuplicates} 
                disabled={isRepairing}
                variant="destructive"
              >
                <Wrench className="h-4 w-4 mr-2" />
                {isRepairing ? t.repairInProgress : t.repairDuplicates}
              </Button>
            )}
          </div>

          {/* Repair Results */}
          {repairResults && (
            <div className="mt-4">
              <Alert variant={repairResults.errors.length > 0 ? "destructive" : "default"}>
                <AlertDescription>
                  <div className="space-y-2">
                    {repairResults.repaired > 0 && (
                      <p>{t.repairedCount} {repairResults.repaired} {t.orders}</p>
                    )}
                    {repairResults.errors.length > 0 && (
                      <div>
                        <p>Errors:</p>
                        <ul className="list-disc list-inside">
                          {repairResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Duplicate Codes List */}
          {duplicateCodes.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">{t.duplicateCodes}:</h4>
              <div className="flex flex-wrap gap-1">
                {duplicateCodes.map(code => (
                  <Badge key={code} variant="destructive">{code}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {effectiveLang === 'ar' ? 'أدوات إدارية أخرى' : 'Other Admin Tools'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href={`/${effectiveLang}/admin/quantity-sync`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {effectiveLang === 'ar' ? 'مزامنة كميات المنتجات' : 'Sync Product Quantities'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Code Manager Component */}
      <OrderCodeManager lang={effectiveLang} />
    </div>
  );
}
