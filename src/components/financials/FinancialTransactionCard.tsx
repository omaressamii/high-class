
'use client';

import React from 'react';
import type { FinancialTransaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CalendarDays, Tag, FileText, User, Briefcase, DollarSign, CreditCard, StickyNote } from 'lucide-react';

interface FinancialTransactionCardProps {
  transaction: FinancialTransaction;
  lang: 'ar' | 'en';
  serialNumber: number;
}

// Wrap component with React.memo
const FinancialTransactionCard = React.memo(function FinancialTransactionCard({ transaction, lang, serialNumber }: FinancialTransactionCardProps) {
  const locale = lang === 'ar' ? arSA : enUS;

  const t = {
    serial: lang === 'ar' ? 'م:' : 'SN:',
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    type: lang === 'ar' ? 'النوع' : 'Type',
    category: lang === 'ar' ? 'الفئة' : 'Category',
    description: lang === 'ar' ? 'الوصف' : 'Description',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    processedBy: lang === 'ar' ? 'بواسطة' : 'Processed By',
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code', // Changed from orderId
    amount: lang === 'ar' ? 'المبلغ' : 'Amount',
    paymentMethod: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    typeSale: lang === 'ar' ? 'قيمة بيع أولية' : 'Initial Sale Value',
    typeRental: lang === 'ar' ? 'قيمة إيجار أولية' : 'Initial Rental Value',
    typePaymentReceived: lang === 'ar' ? 'دفعة مستلمة' : 'Payment Received',
    notApplicable: lang === 'ar' ? 'لا ينطبق' : 'N/A',
  };

  const formatDate = (dateInput?: string) => {
    if (!dateInput) return t.notApplicable;
    try {
      const date = parseISO(dateInput);
      if (isNaN(date.getTime())) {
        const parts = dateInput.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; 
          const day = parseInt(parts[2]);
          const simpleDate = new Date(year, month, day);
          if (!isNaN(simpleDate.getTime())) {
            return format(simpleDate, 'PPP', { locale }); 
          }
        }
        return dateInput; 
      }
      return format(date, 'PPP HH:mm', { locale }); 
    } catch (error) {
      return dateInput; 
    }
  };

  const displayTransactionType = (type: FinancialTransaction['type']) => {
    switch (type) {
      case 'Initial Sale Value': return t.typeSale;
      case 'Initial Rental Value': return t.typeRental;
      case 'Payment Received': return t.typePaymentReceived;
      default: return type;
    }
  };

  const getTypeVariant = (type: FinancialTransaction['type']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (type) {
      case 'Initial Sale Value': return 'default';
      case 'Initial Rental Value': return 'secondary';
      case 'Payment Received': return 'outline';
      default: return 'secondary';
    }
  };

  const getAmountColorClass = (type: FinancialTransaction['type']) => {
    if (type === 'Payment Received') return 'text-green-600 dark:text-green-400';
    if (type === 'Initial Sale Value' || type === 'Initial Rental Value') return 'text-primary dark:text-blue-400';
    return '';
  };

  return (
    <Card className="shadow-md rounded-lg mb-4">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold flex items-center">
             <span className="text-xs text-muted-foreground mr-2 rtl:ml-2 rtl:mr-0">{t.serial} {serialNumber}</span>
            <Badge variant={getTypeVariant(transaction.type)} className="whitespace-nowrap text-xs px-2 py-0.5">
              {displayTransactionType(transaction.type)}
            </Badge>
          </CardTitle>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {transaction.createdAt ? formatDate(transaction.createdAt) : transaction.date ? formatDate(transaction.date) : t.notApplicable}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2 text-sm">
        {transaction.description && (
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-muted-foreground shrink-0" />
            <p><span className="font-medium">{t.description}:</span> {transaction.description}</p>
          </div>
        )}
         {transaction.transactionCategory && (
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <p><span className="font-medium">{t.category}:</span> {transaction.transactionCategory}</p>
          </div>
        )}
        {transaction.customerName && (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <p><span className="font-medium">{t.customer}:</span> {transaction.customerName}</p>
          </div>
        )}
        {transaction.processedByUserName && (
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <p><span className="font-medium">{t.processedBy}:</span> {transaction.processedByUserName}</p>
          </div>
        )}
        {transaction.orderId && (
          <div className="flex items-center">
            <StickyNote className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <p>
              <span className="font-medium">{t.orderCode}:</span>{' '}
              <Link href={`/${lang}/orders/${transaction.orderId}`} className="text-primary hover:underline">
                {transaction.orderCode || (transaction.orderId ? transaction.orderId.substring(0,12) + '...' : t.notApplicable)}
              </Link>
            </p>
          </div>
        )}
        <div className={cn("flex items-center font-semibold", getAmountColorClass(transaction.type))}>
          <DollarSign className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          <p>{t.amount}: {t.currencySymbol} {transaction.amount.toFixed(2)}</p>
        </div>
        {transaction.type === 'Payment Received' && transaction.paymentMethod && (
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <p><span className="font-medium">{t.paymentMethod}:</span> {transaction.paymentMethod}</p>
          </div>
        )}
        {transaction.notes && (
           <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs"><span className="font-medium">{t.notes}:</span> {transaction.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { FinancialTransactionCard };
