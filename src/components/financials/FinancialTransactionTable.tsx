
'use client';

import React from 'react';
import type { FinancialTransaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FinancialTransactionTableProps {
  transactions: FinancialTransaction[];
  lang: 'ar' | 'en';
}

const FinancialTransactionTableComponent = ({ transactions, lang }: FinancialTransactionTableProps) => {
  const locale = lang === 'ar' ? arSA : enUS;

  const t = {
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    type: lang === 'ar' ? 'النوع' : 'Type',
    transactionCategory: lang === 'ar' ? 'فئة المعاملة' : 'Category',
    description: lang === 'ar' ? 'الوصف' : 'Description',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    processedBy: lang === 'ar' ? 'بواسطة' : 'Processed By',
    orderId: lang === 'ar' ? 'رقم الطلب' : 'Order ID', // Reverted
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code', // Kept for reference if needed
    amount: lang === 'ar' ? 'المبلغ' : 'Amount',
    paymentMethod: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    typeSale: lang === 'ar' ? 'قيمة بيع أولية' : 'Initial Sale Value',
    typeRental: lang === 'ar' ? 'قيمة إيجار أولية' : 'Initial Rental Value',
    typePaymentReceived: lang === 'ar' ? 'دفعة مستلمة' : 'Payment Received',
    notApplicable: lang === 'ar' ? 'لا ينطبق' : 'N/A',
    viewOrder: lang === 'ar' ? 'عرض الطلب' : 'View Order',
    noTransactions: lang === 'ar' ? 'لا توجد معاملات مالية لعرضها تطابق الفلتر الحالي.' : 'No financial transactions to display matching the current filter.',
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; 
      }
      return format(date, 'PPP HH:mm', { locale });
    } catch (error) {
      return dateString; 
    }
  };
  
  const displayTransactionType = (type: FinancialTransaction['type']) => {
    switch (type) {
      case 'Initial Sale Value': return t.typeSale;
      case 'Initial Rental Value': return t.typeRental;
      case 'Payment Received': return t.typePaymentReceived;
      case 'Discount Applied': return lang === 'ar' ? 'خصم مطبق' : 'Discount Applied';
      default: return type;
    }
  };
  
  const getTypeVariant = (type: FinancialTransaction['type']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (type) {
      case 'Initial Sale Value': return 'default';
      case 'Initial Rental Value': return 'secondary';
      case 'Payment Received': return 'outline';
      case 'Discount Applied': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRowClass = (type: FinancialTransaction['type']) => {
    switch (type) {
      case 'Initial Sale Value':
        return 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20';
      case 'Initial Rental Value':
        return 'bg-accent/5 hover:bg-accent/10 dark:bg-accent/10 dark:hover:bg-accent/20';
      case 'Payment Received':
        return 'bg-green-500/5 hover:bg-green-500/10 dark:bg-green-500/10 dark:hover:bg-green-500/20';
      case 'Discount Applied':
        return 'bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10 dark:hover:bg-red-500/20';
      default:
        return 'hover:bg-muted/50';
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden shadow-lg bg-card">
      <Table className="table-enhanced">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">{t.date}</TableHead>
            <TableHead className="min-w-[120px]">{t.type}</TableHead>
            <TableHead className="min-w-[130px]">{t.transactionCategory}</TableHead>
            <TableHead className="min-w-[150px]">{t.description}</TableHead>
            <TableHead className="min-w-[120px]">{t.customer}</TableHead>
            <TableHead className="min-w-[120px]">{t.processedBy}</TableHead>
            <TableHead className="min-w-[100px]">{t.orderId}</TableHead>
            <TableHead className="text-right min-w-[120px]">{t.amount}</TableHead>
            <TableHead className="min-w-[120px]">{t.paymentMethod}</TableHead>
            <TableHead className="min-w-[150px]">{t.notes}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                {t.noTransactions}
              </TableCell>
            </TableRow>
          )}
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.id} 
              className={cn("transition-colors", getRowClass(transaction.type))}
            >
              <TableCell className="whitespace-nowrap">{transaction.createdAt ? formatDate(transaction.createdAt) : formatDate(transaction.date)}</TableCell><TableCell>
                <Badge variant={getTypeVariant(transaction.type)} className="whitespace-nowrap text-xs px-2 py-0.5">
                  {displayTransactionType(transaction.type)}
                </Badge>
              </TableCell><TableCell>{transaction.transactionCategory || t.notApplicable}</TableCell><TableCell>{transaction.description}</TableCell><TableCell>{transaction.customerName || t.notApplicable}</TableCell><TableCell>{transaction.processedByUserName || t.notApplicable}</TableCell><TableCell>
                {transaction.orderId ? (
                  <a href={`/${lang}/orders/${transaction.orderId}`} className="text-primary hover:underline">
                    {transaction.orderId ? transaction.orderId.substring(0, 12) + (transaction.orderId.length > 12 ? '...' : '') : t.notApplicable}
                  </a>
                ) : (
                  t.notApplicable
                )}
              </TableCell><TableCell className={`text-right font-medium ${transaction.type === 'Payment Received' ? 'text-green-600 dark:text-green-400' : (transaction.type === 'Initial Sale Value' || transaction.type === 'Initial Rental Value') ? 'text-primary dark:text-blue-400' : transaction.type === 'Discount Applied' ? 'text-red-600 dark:text-red-400' : ''}`}>
                {transaction.type === 'Discount Applied' ? '-' : ''}{t.currencySymbol} {transaction.amount.toFixed(2)}
              </TableCell><TableCell>
                {transaction.type === 'Payment Received' && transaction.paymentMethod 
                  ? transaction.paymentMethod 
                  : t.notApplicable}
              </TableCell><TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={transaction.notes || undefined}>{transaction.notes || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

FinancialTransactionTableComponent.displayName = 'FinancialTransactionTable';
export const FinancialTransactionTable = React.memo(FinancialTransactionTableComponent);
