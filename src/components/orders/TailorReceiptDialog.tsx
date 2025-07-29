'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, User, Package, Calendar, Phone, MapPin } from 'lucide-react';
import type { Order } from '@/types';
import { useGeneralSettings } from '@/hooks/use-app-settings';

interface TailorReceiptDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order & {
    productName?: string;
    customerName?: string;
    customerPhoneNumber?: string;
    branchName?: string;
    measurementNotes?: string;
  };
  lang: 'ar' | 'en';
}

export function TailorReceiptDialog({ isOpen, setIsOpen, order, lang }: TailorReceiptDialogProps) {
  // Initialize special instructions from order's measurement notes
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Get company settings
  const { settings: generalSettings, isLoading: settingsLoading } = useGeneralSettings();

  // Set special instructions from order's measurement notes when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSpecialInstructions(order.measurementNotes || '');
    }
  }, [isOpen, order.measurementNotes]);

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
    companyName: lang === 'ar' ? generalSettings.companyNameAr : generalSettings.companyName,

  };

  const handlePrint = () => {
    // Create a new window for printing (same as invoice)
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const formatReceiptDate = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const dateObj = new Date(dateString.replace(/-/g, '/'));
        if (isNaN(dateObj.getTime())) return dateString;
        return dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
      } catch {
        return dateString;
      }
    };

    const tailorReceiptHTML = `
      <!DOCTYPE html>
      <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Tailor Receipt - ${order.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 16px;
            font-weight: bold;
            line-height: 1.5;
            color: black;
            background: white;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .header p {
            font-size: 16px;
            font-weight: bold;
            margin: 3px 0;
          }
          .section {
            margin: 10px 0;
          }
          .section h3 {
            font-size: 18px;
            font-weight: bold;
            margin: 8px 0;
            border-bottom: 2px dashed black;
            padding-bottom: 4px;
          }
          .line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            align-items: flex-start;
            font-weight: bold;
          }
          .line .label {
            flex-shrink: 0;
            margin-right: 10px;
            font-weight: bold;
          }
          .line .value {
            text-align: right;
            flex-grow: 1;
            word-wrap: break-word;
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed black;
            margin: 8px 0;
            height: 1px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 16px;
            font-weight: bold;
            border-top: 3px solid black;
            padding-top: 15px;
          }
          .notes {
            white-space: pre-line;
            word-wrap: break-word;
            margin: 8px 0;
            text-align: right;
            direction: rtl;
            font-weight: bold;
            line-height: 1.6;
            font-size: 14px;
          }
          .note-item {
            margin-bottom: 4px;
            display: block;
            padding-right: 5px;
          }
          @media print {
            body { margin: 0; padding: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t.companyName}</h1>
          <p>${t.tailorReceiptTitle}</p>
          ${order.branchName ? `<p>${t.branch}: ${order.branchName}</p>` : ''}
        </div>

        <div class="section">
          <div class="line">
            <span class="label">${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
            <span class="value">${order.id}</span>
          </div>
          ${order.orderCode ? `
          <div class="line">
            <span class="label">${t.orderCode}:</span>
            <span class="value">${order.orderCode}</span>
          </div>` : ''}
          <div class="line">
            <span class="label">${t.customer}:</span>
            <span class="value">${order.customerName || t.notAvailable}</span>
          </div>
          <div class="line">
            <span class="label">${t.phone}:</span>
            <span class="value">${order.customerPhoneNumber || t.notAvailable}</span>
          </div>
          <div class="line">
            <span class="label">${t.product}:</span>
            <span class="value">${order.productName || t.notAvailable}</span>
          </div>
          <div class="line">
            <span class="label">${t.deliveryDate}:</span>
            <span class="value">${formatReceiptDate(order.deliveryDate)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <h3>${t.specialInstructions}</h3>
          <div class="notes">${specialInstructions || (lang === 'ar' ? 'لا توجد تعليمات خاصة' : 'No special instructions')}</div>
        </div>

        <div class="footer">
          <p>${lang === 'ar' ? 'شكراً لثقتكم' : 'Thank You'}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(tailorReceiptHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
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
        
        {/* Dialog Content - Preview */}
        <div className="py-4 space-y-4">
          {/* Order Information Preview */}
          <div className="space-y-3 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">{lang === 'ar' ? 'معلومات الطلب' : 'Order Information'}</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{t.orderCode}:</span>
                <span>{order.orderCode || order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t.customer}:</span>
                <span>{order.customerName || t.notAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t.phone}:</span>
                <span>{order.customerPhoneNumber || t.notAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t.product}:</span>
                <span>{order.productName || t.notAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t.deliveryDate}:</span>
                <span>{order.deliveryDate}</span>
              </div>
              {order.branchName && (
                <div className="flex justify-between">
                  <span className="font-medium">{t.branch}:</span>
                  <span>{order.branchName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">{t.specialInstructions}</h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={lang === 'ar' ? 'ملاحظات المقاسات والتعليمات الخاصة للخياط...' : 'Measurement notes and special instructions for the tailor...'}
              className="min-h-[120px] resize-none"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="text-sm text-muted-foreground text-center">
            {lang === 'ar' ? 'اضغط "طباعة" لطباعة وصل الخياط بنفس تصميم الفاتورة' : 'Click "Print" to print the tailor receipt with the same design as the invoice'}
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
