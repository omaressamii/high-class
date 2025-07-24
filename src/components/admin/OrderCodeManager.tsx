'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getCurrentOrderCodeCounter, 
  resetOrderCodeCounter, 
  verifyOrderCodeUniqueness,
  initializeOrderCodeCounter 
} from '@/lib/orderCodeUtils';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { AlertTriangle, CheckCircle, RefreshCw, Settings, Database } from 'lucide-react';

interface OrderCodeManagerProps {
  lang: 'ar' | 'en';
}

export function OrderCodeManager({ lang }: OrderCodeManagerProps) {
  const [currentCounter, setCurrentCounter] = useState<number | null>(null);
  const [newCounterValue, setNewCounterValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateCodes, setDuplicateCodes] = useState<string[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const { toast } = useToast();

  const t = {
    title: lang === 'ar' ? 'إدارة أكواد الطلبات' : 'Order Code Management',
    description: lang === 'ar' ? 'إدارة ومراقبة أكواد الطلبات في النظام' : 'Manage and monitor order codes in the system',
    currentCounter: lang === 'ar' ? 'العداد الحالي' : 'Current Counter',
    totalOrders: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    duplicateCodes: lang === 'ar' ? 'أكواد مكررة' : 'Duplicate Codes',
    noDuplicates: lang === 'ar' ? 'لا توجد أكواد مكررة' : 'No duplicate codes found',
    resetCounter: lang === 'ar' ? 'إعادة تعيين العداد' : 'Reset Counter',
    newValue: lang === 'ar' ? 'القيمة الجديدة' : 'New Value',
    reset: lang === 'ar' ? 'إعادة تعيين' : 'Reset',
    refresh: lang === 'ar' ? 'تحديث' : 'Refresh',
    checkDuplicates: lang === 'ar' ? 'فحص التكرارات' : 'Check Duplicates',
    initialize: lang === 'ar' ? 'تهيئة العداد' : 'Initialize Counter',
    warning: lang === 'ar' ? 'تحذير: إعادة تعيين العداد قد يؤدي إلى تكرار الأكواد إذا لم يتم بحذر' : 'Warning: Resetting the counter may cause duplicate codes if not done carefully',
    success: lang === 'ar' ? 'تم بنجاح' : 'Success',
    error: lang === 'ar' ? 'خطأ' : 'Error',
    counterReset: lang === 'ar' ? 'تم إعادة تعيين العداد بنجاح' : 'Counter reset successfully',
    counterInitialized: lang === 'ar' ? 'تم تهيئة العداد بنجاح' : 'Counter initialized successfully',
    duplicatesFound: lang === 'ar' ? 'تم العثور على أكواد مكررة' : 'Duplicate codes found',
    noDuplicatesFound: lang === 'ar' ? 'لم يتم العثور على أكواد مكررة' : 'No duplicate codes found'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const counter = await getCurrentOrderCodeCounter();
      setCurrentCounter(counter);
      
      // Get total orders count
      const ordersRef = ref(database, 'orders');
      const ordersSnap = await get(ordersRef);
      if (ordersSnap.exists()) {
        setTotalOrders(Object.keys(ordersSnap.val()).length);
      } else {
        setTotalOrders(0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t.error,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCounter = async () => {
    if (!newCounterValue || isNaN(Number(newCounterValue))) {
      toast({
        title: t.error,
        description: lang === 'ar' ? 'يرجى إدخال قيمة صحيحة' : 'Please enter a valid value',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetOrderCodeCounter(Number(newCounterValue));
      setCurrentCounter(Number(newCounterValue));
      setNewCounterValue('');
      toast({
        title: t.success,
        description: t.counterReset
      });
    } catch (error) {
      console.error('Error resetting counter:', error);
      toast({
        title: t.error,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeCounter = async () => {
    setIsLoading(true);
    try {
      await initializeOrderCodeCounter();
      await loadData();
      toast({
        title: t.success,
        description: t.counterInitialized
      });
    } catch (error) {
      console.error('Error initializing counter:', error);
      toast({
        title: t.error,
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForDuplicates = async () => {
    setIsLoading(true);
    try {
      const ordersRef = ref(database, 'orders');
      const ordersSnap = await get(ordersRef);
      
      if (!ordersSnap.exists()) {
        setDuplicateCodes([]);
        toast({
          title: t.success,
          description: t.noDuplicatesFound
        });
        return;
      }

      const orders = ordersSnap.val();
      const codeCount: { [key: string]: number } = {};
      
      // Count occurrences of each order code
      Object.values(orders).forEach((order: any) => {
        if (order.orderCode) {
          codeCount[order.orderCode] = (codeCount[order.orderCode] || 0) + 1;
        }
      });

      // Find duplicates
      const duplicates = Object.keys(codeCount).filter(code => codeCount[code] > 1);
      setDuplicateCodes(duplicates);

      if (duplicates.length > 0) {
        toast({
          title: t.duplicatesFound,
          description: `${duplicates.length} ${lang === 'ar' ? 'كود مكرر' : 'duplicate codes'}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: t.success,
          description: t.noDuplicatesFound
        });
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast({
        title: t.error,
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
            <Settings className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.currentCounter}</p>
                <p className="text-2xl font-bold">{currentCounter || 'N/A'}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalOrders}</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.duplicateCodes}</p>
                <p className="text-2xl font-bold">{duplicateCodes.length}</p>
              </div>
              {duplicateCodes.length > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadData} disabled={isLoading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.refresh}
            </Button>
            
            <Button onClick={checkForDuplicates} disabled={isLoading} variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t.checkDuplicates}
            </Button>
            
            <Button onClick={handleInitializeCounter} disabled={isLoading} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {t.initialize}
            </Button>
          </div>

          {/* Duplicate Codes Display */}
          {duplicateCodes.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{t.duplicatesFound}:</p>
                  <div className="flex flex-wrap gap-1">
                    {duplicateCodes.map(code => (
                      <Badge key={code} variant="destructive">{code}</Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Reset Counter Section */}
          <div className="border-t pt-6">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t.warning}</AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newCounter">{t.newValue}</Label>
                <Input
                  id="newCounter"
                  type="number"
                  value={newCounterValue}
                  onChange={(e) => setNewCounterValue(e.target.value)}
                  placeholder="70000001"
                />
              </div>
              
              <Button 
                onClick={handleResetCounter} 
                disabled={isLoading || !newCounterValue}
                variant="destructive"
              >
                {t.reset}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
