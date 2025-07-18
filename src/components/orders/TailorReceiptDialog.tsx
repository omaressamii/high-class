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
        <div className="py-4 space-y-4 text-sm receipt-content">
          {/* Header */}
          <div className="text-center border-b pb-3 print-only">
            <h1 className="text-lg font-bold">{t.companyName}</h1>
            <h2 className="text-base font-semibold mt-1">{t.tailorReceiptTitle}</h2>
          </div>

          {/* Order Information */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <strong>{t.orderCode}:</strong> {order.orderCode || order.id}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <strong>{t.customer}:</strong> {order.customerName || t.notAvailable}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <strong>{t.phone}:</strong> {order.customerPhoneNumber || t.notAvailable}
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <strong>{t.product}:</strong> {order.productName || t.notAvailable}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <strong>{t.deliveryDate}:</strong> {order.deliveryDate}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <strong>{t.branch}:</strong> {order.branchName || t.notAvailable}
              </div>
            </div>
          </div>

          {/* Special Instructions Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">{t.specialInstructions}</h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل التعليمات الخاصة للخياط...' : 'Enter special instructions for the tailor...'}
              className="min-h-[120px] resize-none"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <div className="mt-3 print-only">
              <div className="whitespace-pre-wrap text-sm">{specialInstructions}</div>
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
