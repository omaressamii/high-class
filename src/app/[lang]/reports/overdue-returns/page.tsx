import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { getOverdueReturnsData } from '@/lib/reports-data';

export default async function OverdueReturnsPage({
  params: routeParams
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await routeParams;
  const effectiveLang = lang as 'ar' | 'en';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل المرتجعات المتأخرة' : 'Overdue Returns Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل الإيجارات النشطة المتأخرة عن موعد الإرجاع.' : 'Data shown includes active rentals that are past their return date.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى التقارير' : 'Back to Reports',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    returnDate: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    noOverdueReturns: effectiveLang === 'ar' ? 'لا توجد مرتجعات متأخرة حالياً.' : 'No overdue returns currently.',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
    totalPrice: effectiveLang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    effectivePrice: effectiveLang === 'ar' ? 'السعر بعد الخصم' : 'Price After Discount',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    errorLoadingData: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    daysOverdue: effectiveLang === 'ar' ? 'أيام التأخير' : 'Days Overdue',
    contactCustomer: effectiveLang === 'ar' ? 'اتصال بالعميل' : 'Contact Customer',
  };

  let overdueReturns: any[] = [];
  let error = false;

  try {
    overdueReturns = await getOverdueReturnsData(effectiveLang);
  } catch (err) {
    console.error("Error in OverdueReturnsPage:", err);
    error = true;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return effectiveLang === 'ar' ? 'غير محدد' : 'N/A';
    try {
      return format(new Date(dateString), 'PPP', { locale });
    } catch {
      return dateString;
    }
  };

  const getDaysOverdue = (returnDate: string) => {
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    const diffTime = today.getTime() - returnDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive rtl:ml-2 rtl:mr-0" />
            {t.pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueReturns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t.orderId}</TableHead>
                    <TableHead className="font-semibold">{t.productName}</TableHead>
                    <TableHead className="font-semibold">{t.customerName}</TableHead>
                    <TableHead className="font-semibold">{t.sellerName}</TableHead>
                    <TableHead className="font-semibold">{t.returnDate}</TableHead>
                    <TableHead className="font-semibold">{t.daysOverdue}</TableHead>
                    <TableHead className="font-semibold">{t.effectivePrice}</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueReturns.map((order) => {
                    const daysOverdue = getDaysOverdue(order.returnDate!);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.productName}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.sellerName}</TableCell>
                        <TableCell>{formatDate(order.returnDate)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {daysOverdue} {effectiveLang === 'ar' ? 'يوم' : 'days'}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {t.currencySymbol} {((order.totalPrice || 0) - (order.discountAmount || 0)).toLocaleString()}
                          {order.discountAmount && order.discountAmount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {effectiveLang === 'ar' ? 'قبل الخصم:' : 'Before discount:'} {t.currencySymbol} {order.totalPrice?.toLocaleString() || 0}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/${effectiveLang}/orders/${order.id}`}>
                                {t.viewOrder}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.noOverdueReturns}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
