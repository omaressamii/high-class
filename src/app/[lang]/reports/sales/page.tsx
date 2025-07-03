
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { getSalesData } from '@/lib/reports-data';



export default async function SalesDetailsPage({
  params: routeParams
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await routeParams;
  const effectiveLang = lang as 'ar' | 'en';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل المبيعات' : 'Sales Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل جميع المبيعات المسجلة. التصفية حسب الفترة ستتوفر مستقبلاً.' : 'Data shown includes all recorded sales. Period filtering will be available in a future update.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى التقارير' : 'Back to Reports',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    orderDate: effectiveLang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    totalPrice: effectiveLang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    effectivePrice: effectiveLang === 'ar' ? 'السعر بعد الخصم' : 'Price After Discount',
    noSalesFound: effectiveLang === 'ar' ? 'لا توجد مبيعات مسجلة حاليًا.' : 'No sales recorded currently.',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
    errorLoadingData: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    status: effectiveLang === 'ar' ? 'الحالة' : 'Status',
  };

  let salesOrders: any[] = [];
  let error = false;

  try {
    salesOrders = await getSalesData(effectiveLang);
  } catch (err) {
    console.error("Error in SalesDetailsPage:", err);
    error = true;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale });
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageTitle>{t.pageTitle}</PageTitle>
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}/reports`}>
              <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
              {t.backToDashboard}
            </Link>
          </Button>
        </div>
        <Card className="shadow-lg rounded-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.errorLoadingData}</h3>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/reports`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
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
                    <TableHead className="font-semibold">{t.orderId}</TableHead>
                    <TableHead className="font-semibold">{t.orderDate}</TableHead>
                    <TableHead className="font-semibold">{t.productName}</TableHead>
                    <TableHead className="font-semibold">{t.customerName}</TableHead>
                    <TableHead className="font-semibold">{t.sellerName}</TableHead>
                    <TableHead className="font-semibold">{t.status}</TableHead>
                    <TableHead className="text-right font-semibold">{t.effectivePrice}</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.sellerName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.status === 'Pending Preparation'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {t.currencySymbol} {((order.totalPrice || 0) - (order.discountAmount || 0)).toLocaleString()}
                        {order.discountAmount && order.discountAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {effectiveLang === 'ar' ? 'قبل الخصم:' : 'Before discount:'} {t.currencySymbol} {order.totalPrice?.toLocaleString() || 0}
                          </div>
                        )}
                      </TableCell>
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
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.noSalesFound}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
