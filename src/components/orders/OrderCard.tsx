
import React from 'react'; 
import type { Order, OrderStatus } from '@/types'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ShoppingBag, User, DollarSign, CornerDownLeft, ListChecks, Info, Briefcase, Store, PlayCircle, CheckCircle2, Clock, AlertTriangle, XCircle, Fingerprint, Send, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';


interface OrderCardProps {
  order: Order; 
  lang: string;
}

const OrderCard = React.memo(function OrderCard({ order, lang: propLang }: OrderCardProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';

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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return lang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy', { locale: lang === 'ar' ? arSA : enUS });
    } catch (error) {
      return lang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date';
    }
  };

  const t = {
    orderId: lang === 'ar' ? `طلب رقم #${order.id}` : `Order #${order.id}`,
    orderCodeLabel: lang === 'ar' ? 'كود الطلب:' : 'Order Code:',
    transactionTypeRental: lang === 'ar' ? 'إيجار' : 'Rental',
    transactionTypeSale: lang === 'ar' ? 'بيع' : 'Sale',
    statusOngoing: lang === 'ar' ? 'جاري التنفيذ' : 'Ongoing',
    statusPendingPreparation: lang === 'ar' ? 'قيد التجهيز' : 'Pending Preparation', 
    statusPrepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared', 
    statusDeliveredToCustomer: lang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    statusCompleted: lang === 'ar' ? 'مكتمل' : 'Completed',
    statusOverdue: lang === 'ar' ? 'متأخر' : 'Overdue',
    statusCancelled: lang === 'ar' ? 'ملغى' : 'Cancelled',
    itemsLabel: lang === 'ar' ? 'الأصناف' : 'Items',
    customerLabel: lang === 'ar' ? 'العميل' : 'Customer',
    sellerLabel: lang === 'ar' ? 'البائع' : 'Seller',
    branchLabel: lang === 'ar' ? 'الفرع' : 'Branch',
    orderDateLabel: lang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    deliveryDateLabel: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDateLabel: lang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    totalLabel: lang === 'ar' ? 'الإجمالي' : 'Total',
    paidLabel: lang === 'ar' ? 'المدفوع' : 'Paid',
    discountLabel: lang === 'ar' ? 'الخصم' : 'Discount',
    manageOrder: lang === 'ar' ? 'إدارة الطلب' : 'Manage Order',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    notApplicable: lang === 'ar' ? 'غير محدد' : 'N/A',
    multipleItems: lang === 'ar' ? 'عدة أصناف' : 'Multiple Items',
  };

  const displayTransactionType = order.transactionType === 'Rental' ? t.transactionTypeRental : t.transactionTypeSale;
  
  const displayStatus = () => {
    switch (order.status) {
      case 'Ongoing': return t.statusOngoing;
      case 'Pending Preparation': return t.statusPendingPreparation;
      case 'Prepared': return t.statusPrepared;
      case 'Delivered to Customer': return t.statusDeliveredToCustomer;
      case 'Completed': return t.statusCompleted;
      case 'Overdue': return t.statusOverdue;
      case 'Cancelled': return t.statusCancelled;
      default: return order.status;
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Ongoing': return <Clock className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Pending Preparation': return <PlayCircle className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Prepared': return <CheckCircle2 className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Delivered to Customer': return <Send className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-green-600" />;
      case 'Completed': return <CheckCircle2 className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Overdue': return <AlertTriangle className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'Cancelled': return <XCircle className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" />;
      default: return null;
    }
  };

  const primaryItemName = order.items.length > 0 ? order.items[0].productName : t.notApplicable;
  const displayItemName = order.items.length > 1 ? `${primaryItemName} + ${order.items.length - 1} ${lang === 'ar' ? 'أخرى' : 'more'}` : primaryItemName;


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
                <CardTitle className="font-headline text-lg sm:text-xl truncate">{t.orderId}</CardTitle>
                {order.orderCode && (
                    <CardDescription className="text-xs text-muted-foreground flex items-center mt-1">
                         <Fingerprint className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0 flex-shrink-0"/>
                         <span className="truncate">{t.orderCodeLabel} {order.orderCode}</span>
                    </CardDescription>
                )}
                <CardDescription className="mt-1 text-sm">{displayTransactionType}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(order.status)} className="text-xs sm:text-sm flex items-center flex-shrink-0">
              {getStatusIcon(order.status)}
              <span className="hidden sm:inline">{displayStatus()}</span>
              <span className="sm:hidden">{displayStatus().substring(0, 8)}</span>
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm px-3 sm:px-6">
        <div className="grid grid-cols-1 gap-y-2">
            <div className="flex items-center min-w-0">
              <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
              <span className="truncate">{t.branchLabel}: {order.branchName || t.notApplicable}</span>
            </div>
            <div className="flex items-center min-w-0">
            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
            <span className="truncate">{t.itemsLabel}: {displayItemName}</span>
            </div>
            <div className="flex items-center min-w-0">
            <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
            <span className="truncate">{t.customerLabel}: {order.customerName || order.customerId}</span>
            </div>
            {order.sellerName && (
              <div className="flex items-center min-w-0">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
                <span className="truncate">{t.sellerLabel}: {order.sellerName}</span>
              </div>
            )}
            <div className="flex items-center min-w-0">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
            <span className="truncate">{t.orderDateLabel}: {formatDate(order.orderDate)}</span>
            </div>
            <div className="flex items-center min-w-0">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
            <span className="truncate">{t.deliveryDateLabel}: {formatDate(order.deliveryDate)}</span>
            </div>
            {order.transactionType === 'Rental' && order.returnDate && (
            <div className="flex items-center min-w-0">
                <CornerDownLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0" />
                <span className="truncate">{t.returnDateLabel}: {formatDate(order.returnDate)}</span>
            </div>
            )}
            <div className="flex items-start min-w-0">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm">
                {t.totalLabel}: {t.currencySymbol} {order.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm">
                {t.paidLabel}: {t.currencySymbol} {order.paidAmount.toFixed(2)}
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="text-xs sm:text-sm">
                  {t.discountLabel}: {t.currencySymbol} {order.discountAmount.toFixed(2)}
                </div>
              )}
            </div>
            </div>
        </div>
        {order.notes && (
          <div className="flex items-start pt-2 min-w-0">
            <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground break-words">{order.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
        <Button asChild variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground min-h-[44px]">
          <Link href={`/${lang}/orders/${order.id}`}>
            <ListChecks className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            <span className="text-sm">{t.manageOrder}</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

export { OrderCard };
