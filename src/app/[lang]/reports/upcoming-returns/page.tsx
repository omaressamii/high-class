
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Undo2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { getUpcomingReturnsData } from '@/lib/reports-data';



export default async function UpcomingReturnsPage({
  params: routeParams
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await routeParams;
  const effectiveLang = lang as 'ar' | 'en';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل المرتجعات القادمة' : 'Upcoming Returns Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل الإيجارات النشطة المطلوب إرجاعها خلال الأسبوع القادم.' : 'Data shown includes active rentals due for return within the next week.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى التقارير' : 'Back to Reports',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    returnDate: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    noUpcomingReturns: effectiveLang === 'ar' ? 'لا توجد مرتجعات قادمة خلال الأسبوع القادم.' : 'No upcoming returns within the next week.',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
    totalPrice: effectiveLang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    errorLoadingData: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    daysUntilReturn: effectiveLang === 'ar' ? 'أيام حتى الإرجاع' : 'Days Until Return',
  };

  let upcomingReturns: any[] = [];
  let error = false;

  try {
    upcomingReturns = await getUpcomingReturnsData(effectiveLang);
  } catch (err) {
    console.error("Error in UpcomingReturnsPage:", err);
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

  const getDaysUntilReturn = (returnDate: string) => {
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    const diffTime = returnDateObj.getTime() - today.getTime();
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
            <Undo2 className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReturns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-enhanced">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold min-w-[120px]">{t.orderId}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t.productName}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t.customerName}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t.sellerName}</TableHead>
                    <TableHead className="font-semibold min-w-[130px]">{t.returnDate}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t.daysUntilReturn}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t.totalPrice}</TableHead>
                    <TableHead className="text-center font-semibold min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingReturns.map((order) => {
                    const daysUntil = getDaysUntilReturn(order.returnDate!);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.productName}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.sellerName}</TableCell>
                        <TableCell>{formatDate(order.returnDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            daysUntil <= 1
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : daysUntil <= 3
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {daysUntil <= 0
                              ? (effectiveLang === 'ar' ? 'متأخر' : 'Overdue')
                              : daysUntil === 1
                              ? (effectiveLang === 'ar' ? 'غداً' : 'Tomorrow')
                              : `${daysUntil} ${effectiveLang === 'ar' ? 'أيام' : 'days'}`
                            }
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{t.currencySymbol} {order.totalPrice?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-center">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${effectiveLang}/orders/${order.id}`}>
                              {t.viewOrder}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Undo2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.noUpcomingReturns}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
