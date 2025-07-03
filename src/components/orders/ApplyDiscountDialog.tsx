'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ref, update, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Percent, DollarSign, AlertTriangle, Save, Loader } from 'lucide-react';
import type { Order } from '@/types';
import { format } from 'date-fns';

interface ApplyDiscountDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order;
  lang: 'ar' | 'en';
  currentUserName: string;
  onDiscountApplied: () => void;
}

export function ApplyDiscountDialog({
  isOpen,
  setIsOpen,
  order,
  lang,
  currentUserName,
  onDiscountApplied
}: ApplyDiscountDialogProps) {
  const { toast } = useToast();
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  const t = {
    dialogTitle: lang === 'ar' ? 'تطبيق خصم على الطلب' : 'Apply Discount to Order',
    dialogDescription: lang === 'ar' ? 'يمكنك تطبيق خصم على هذا الطلب' : 'You can apply a discount to this order',
    discountAmountLabel: lang === 'ar' ? 'مبلغ الخصم' : 'Discount Amount',
    discountReasonLabel: lang === 'ar' ? 'سبب الخصم' : 'Discount Reason',
    discountReasonPlaceholder: lang === 'ar' ? 'اكتب سبب تطبيق الخصم...' : 'Enter reason for discount...',
    currentTotal: lang === 'ar' ? 'إجمالي الطلب' : 'Order Total',
    currentPaid: lang === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid',
    currentDiscount: lang === 'ar' ? 'الخصم الحالي' : 'Current Discount',
    remainingAmount: lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount',
    newRemainingAmount: lang === 'ar' ? 'المبلغ المتبقي بعد الخصم' : 'New Remaining Amount',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    applyDiscount: lang === 'ar' ? 'تطبيق الخصم' : 'Apply Discount',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    discountAmountRequired: lang === 'ar' ? 'مبلغ الخصم مطلوب' : 'Discount amount is required',
    discountReasonRequired: lang === 'ar' ? 'سبب الخصم مطلوب' : 'Discount reason is required',
    discountTooHigh: lang === 'ar' ? 'مبلغ الخصم لا يمكن أن يتجاوز المبلغ المتبقي' : 'Discount amount cannot exceed remaining amount',
    discountAppliedSuccess: lang === 'ar' ? 'تم تطبيق الخصم بنجاح' : 'Discount applied successfully',
    discountApplyError: lang === 'ar' ? 'فشل في تطبيق الخصم' : 'Failed to apply discount',
    orderStatusRestriction: lang === 'ar' ? 'لا يمكن تطبيق خصم على طلب تم تسليمه للعميل' : 'Cannot apply discount to order that has been delivered to customer',
    invalidDiscountAmount: lang === 'ar' ? 'مبلغ الخصم يجب أن يكون أكبر من صفر' : 'Discount amount must be greater than zero',
  };

  const currentDiscountAmount = order.discountAmount || 0;
  const remainingAmount = order.remainingAmount;
  const newRemainingAmount = remainingAmount - discountAmount;

  const handleApplyDiscount = async () => {
    // Validation
    if (!discountAmount || discountAmount <= 0) {
      toast({
        title: t.invalidDiscountAmount,
        variant: 'destructive',
      });
      return;
    }

    if (!discountReason.trim()) {
      toast({
        title: t.discountReasonRequired,
        variant: 'destructive',
      });
      return;
    }

    if (discountAmount > remainingAmount) {
      toast({
        title: t.discountTooHigh,
        variant: 'destructive',
      });
      return;
    }

    // Check order status - cannot apply discount after delivery
    if (order.status === 'Delivered to Customer' || order.status === 'Completed') {
      toast({
        title: t.orderStatusRestriction,
        variant: 'destructive',
      });
      return;
    }

    setIsApplying(true);

    try {
      // Get current order data to ensure we have the latest state
      const orderRef = ref(database, `orders/${order.id}`);
      const orderSnap = await get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const currentOrderData = orderSnap.val();
      const currentRemainingAmount = currentOrderData.remainingAmount || 0;

      // Double-check that discount doesn't exceed remaining amount
      if (discountAmount > currentRemainingAmount) {
        throw new Error(t.discountTooHigh);
      }

      const newDiscountAmount = (currentOrderData.discountAmount || 0) + discountAmount;
      const newRemainingAmount = currentRemainingAmount - discountAmount;

      // Create discount note
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const discountNote = `[${timestamp}] - ${lang === 'ar' ? 'تم تطبيق خصم بقيمة' : 'Discount applied:'} ${discountAmount} ${t.currencySymbol} ${lang === 'ar' ? 'بواسطة' : 'by'} ${currentUserName}. ${lang === 'ar' ? 'السبب:' : 'Reason:'} ${discountReason}`;
      
      const existingNotes = currentOrderData.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${discountNote}` : discountNote;

      // Update order with discount
      await update(orderRef, {
        discountAmount: newDiscountAmount,
        remainingAmount: newRemainingAmount,
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: t.discountAppliedSuccess,
        description: `${lang === 'ar' ? 'تم تطبيق خصم بقيمة' : 'Applied discount of'} ${discountAmount} ${t.currencySymbol}`,
      });

      // Reset form and close dialog
      setDiscountAmount(0);
      setDiscountReason('');
      setIsOpen(false);
      onDiscountApplied();

    } catch (error) {
      console.error('Error applying discount:', error);
      toast({
        title: t.discountApplyError,
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const canApplyDiscount = order.status !== 'Delivered to Customer' && order.status !== 'Completed';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Percent className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {t.dialogDescription} #{order.orderCode || order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t.currentTotal}:</span>
              <span className="font-medium">{t.currencySymbol} {order.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.currentPaid}:</span>
              <span className="font-medium">{t.currencySymbol} {order.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.currentDiscount}:</span>
              <span className="font-medium">{t.currencySymbol} {currentDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">{t.remainingAmount}:</span>
              <span className="font-semibold">{t.currencySymbol} {remainingAmount.toFixed(2)}</span>
            </div>
          </div>

          {!canApplyDiscount && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t.orderStatusRestriction}
              </AlertDescription>
            </Alert>
          )}

          {canApplyDiscount && (
            <>
              {/* Discount Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="discountAmount">{t.discountAmountLabel} ({t.currencySymbol})</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              {/* Discount Reason */}
              <div className="space-y-2">
                <Label htmlFor="discountReason">{t.discountReasonLabel}</Label>
                <Textarea
                  id="discountReason"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder={t.discountReasonPlaceholder}
                  rows={3}
                />
              </div>

              {/* New Remaining Amount Preview */}
              {discountAmount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t.newRemainingAmount}:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {t.currencySymbol} {newRemainingAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isApplying}>
            {t.cancel}
          </Button>
          {canApplyDiscount && (
            <Button 
              onClick={handleApplyDiscount} 
              disabled={isApplying || !discountAmount || !discountReason.trim()}
            >
              {isApplying ? (
                <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              ) : (
                <Save className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              )}
              {t.applyDiscount}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
