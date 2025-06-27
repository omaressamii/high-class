
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockOrders, mockProducts, mockCustomers, mockUsers } from '@/lib/mock-data';
import type { Order } from '@/types';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

export default function ActiveRentalsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as 'ar' | 'en';
  const effectiveLang = lang === 'en' ? 'en' : 'ar';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل الإيجارات النشطة' : 'Active Rentals Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل جميع الإيجارات النشطة حاليًا. التصفية حسب الفترة ستتوفر مستقبلاً.' : 'Data shown includes all currently active rentals. Period filtering will be available in a future update.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Dashboard',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    deliveryDate: effectiveLang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDate: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    noActiveRentals: effectiveLang === 'ar' ? 'لا توجد إيجارات نشطة حاليًا.' : 'No active rentals currently.',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
  };

  const activeRentals = useMemo(() => {
    return mockOrders
      .filter(order => order.transactionType === 'Rental' && order.status === 'Ongoing')
      .map(order => {
        const product = mockProducts.find(p => p.id === order.productId);
        const customer = mockCustomers.find(c => c.id === order.customerId);
        const seller = mockUsers.find(u => u.id === order.sellerId);
        return {
          ...order,
          productName: product?.name || order.productId,
          customerName: customer?.fullName || order.customerId,
          sellerName: seller?.fullName || (effectiveLang === 'ar' ? 'بائع غير معروف' : 'Unknown Seller'),
        };
      })
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  }, [effectiveLang]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return effectiveLang === 'ar' ? 'غير محدد' : 'N/A';
    try {
      return format(new Date(dateString), 'PPP', { locale });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToDashboard}
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t.allTimeDataNote}</p>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRentals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderId}</TableHead>
                    <TableHead>{t.productName}</TableHead>
                    <TableHead>{t.customerName}</TableHead>
                    <TableHead>{t.sellerName}</TableHead>
                    <TableHead>{t.deliveryDate}</TableHead>
                    <TableHead>{t.returnDate}</TableHead>
                    <TableHead className="text-center">{t.viewOrder}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRentals.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.sellerName}</TableCell>
                      <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                      <TableCell>{formatDate(order.returnDate)}</TableCell>
                       <TableCell className="text-center">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/${effectiveLang}/orders/${order.id}`}>
                            {t.viewOrder}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t.noActiveRentals}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
