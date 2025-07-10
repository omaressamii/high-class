'use client';

import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Fingerprint, 
  Store, 
  Info, 
  History,
  Eye,
  CalendarDays,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import type { Customer, Order, TransactionType, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface CustomerDetailsData {
  customer: Customer;
  orders: Order[];
}

interface CustomerDetailClientPageProps {
  initialCustomerDetails: CustomerDetailsData;
  lang: string;
  customerId: string;
}

const CustomerDetailClientPage = ({ initialCustomerDetails, lang, customerId }: CustomerDetailClientPageProps) => {
  const { customer, orders } = initialCustomerDetails;
  const isMobile = useMediaQuery('(max-width: 768px)');

  const t = {
    pageTitle: lang === 'ar' ? 'تفاصيل العميل' : 'Customer Details',
    backToCustomers: lang === 'ar' ? 'العودة للعملاء' : 'Back to Customers',
    customerInfo: lang === 'ar' ? 'معلومات العميل' : 'Customer Information',
    orderHistory: lang === 'ar' ? 'سجل الطلبات' : 'Order History',
    noOrders: lang === 'ar' ? 'لا توجد طلبات لهذا العميل.' : 'No orders found for this customer.',
    customerIdLabel: lang === 'ar' ? 'معرف العميل' : 'Customer ID',
    phoneLabel: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    addressLabel: lang === 'ar' ? 'العنوان' : 'Address',
    idCardLabel: lang === 'ar' ? 'رقم الهوية/جواز السفر' : 'ID/Passport Number',
    branchLabel: lang === 'ar' ? 'الفرع' : 'Branch',
    notesLabel: lang === 'ar' ? 'ملاحظات' : 'Notes',
    orderCodeColumn: lang === 'ar' ? 'رقم الطلب' : 'Order Code',
    orderDateColumn: lang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    typeColumn: lang === 'ar' ? 'النوع' : 'Type',
    statusColumn: lang === 'ar' ? 'الحالة' : 'Status',
    totalPriceColumn: lang === 'ar' ? 'المبلغ الإجمالي' : 'Total Price',
    viewOrderButton: lang === 'ar' ? 'عرض' : 'View',
    currencySymbol: lang === 'ar' ? 'ر.س' : 'SAR',
    totalOrders: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    totalSpent: lang === 'ar' ? 'إجمالي المبلغ المنفق' : 'Total Spent',
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: lang === 'ar' ? arSA : enUS });
    } catch {
      return dateString;
    }
  };

  const displayTransactionType = (type: TransactionType) => {
    return type === 'Rental' 
      ? (lang === 'ar' ? 'إيجار' : 'Rental')
      : (lang === 'ar' ? 'بيع' : 'Sale');
  };

  const displayStatus = (status: OrderStatus) => {
    const statusMap = {
      'Pending': lang === 'ar' ? 'قيد الانتظار' : 'Pending',
      'Processing': lang === 'ar' ? 'قيد المعالجة' : 'Processing',
      'Ready': lang === 'ar' ? 'جاهز' : 'Ready',
      'Delivered': lang === 'ar' ? 'تم التسليم' : 'Delivered',
      'Returned': lang === 'ar' ? 'تم الإرجاع' : 'Returned',
      'Cancelled': lang === 'ar' ? 'ملغي' : 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Ready': return 'secondary';
      case 'Processing': return 'outline';
      case 'Pending': return 'outline';
      case 'Returned': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered': return <CheckCircle className="h-3 w-3" />;
      case 'Ready': return <CheckCircle className="h-3 w-3" />;
      case 'Processing': return <Clock className="h-3 w-3" />;
      case 'Pending': return <AlertTriangle className="h-3 w-3" />;
      case 'Returned': return <CheckCircle className="h-3 w-3" />;
      case 'Cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}: {customer.fullName}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${lang}/customers`}>
            <ArrowLeft className={lang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToCustomers}
          </Link>
        </Button>
      </div>

      {/* Customer Information Card */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <User className="mr-2 h-6 w-6 text-primary rtl:ml-2 rtl:mr-0" />
            {t.customerInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                <span className="font-medium">{customer.fullName}</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                <span>{customer.phoneNumber}</span>
              </div>
              
              {customer.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                  <span>{customer.address}</span>
                </div>
              )}
              
              {customer.idCardNumber && (
                <div className="flex items-center">
                  <Fingerprint className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                  <span>{t.idCardLabel}: {customer.idCardNumber}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">{t.customerIdLabel}: {customer.id}</span>
              </div>
              
              {customer.branchName && (
                <div className="flex items-center">
                  <Store className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                  <span>{t.branchLabel}: {customer.branchName}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-sm font-medium">{t.totalOrders}: {orders.length}</span>
              </div>
              
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />
                <span className="text-sm font-medium">{t.totalSpent}: {t.currencySymbol} {totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {customer.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0 rtl:ml-2 rtl:mr-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.notesLabel}:</p>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History Card */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <History className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.orderHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderCodeColumn}</TableHead>
                    <TableHead>{t.orderDateColumn}</TableHead>
                    <TableHead>{t.typeColumn}</TableHead>
                    <TableHead>{t.statusColumn}</TableHead>
                    <TableHead className="text-right">{t.totalPriceColumn}</TableHead>
                    <TableHead className="text-center">{t.viewOrderButton}</TableHead>
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
                        <Badge variant={getStatusVariant(order.status)} className="whitespace-nowrap text-xs flex items-center gap-1 w-fit">
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
                            {t.viewOrderButton}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t.noOrders}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

CustomerDetailClientPage.displayName = 'CustomerDetailClientPage';
export { CustomerDetailClientPage };
