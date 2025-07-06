
'use client';

import React from 'react';
import type { Order } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Send, CheckCircle, User, ShoppingBag, Store, CalendarDays, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';

type OrderWithDetails = Order & {
  productName?: string;
  customerName?: string;
  branchName?: string;
};

interface DeliverOrdersTableProps {
  orders: OrderWithDetails[];
  onMarkAsDelivered: (orderId: string) => void;
  onViewDetails: (order: OrderWithDetails) => void;
  lang: 'ar' | 'en';
  hasEditPermission: boolean;
}

const DeliverOrdersTableComponent = ({ orders, onMarkAsDelivered, onViewDetails, lang, hasEditPermission }: DeliverOrdersTableProps) => {
  const locale = lang === 'ar' ? arSA : enUS;
  
  const t = {
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    product: lang === 'ar' ? 'المنتج' : 'Product',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    markAsDelivered: lang === 'ar' ? 'تسليم للعميل' : 'Deliver to Customer',
    prepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared',
    notApplicable: lang === 'ar' ? 'غير متوفر' : 'N/A',
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return t.notApplicable;
    try {
      const dateObj = new Date(dateString.replace(/-/g, '/'));
      if (isNaN(dateObj.getTime())) return dateString;
      return format(dateObj, 'PPP', { locale });
    } catch { return dateString; }
  };
  
  return (
    <div className="rounded-lg border overflow-hidden shadow-lg bg-card">
      <Table className="table-enhanced">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">{t.orderCode}</TableHead>
            <TableHead className="min-w-[150px]">{t.customer}</TableHead>
            <TableHead className="min-w-[150px]">{t.product}</TableHead>
            <TableHead className="min-w-[120px]">{t.branch}</TableHead>
            <TableHead className="min-w-[130px]">{t.deliveryDate}</TableHead>
            <TableHead className="min-w-[120px]">{lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount'}</TableHead>
            <TableHead className="min-w-[100px]">{t.status}</TableHead>
            <TableHead className="text-center min-w-[200px]" colSpan={3}>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/${lang}/orders/${order.id}`} className="text-primary hover:underline">
                  {order.orderCode || order.id}
                </Link>
              </TableCell>
              <TableCell>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {order.customerName || t.notApplicable}
                 </div>
                </TableCell>
              <TableCell>
                 <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    {order.productName || t.notApplicable}
                 </div>
                </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    {order.branchName || t.notApplicable}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {formatDateDisplay(order.deliveryDate)}
                </div>
                </TableCell>
              <TableCell>
                {order.remainingAmount && order.remainingAmount > 0 ? (
                  <div className="text-red-600 font-semibold">
                    {order.remainingAmount.toFixed(2)} {lang === 'ar' ? 'ريال' : 'SAR'}
                  </div>
                ) : (
                  <div className="text-green-600 font-semibold">
                    {lang === 'ar' ? 'مسدد بالكامل' : 'Fully Paid'}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t.prepared}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(order)}>
                  <Eye className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                  {t.viewDetails}
                </Button>
              </TableCell>
              <TableCell className="text-center">
                {hasEditPermission && order.remainingAmount && order.remainingAmount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Link href={`/${lang}/orders/${order.id}`}>
                      <CreditCard className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                      {lang === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
                    </Link>
                  </Button>
                )}
              </TableCell>
              <TableCell className="text-center">
                {hasEditPermission && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onMarkAsDelivered(order.id)}
                    disabled={order.remainingAmount && order.remainingAmount > 0}
                    className={`${order.remainingAmount && order.remainingAmount > 0
                      ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'} text-white`}
                    title={order.remainingAmount && order.remainingAmount > 0
                      ? (lang === 'ar' ? 'يجب سداد المبلغ المتبقي قبل التسليم' : 'Remaining amount must be paid before delivery')
                      : undefined}
                  >
                    <Send className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                    {t.markAsDelivered}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

DeliverOrdersTableComponent.displayName = 'DeliverOrdersTable';
export const DeliverOrdersTable = React.memo(DeliverOrdersTableComponent);
