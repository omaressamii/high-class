'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ref, update, get, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { CreditCard, DollarSign, AlertTriangle, Save, Loader } from 'lucide-react';
import type { Order, FinancialTransaction, PaymentMethod } from '@/types';
import { format } from 'date-fns';

interface AddPaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order;
  lang: 'ar' | 'en';
  currentUserName: string;
  onPaymentAdded: () => void;
}

const paymentMethods: PaymentMethod[] = ['Cash', 'Card', 'Bank Transfer', 'Other'];

export function AddPaymentDialog({
  isOpen,
  setIsOpen,
  order,
  lang,
  currentUserName,
  onPaymentAdded
}: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const t = {
    addPaymentTitle: lang === 'ar' ? 'إضافة دفعة' : 'Add Payment',
    addPaymentDescription: lang === 'ar' ? 'أضف دفعة جديدة لهذا الطلب' : 'Add a new payment for this order',
    paymentAmountLabel: lang === 'ar' ? 'مبلغ الدفعة' : 'Payment Amount',
    paymentMethodLabel: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    paymentNotesLabel: lang === 'ar' ? 'ملاحظات الدفعة' : 'Payment Notes',
    paymentNotesPlaceholder: lang === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...',
    remainingAmountLabel: lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount',
    newRemainingAmountLabel: lang === 'ar' ? 'المبلغ المتبقي بعد الدفعة' : 'Remaining Amount After Payment',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    addPayment: lang === 'ar' ? 'إضافة الدفعة' : 'Add Payment',
    processing: lang === 'ar' ? 'جار المعالجة...' : 'Processing...',
    currencySymbol: lang === 'ar' ? 'جنيه' : 'SAR',
    invalidPaymentAmount: lang === 'ar' ? 'مبلغ الدفعة يجب أن يكون أكبر من صفر' : 'Payment amount must be greater than zero',
    paymentMethodRequired: lang === 'ar' ? 'طريقة الدفع مطلوبة' : 'Payment method is required',
    paymentTooHigh: lang === 'ar' ? 'مبلغ الدفعة لا يمكن أن يتجاوز المبلغ المتبقي' : 'Payment amount cannot exceed remaining amount',
    paymentAddedSuccess: lang === 'ar' ? 'تم إضافة الدفعة بنجاح' : 'Payment added successfully',
    paymentAddError: lang === 'ar' ? 'خطأ في إضافة الدفعة' : 'Error adding payment',
    cash: lang === 'ar' ? 'نقدي' : 'Cash',
    card: lang === 'ar' ? 'بطاقة' : 'Card',
    bankTransfer: lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    other: lang === 'ar' ? 'أخرى' : 'Other',
  };

  const remainingAmount = order.remainingAmount || 0;
  const newRemainingAmount = remainingAmount - paymentAmount;

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash': return t.cash;
      case 'Card': return t.card;
      case 'Bank Transfer': return t.bankTransfer;
      case 'Other': return t.other;
      default: return method;
    }
  };

  const handleAddPayment = async () => {
    // Validation
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: t.invalidPaymentAmount,
        variant: 'destructive',
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: t.paymentMethodRequired,
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast({
        title: t.paymentTooHigh,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get current order data to ensure we have the latest state
      const orderRef = ref(database, `orders/${order.id}`);
      const orderSnap = await get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const currentOrderData = orderSnap.val();
      const currentRemainingAmount = currentOrderData.remainingAmount || 0;
      const currentPaidAmount = currentOrderData.paidAmount || 0;

      // Double-check that payment doesn't exceed remaining amount
      if (paymentAmount > currentRemainingAmount) {
        throw new Error(t.paymentTooHigh);
      }

      const newPaidAmount = currentPaidAmount + paymentAmount;
      const newRemainingAmountFinal = currentRemainingAmount - paymentAmount;

      // Create payment note
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const paymentNote = `[${timestamp}] - ${lang === 'ar' ? 'تم إضافة دفعة بقيمة' : 'Payment added:'} ${paymentAmount} ${t.currencySymbol} ${lang === 'ar' ? 'بواسطة' : 'by'} ${currentUserName}. ${lang === 'ar' ? 'طريقة الدفع:' : 'Payment method:'} ${getPaymentMethodDisplay(paymentMethod)}${paymentNotes ? `. ${lang === 'ar' ? 'ملاحظات:' : 'Notes:'} ${paymentNotes}` : ''}`;

      const existingNotes = currentOrderData.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${paymentNote}` : paymentNote;

      // Update order with payment
      await update(orderRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmountFinal,
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      // Create financial transaction for the payment
      const financialTransactionBase = {
        orderId: order.id,
        orderCode: order.orderCode || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        processedByUserId: currentUserName || 'UNKNOWN',
        processedByUserName: currentUserName,
        customerId: order.customerId,
        customerName: order.customerName,
        branchId: order.branchId,
        branchName: order.branchName,
        createdAt: new Date().toISOString(),
      };

      const paymentTransaction: Omit<FinancialTransaction, 'id'> = {
        ...financialTransactionBase,
        type: 'Payment Received',
        transactionCategory: 'Payment',
        description: `${lang === 'ar' ? 'دفعة مستلمة للطلب' : 'Payment received for order'}: ${order.orderCode || order.id}${paymentNotes ? ` - ${paymentNotes}` : ''}`,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        notes: paymentNotes || undefined,
      };

      // Save financial transaction
      const financialTransactionsRef = ref(database, 'financial_transactions');
      const cleanPaymentTransaction = Object.fromEntries(
        Object.entries(paymentTransaction).filter(([, value]) => value !== undefined)
      );
      const ftRef = push(financialTransactionsRef);
      await set(ftRef, cleanPaymentTransaction);

      toast({
        title: t.paymentAddedSuccess,
        description: `${lang === 'ar' ? 'تم إضافة دفعة بقيمة' : 'Added payment of'} ${paymentAmount} ${t.currencySymbol}`,
      });

      // Reset form and close dialog
      setPaymentAmount(0);
      setPaymentMethod('');
      setPaymentNotes('');
      setIsOpen(false);
      onPaymentAdded();

    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: t.paymentAddError,
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canAddPayment = true; // remainingAmount > 0; // Temporarily allow for testing

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t.addPaymentTitle}
          </DialogTitle>
          <DialogDescription>
            {t.addPaymentDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>إجمالي الطلب:</strong> {(order.totalPrice || 0).toFixed(2)} {t.currencySymbol}</div>
                <div><strong>المبلغ المدفوع:</strong> {(order.paidAmount || 0).toFixed(2)} {t.currencySymbol}</div>
                <div><strong>{t.remainingAmountLabel}:</strong> {remainingAmount.toFixed(2)} {t.currencySymbol}</div>
                {paymentAmount > 0 && (
                  <div><strong>{t.newRemainingAmountLabel}:</strong> {newRemainingAmount.toFixed(2)} {t.currencySymbol}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {!canAddPayment && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {lang === 'ar' ? 'هذا الطلب مسدد بالكامل' : 'This order is fully paid'}
              </AlertDescription>
            </Alert>
          )}

          {canAddPayment && (
            <>
              {/* Payment Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">{t.paymentAmountLabel} ({t.currencySymbol})</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{t.paymentMethodLabel}</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.paymentMethodLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodDisplay(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Notes */}
              <div className="space-y-2">
                <Label htmlFor="paymentNotes">{t.paymentNotesLabel}</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={t.paymentNotesPlaceholder}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t.cancel}
          </Button>
          {canAddPayment && (
            <Button onClick={handleAddPayment} disabled={isProcessing || !paymentAmount || !paymentMethod}>
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                  {t.processing}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t.addPayment}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
