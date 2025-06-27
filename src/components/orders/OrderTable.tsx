
'use client';

import React from 'react'; // Import React
import type { Order, OrderStatus } from '@/types'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Eye, ShoppingBag, User, CalendarDays, DollarSign, Briefcase, Store, PlayCircle, CheckCircle2, Clock, AlertTriangle, XCircle, Fingerprint, Send } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  lang: 'ar' | 'en';
}

const OrderTableComponent = ({ orders, lang }: OrderTableProps) => {
  const locale = lang === 'ar' ? arSA : enUS;

  const formatDate = (dateString?: string) => {
    if (!dateString) return lang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy', { locale });
    } catch (error) {
      return lang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date';
    }
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Ongoing': return 'default';
      case 'Pending Preparation': return 'secondary'; 
      case 'Prepared': return 'outline'; 
      case 'Delivered to Customer': return 'default'; 
      case 'Completed': return 'outline';
      case 'Overdue': return 'destructive';
      case 'Cancelled': return 'secondary';
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Ongoing': return <Clock className="h-3.5 w-3.5 text-current" />;
      case 'Pending Preparation': return <PlayCircle className="h-3.5 w-3.5 text-current" />;
      case 'Prepared': return <CheckCircle2 className="h-3.5 w-3.5 text-current" />;
      case 'Delivered to Customer': return <Send className="h-3.5 w-3.5 text-green-600" />;
      case 'Completed': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'Overdue': return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
      case 'Cancelled': return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return null;
    }
  };


  const t = {
    orderId: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code',
    items: lang === 'ar' ? 'الأصناف' : 'Items',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    seller: lang === 'ar' ? 'البائع' : 'Seller',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    orderDate: lang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDate: lang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    total: lang === 'ar' ? 'الإجمالي' : 'Total',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض التفاصيل' : 'View',
    rental: lang === 'ar' ? 'إيجار' : 'Rental',
    sale: lang === 'ar' ? 'بيع' : 'Sale',
    ongoing: lang === 'ar' ? 'جاري' : 'Ongoing',
    pendingPreparation: lang === 'ar' ? 'قيد التجهيز' : 'Pending Preparation',
    prepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared',
    deliveredToCustomer: lang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    overdue: lang === 'ar' ? 'متأخر' : 'Overdue',
    cancelled: lang === 'ar' ? 'ملغى' : 'Cancelled',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    noOrders: lang === 'ar' ? 'لا توجد طلبات لعرضها.' : 'No orders to display.',
    notApplicable: lang === 'ar' ? 'غير محدد' : 'N/A',
    multipleItemsShort: lang === 'ar' ? 'أصناف متعددة' : 'Multiple Items',
  };

  const displayStatus = (orderStatus: Order['status']) => {
    switch (orderStatus) {
      case 'Ongoing': return t.ongoing;
      case 'Pending Preparation': return t.pendingPreparation;
      case 'Prepared': return t.prepared;
      case 'Delivered to Customer': return t.deliveredToCustomer;
      case 'Completed': return t.completed;
      case 'Overdue': return t.overdue;
      case 'Cancelled': return t.cancelled;
      default: return orderStatus;
    }
  };
  
  const displayTransactionType = (type: Order['transactionType']) => {
    return type === 'Rental' ? t.rental : t.sale;
  }

  if (orders.length === 0) {
    return <p className="text-center text-muted-foreground py-4">{t.noOrders}</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden shadow-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.orderCode}</TableHead><TableHead>{t.items}</TableHead><TableHead>{t.customer}</TableHead><TableHead>{t.seller}</TableHead><TableHead>{t.branch}</TableHead><TableHead>{t.orderDate}</TableHead><TableHead>{t.deliveryDate}</TableHead><TableHead>{t.returnDate}</TableHead><TableHead className="text-right">{t.total}</TableHead><TableHead>{t.status}</TableHead><TableHead className="text-center">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/${lang}/orders/${order.id}`} className="text-primary hover:underline">
                  {order.orderCode || order.id}
                </Link>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  {order.items.length > 0 ? (order.items.length > 1 ? t.multipleItemsShort : order.items[0].productName) : t.notApplicable}
                </div>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {order.customerName || order.customerId}
                </div>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {order.sellerName || (lang === 'ar' ? 'غير محدد' : 'N/A')}
                </div>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  {order.branchName || t.notApplicable}
                </div>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(order.orderDate)}
                </div>
              </TableCell><TableCell>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(order.deliveryDate)}
                </div>
              </TableCell><TableCell>
                {order.transactionType === 'Rental' && order.returnDate ? (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {formatDate(order.returnDate)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{lang === 'ar' ? 'لا ينطبق' : 'N/A'}</span>
                )}
              </TableCell><TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {t.currencySymbol} {order.totalPrice.toFixed(2)}
                </div>
              </TableCell><TableCell>
                <Badge variant={getStatusVariant(order.status)} className="whitespace-nowrap flex items-center gap-1 text-xs">
                  {getStatusIcon(order.status)}
                  {displayStatus(order.status)}
                </Badge>
              </TableCell><TableCell className="text-center">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${lang}/orders/${order.id}`}>
                    <Eye className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                    {t.view}
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

OrderTableComponent.displayName = 'OrderTable';
export const OrderTable = React.memo(OrderTableComponent);
