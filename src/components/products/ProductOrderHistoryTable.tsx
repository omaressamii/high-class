
'use client';

import React from 'react';
import type { Order, TransactionType, OrderStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Eye, User, CalendarDays, DollarSign, CheckCircle, XCircle, AlertTriangle, Clock, TagIcon, LayersIcon, Send } from 'lucide-react'; 
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ProductOrderHistoryTableProps {
  orders: Order[];
  lang: 'ar' | 'en';
}

const ProductOrderHistoryTableComponent = ({ orders, lang }: ProductOrderHistoryTableProps) => {
  const locale = lang === 'ar' ? arSA : enUS;
  const isMobile = useMediaQuery('(max-width: 768px)'); 

  const formatDate = (dateString?: string) => {
    if (!dateString) return lang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      const dateObj = new Date(dateString.replace(/-/g, '/'));
      if (isNaN(dateObj.getTime())) {
         const isoDate = new Date(dateString);
         if(isNaN(isoDate.getTime())) return dateString;
         return format(isoDate, 'PPP', { locale });
      }
      return format(dateObj, 'PPP', { locale });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Ongoing': return 'default';
      case 'Delivered to Customer': return 'default';
      case 'Completed': return 'outline';
      case 'Overdue': return 'destructive';
      case 'Cancelled': return 'secondary';
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Ongoing': return <Clock className="h-3.5 w-3.5 text-primary inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Delivered to Customer': return <Send className="h-3.5 w-3.5 text-green-600 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Completed': return <CheckCircle className="h-3.5 w-3.5 text-green-600 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Overdue': return <AlertTriangle className="h-3.5 w-3.5 text-destructive inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Cancelled': return <XCircle className="h-3.5 w-3.5 text-muted-foreground inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      default: return null;
    }
  };

  const t = {
    orderCodeColumn: lang === 'ar' ? 'كود الطلب' : 'Order Code',
    customerNameColumn: lang === 'ar' ? 'اسم العميل' : 'Customer Name',
    orderDateColumn: lang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    typeColumn: lang === 'ar' ? 'نوع المعاملة' : 'Type',
    statusColumn: lang === 'ar' ? 'الحالة' : 'Status',
    totalPriceColumn: lang === 'ar' ? 'الإجمالي' : 'Total',
    viewOrder: lang === 'ar' ? 'عرض الطلب' : 'View Order', 
    
    rental: lang === 'ar' ? 'إيجار' : 'Rental',
    sale: lang === 'ar' ? 'بيع' : 'Sale',
    ongoing: lang === 'ar' ? 'جاري' : 'Ongoing',
    deliveredToCustomer: lang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    overdue: lang === 'ar' ? 'متأخر' : 'Overdue',
    cancelled: lang === 'ar' ? 'ملغى' : 'Cancelled',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    noOrders: lang === 'ar' ? 'لا توجد طلبات لعرضها لهذا المنتج.' : 'No orders to display for this product.',
  };

  const displayStatus = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case 'Ongoing': return t.ongoing;
      case 'Delivered to Customer': return t.deliveredToCustomer;
      case 'Completed': return t.completed;
      case 'Overdue': return t.overdue;
      case 'Cancelled': return t.cancelled;
      default: return orderStatus;
    }
  };
  
  const displayTransactionType = (type: TransactionType) => {
    return type === 'Rental' ? t.rental : t.sale;
  }

  if (!orders || orders.length === 0) {
    return <p className="text-center text-muted-foreground py-4">{t.noOrders}</p>;
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-md rounded-lg">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold">
                  {t.orderCodeColumn}: {order.orderCode || order.id}
                </CardTitle>
                <Badge variant={order.transactionType === 'Rental' ? "secondary" : "outline"} className="text-xs">
                  {displayTransactionType(order.transactionType)}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                <User className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-muted-foreground" />
                {order.customerName || order.customerId}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1 text-sm">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                <span className="font-medium">{t.orderDateColumn}:</span>&nbsp;{formatDate(order.orderDate)}
              </div>
              <div className="flex items-center">
                <LayersIcon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                <span className="font-medium">{t.statusColumn}:</span>&nbsp;
                <Badge variant={getStatusVariant(order.status)} className="text-xs">
                  {getStatusIcon(order.status)}
                  {displayStatus(order.status)}
                </Badge>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                <span className="font-medium">{t.totalPriceColumn}:</span>&nbsp;{t.currencySymbol} {order.totalPrice.toFixed(2)}
              </div>
            </CardContent>
            <CardFooter className="px-4 pb-4 pt-2 border-t">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/${lang}/orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t.viewOrder}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.orderCodeColumn}</TableHead>
            <TableHead>{t.customerNameColumn}</TableHead>
            <TableHead>{t.orderDateColumn}</TableHead>
            <TableHead>{t.typeColumn}</TableHead>
            <TableHead>{t.statusColumn}</TableHead>
            <TableHead className="text-right">{t.totalPriceColumn}</TableHead>
            <TableHead className="text-center">{lang === 'ar' ? 'عرض' : 'View'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                  {order.orderCode || order.id}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {order.customerName || order.customerId}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(order.orderDate)}
                </div>
              </TableCell>
              <TableCell>
                 <Badge variant={order.transactionType === 'Rental' ? "secondary" : "outline"} className="text-xs">
                    {displayTransactionType(order.transactionType)}
                 </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(order.status)} className="whitespace-nowrap text-xs flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {displayStatus(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {t.currencySymbol} {order.totalPrice.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${lang}/orders/${order.id}`}>
                    <Eye className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                    {lang === 'ar' ? 'عرض' : 'View'} 
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

ProductOrderHistoryTableComponent.displayName = 'ProductOrderHistoryTable';
export const ProductOrderHistoryTable = React.memo(ProductOrderHistoryTableComponent);
