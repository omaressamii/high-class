'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, User, Package, Calendar, Phone, MapPin } from 'lucide-react';
import type { Order } from '@/types';

interface TailorReceiptDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order & {
    productName?: string;
    customerName?: string;
    customerPhoneNumber?: string;
    branchName?: string;
  };
  lang: 'ar' | 'en';
}

export function TailorReceiptDialog({ isOpen, setIsOpen, order, lang }: TailorReceiptDialogProps) {
  // Initialize special instructions with order notes if available
  const [specialInstructions, setSpecialInstructions] = useState(order.notes || '');

  // Update special instructions when order changes
  useEffect(() => {
    setSpecialInstructions(order.notes || '');
  }, [order.notes]);

  const t = {
    dialogTitle: lang === 'ar' ? 'وصل تفاصيل المقاسات للخياط' : 'Tailor Measurements Receipt',
    orderCode: lang === 'ar' ? 'رقم الطلب' : 'Order Code',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    product: lang === 'ar' ? 'المنتج' : 'Product',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    phone: lang === 'ar' ? 'الهاتف' : 'Phone',
    specialInstructions: lang === 'ar' ? 'تعليمات خاصة' : 'Special Instructions',
    print: lang === 'ar' ? 'طباعة' : 'Print',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    notAvailable: lang === 'ar' ? 'غير متوفر' : 'Not Available',
    tailorReceiptTitle: lang === 'ar' ? 'وصل تسليم للخياط' : 'Tailor Delivery Receipt',
    companyName: lang === 'ar' ? 'شركة الأناقة العالية' : 'High Class Company',

  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`sm:max-w-md max-h-[80vh] overflow-y-auto printable-dialog-content ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center">
            <Scissors className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.dialogTitle}
          </DialogTitle>
        </DialogHeader>
        
        {/* Printable Content */}
        <div className="py-4 space-y-4 text-lg font-bold receipt-content" dir="rtl" style={{textAlign: 'right', direction: 'rtl'}}>
          {/* Header */}
          <div className="text-center border-b pb-3 print-only">
            <h1 className="text-2xl font-bold">{t.companyName}</h1>
            <h2 className="text-xl font-bold mt-2">{t.tailorReceiptTitle}</h2>
          </div>

          {/* Order Information */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.orderCode || order.id}</span>
                <strong className="text-lg">:{t.orderCode}</strong>
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.customerName || t.notAvailable}</span>
                <strong className="text-lg">:{t.customer}</strong>
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.customerPhoneNumber || t.notAvailable}</span>
                <strong className="text-lg">:{t.phone}</strong>
                <Phone className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.productName || t.notAvailable}</span>
                <strong className="text-lg">:{t.product}</strong>
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.deliveryDate}</span>
                <strong className="text-lg">:{t.deliveryDate}</strong>
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 justify-end" dir="rtl">
                <span className="text-lg">{order.branchName || t.notAvailable}</span>
                <strong className="text-lg">:{t.branch}</strong>
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Special Instructions Section */}
          <div className="border rounded-lg p-4" dir="rtl">
            <h3 className="text-xl font-bold mb-4 text-right">{t.specialInstructions}</h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل التعليمات الخاصة للخياط...' : 'Enter special instructions for the tailor...'}
              className="min-h-[120px] resize-none text-right"
              dir="rtl"
              style={{textAlign: 'right', direction: 'rtl'}}
            />
            <div className="mt-3 print-only" dir="rtl">
              <div className="whitespace-pre-wrap text-lg font-bold text-right" style={{textAlign: 'right', direction: 'rtl'}}>{specialInstructions}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Scissors className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.print}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t.close}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
