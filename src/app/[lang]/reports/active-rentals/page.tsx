
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ListChecks, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { getActiveRentalsData } from '@/lib/reports-data';



export default async function ActiveRentalsPage({
  params: routeParams
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await routeParams;
  const effectiveLang = lang as 'ar' | 'en';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل الإيجارات النشطة' : 'Active Rentals Details',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل جميع الإيجارات النشطة حاليًا. التصفية حسب الفترة ستتوفر مستقبلاً.' : 'Data shown includes all currently active rentals. Period filtering will be available in a future update.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى التقارير' : 'Back to Reports',
    orderId: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    deliveryDate: effectiveLang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDate: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    noActiveRentals: effectiveLang === 'ar' ? 'لا توجد إيجارات نشطة حاليًا.' : 'No active rentals currently.',
    viewOrder: effectiveLang === 'ar' ? 'عرض الطلب' : 'View Order',
    totalPrice: effectiveLang === 'ar' ? 'السعر الإجمالي' : 'Total Price',
    effectivePrice: effectiveLang === 'ar' ? 'السعر بعد الخصم' : 'Price After Discount',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    errorLoadingData: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
  };

  let activeRentals: any[] = [];
  let error = false;

  try {
    activeRentals = await getActiveRentalsData(effectiveLang);
  } catch (err) {
    console.error("Error in ActiveRentalsPage:", err);
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
            <ListChecks className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRentals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-enhanced">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold min-w-[120px]">{t.orderId}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t.productName}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t.customerName}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t.sellerName}</TableHead>
                    <TableHead className="font-semibold min-w-[130px]">{t.deliveryDate}</TableHead>
                    <TableHead className="font-semibold min-w-[130px]">{t.returnDate}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t.effectivePrice}</TableHead>
                    <TableHead className="text-center font-semibold min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRentals.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.sellerName}</TableCell>
                      <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                      <TableCell>{formatDate(order.returnDate)}</TableCell>
                      <TableCell className="font-semibold">
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
              <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.noActiveRentals}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
