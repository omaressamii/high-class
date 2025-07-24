
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types'; // Assuming Order includes productName, customerName etc.
import { PackageSearch, UserCircle, ShoppingBag, CalendarDays, DollarSign, StickyNote, Phone, Store } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';

type OrderWithDetails = Order & {
  productName?: string;
  customerName?: string;
  customerPhoneNumber?: string;
  branchName?: string;
};

interface OrderPreparationDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: OrderWithDetails | null;
  lang: 'ar' | 'en';
}

export function OrderPreparationDetailsDialog({ isOpen, setIsOpen, order, lang }: OrderPreparationDetailsDialogProps) {
  if (!order) return null;

  const locale = lang === 'ar' ? arSA : enUS;

  const t = {
    dialogTitle: lang === 'ar' ? 'تفاصيل تجهيز الطلب' : 'Order Preparation Details',
    orderId: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    product: lang === 'ar' ? 'المنتج' : 'Product',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    customerPhone: lang === 'ar' ? 'هاتف العميل' : 'Customer Phone',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    totalPrice: lang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    paidAmount: lang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount',
    remainingAmount: lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount',
    notes: lang === 'ar' ? 'ملاحظات الطلب' : 'Order Notes',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    viewFullOrder: lang === 'ar' ? 'عرض الطلب الكامل' : 'View Full Order',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    notAvailable: lang === 'ar' ? 'غير متوفر' : 'N/A',
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return t.notAvailable;
    try {
      const dateObj = new Date(dateString.replace(/-/g, '/')); // More robust parsing for yyyy-MM-dd
      if (isNaN(dateObj.getTime())) return dateString;
      return format(dateObj, 'PPP', { locale });
    } catch { return dateString; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`sm:max-w-md printable-dialog-content ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PackageSearch className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {t.orderId}: {order.id}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 text-sm receipt-info">
          <p><ShoppingBag className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.product}:</strong> {order.productName || t.notAvailable}</p>
          <p><UserCircle className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.customer}:</strong> {order.customerName || t.notAvailable}</p>
          {order.customerPhoneNumber && <p><Phone className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.customerPhone}:</strong> {order.customerPhoneNumber}</p>}
          {order.branchName && <p><Store className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.branch}:</strong> {order.branchName}</p>}
          <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.deliveryDate}:</strong> {formatDateDisplay(order.deliveryDate)}</p>
          <hr className="receipt-divider my-2" />
          <p><DollarSign className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.totalPrice}:</strong> {t.currencySymbol} {order.totalPrice.toFixed(2)}</p>
          <p><DollarSign className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.paidAmount}:</strong> {t.currencySymbol} {order.paidAmount.toFixed(2)}</p>
          <p className={order.remainingAmount > 0 ? "font-bold text-destructive" : ""}><DollarSign className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>{t.remainingAmount}:</strong> {t.currencySymbol} {order.remainingAmount.toFixed(2)}</p>
          {order.notes && (
            <>
            <hr className="receipt-divider my-2" />
            <p className="receipt-section-title no-screen"><strong>{t.notes}:</strong></p> {/* Hidden on screen, visible on print */}
            <div className="flex items-start">
                <StickyNote className="inline h-4 w-4 mr-1 mt-0.5 text-muted-foreground shrink-0 no-print-in-dialog" />
                <p className="whitespace-pre-wrap receipt-value wrap"> <strong className="no-screen">{t.notes}: </strong> {order.notes}</p>
            </div>
            </>
          )}
        </div>
        <DialogFooter className="sm:justify-between dialog-footer-no-print">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            {lang === 'ar' ? 'طباعة' : 'Print'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" asChild className="dialog-close-no-print">
              <Link href={`/${lang}/orders/${order.id}`} onClick={() => setIsOpen(false)}>
                {t.viewFullOrder}
              </Link>
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="dialog-close-no-print">{t.close}</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
