
'use client';

import React, { useState } from 'react';
import type { Order } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, PackageSearch, User, ShoppingBag, Store, CalendarDays, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { TailorReceiptDialog } from './TailorReceiptDialog';

type OrderWithDetails = Order & {
  productName?: string;
  customerName?: string;
  branchName?: string;
};

interface PrepareOrdersTableProps {
  orders: OrderWithDetails[];
  onMarkAsPrepared: (orderId: string) => void;
  onViewDetails: (order: OrderWithDetails) => void;
  lang: 'ar' | 'en';
  hasEditPermission: boolean; 
}

const PrepareOrdersTableComponent = ({ orders, onMarkAsPrepared, onViewDetails, lang, hasEditPermission: hasPreparePermission }: PrepareOrdersTableProps) => {
  const locale = lang === 'ar' ? arSA : enUS;
  const [isTailorReceiptOpen, setIsTailorReceiptOpen] = useState(false);
  const [selectedOrderForTailor, setSelectedOrderForTailor] = useState<OrderWithDetails | null>(null);

  const handleOpenTailorReceipt = (order: OrderWithDetails) => {
    setSelectedOrderForTailor(order);
    setIsTailorReceiptOpen(true);
  };
  
  const t = {
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    product: lang === 'ar' ? 'المنتج' : 'Product',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    markAsPrepared: lang === 'ar' ? 'تأكيد التجهيز' : 'Mark as Prepared',
    prepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared',
    ongoing: lang === 'ar' ? 'قيد التجهيز' : 'Ongoing',
    notApplicable: lang === 'ar' ? 'غير متوفر' : 'N/A',
    tailorReceipt: lang === 'ar' ? 'وصل الخياط' : 'Tailor Receipt',
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
                <Badge variant={order.status === 'Prepared' ? 'outline' : 'default'}>
                  {order.status === 'Prepared' ? t.prepared : t.ongoing}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(order)}>
                  <Eye className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                  {t.viewDetails}
                </Button>
              </TableCell>
              <TableCell className="text-center">
                {order.status === 'Ongoing' && hasPreparePermission && (
                  <Button variant="default" size="sm" onClick={() => onMarkAsPrepared(order.id)}>
                    <CheckCircle className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                    {t.markAsPrepared}
                  </Button>
                )}
                {order.status === 'Prepared' && (
                   <span className="text-xs text-green-600 flex items-center justify-center">
                     <CheckCircle className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                     {t.prepared}
                   </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="outline" size="sm" onClick={() => handleOpenTailorReceipt(order)}>
                  <Scissors className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
                  {t.tailorReceipt}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedOrderForTailor && (
        <TailorReceiptDialog
          isOpen={isTailorReceiptOpen}
          setIsOpen={setIsTailorReceiptOpen}
          order={selectedOrderForTailor}
          lang={lang}
        />
      )}
    </div>
  );
};

PrepareOrdersTableComponent.displayName = 'PrepareOrdersTable';
export const PrepareOrdersTable = React.memo(PrepareOrdersTableComponent);
