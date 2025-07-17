'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { syncAllProductQuantities } from '@/lib/quantitySync';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface QuantitySyncManagerProps {
  lang: 'ar' | 'en';
}

export function QuantitySyncManager({ lang }: QuantitySyncManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    updated: number;
    errors: string[];
    report: Array<{
      productId: string;
      productName: string;
      oldQuantity: number;
      newQuantity: number;
    }>;
  } | null>(null);
  const { toast } = useToast();

  const t = {
    title: lang === 'ar' ? 'مزامنة كميات المنتجات' : 'Product Quantity Sync',
    description: lang === 'ar' 
      ? 'مزامنة كميات المنتجات المؤجرة مع الطلبات النشطة الفعلية' 
      : 'Sync product rented quantities with actual active orders',
    syncButton: lang === 'ar' ? 'مزامنة الكميات' : 'Sync Quantities',
    syncing: lang === 'ar' ? 'جاري المزامنة...' : 'Syncing...',
    syncComplete: lang === 'ar' ? 'تمت المزامنة بنجاح' : 'Sync completed successfully',
    syncError: lang === 'ar' ? 'خطأ في المزامنة' : 'Sync error',
    updatedProducts: lang === 'ar' ? 'المنتجات المحدثة' : 'Updated Products',
    noUpdatesNeeded: lang === 'ar' ? 'لا توجد تحديثات مطلوبة' : 'No updates needed',
    productName: lang === 'ar' ? 'اسم المنتج' : 'Product Name',
    oldQuantity: lang === 'ar' ? 'الكمية القديمة' : 'Old Quantity',
    newQuantity: lang === 'ar' ? 'الكمية الجديدة' : 'New Quantity',
    errors: lang === 'ar' ? 'الأخطاء' : 'Errors',
    warning: lang === 'ar' ? 'تحذير' : 'Warning',
    warningMessage: lang === 'ar' 
      ? 'هذه العملية ستقوم بتحديث كميات المنتجات المؤجرة في قاعدة البيانات بناءً على الطلبات النشطة الفعلية. تأكد من أن جميع الطلبات محدثة قبل تشغيل هذه العملية.'
      : 'This operation will update product rented quantities in the database based on actual active orders. Make sure all orders are up to date before running this operation.',
  };

  const handleSync = async () => {
    setIsLoading(true);
    setSyncResult(null);

    try {
      const result = await syncAllProductQuantities();
      setSyncResult(result);

      if (result.errors.length > 0) {
        toast({
          title: t.syncError,
          description: `${result.updated} products updated, ${result.errors.length} errors`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: t.syncComplete,
          description: `${result.updated} products updated`,
        });
      }
    } catch (error) {
      toast({
        title: t.syncError,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">{t.warning}</h4>
              <p className="text-sm text-yellow-700 mt-1">{t.warningMessage}</p>
            </div>
          </div>

          {/* Sync Button */}
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.syncing}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.syncButton}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.syncComplete}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <Badge variant="secondary">
                {t.updatedProducts}: {syncResult.updated}
              </Badge>
              {syncResult.errors.length > 0 && (
                <Badge variant="destructive">
                  {t.errors}: {syncResult.errors.length}
                </Badge>
              )}
            </div>

            {/* Updated Products Table */}
            {syncResult.report.length > 0 ? (
              <div>
                <h4 className="font-medium mb-2">{t.updatedProducts}</h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.productName}</TableHead>
                        <TableHead className="text-center">{t.oldQuantity}</TableHead>
                        <TableHead className="text-center">{t.newQuantity}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncResult.report.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.oldQuantity}</TableCell>
                          <TableCell className="text-center font-bold text-blue-600">
                            {item.newQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <Info className="h-5 w-5 text-green-600" />
                <span className="text-green-700">{t.noUpdatesNeeded}</span>
              </div>
            )}

            {/* Errors */}
            {syncResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">{t.errors}</h4>
                <div className="space-y-2">
                  {syncResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
