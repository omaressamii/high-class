
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
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

export default function SalesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as 'ar' | 'en';
  const effectiveLang = lang === 'en' ? 'en' : 'ar';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل المبيعات' : 'Sales Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل جميع المبيعات المسجلة. التصفية حسب الفترة ستتوفر مستقبلاً.' : 'Data shown includes all recorded sales. Period filtering will be available in a future update.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Dashboard',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    orderDate: effectiveLang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    totalPrice: effectiveLang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    noSalesFound: effectiveLang === 'ar' ? 'لا توجد مبيعات مسجلة حاليًا.' : 'No sales recorded currently.',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
  };

  const salesOrders = useMemo(() => {
    return mockOrders
      .filter(order => order.transactionType === 'Sale')
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
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [effectiveLang]);

  const formatDate = (dateString: string) => {
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
            <ShoppingCart className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderId}</TableHead>
                    <TableHead>{t.orderDate}</TableHead>
                    <TableHead>{t.productName}</TableHead>
                    <TableHead>{t.customerName}</TableHead>
                    <TableHead>{t.sellerName}</TableHead>
                    <TableHead className="text-right">{t.totalPrice}</TableHead>
                    <TableHead className="text-center">{t.viewOrder}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.sellerName}</TableCell>
                      <TableCell className="text-right">{t.currencySymbol} {order.totalPrice.toFixed(2)}</TableCell>
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
            <p className="text-muted-foreground text-center py-4">{t.noSalesFound}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
