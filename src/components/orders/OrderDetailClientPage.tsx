
'use client';

import { useState, useEffect } from 'react'; 
import { useParams, useRouter } from 'next/navigation'; 
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ShoppingBag, User, DollarSign, ArrowLeft, Edit3, Trash2, Printer, Save, XCircle, Briefcase, Loader, AlertCircle, Store, PlayCircle, CheckCircle2, Clock, AlertTriangle, Fingerprint, Send, Package, List, Percent, CreditCard } from 'lucide-react';
import { format, startOfDay } from 'date-fns'; 
import { arSA, enUS } from 'date-fns/locale'; 
import Link from 'next/link';
import type { Order, Product, Customer, User as AppUser, OrderStatus, TransactionType, OrderItem } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { ref, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApplyDiscountDialog } from './ApplyDiscountDialog';
import { AddPaymentDialog } from './AddPaymentDialog';


export type OrderDetailsData = {
  order: Order;
  product?: Product; // This might represent the primary product or be removed for multi-item
  customer?: Customer;
  seller?: AppUser;
  processor?: AppUser;
};

interface OrderDetailClientPageProps {
  initialOrderDetails: OrderDetailsData | null;
  lang: 'ar' | 'en';
  orderId: string;
}

export function OrderDetailClientPage({ initialOrderDetails, lang, orderId }: OrderDetailClientPageProps) {
  const { hasPermission, isLoading: authIsLoading, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const effectiveLang = lang; 

  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(initialOrderDetails);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  useEffect(() => {
    setOrderDetails(initialOrderDetails);
  }, [initialOrderDetails]);


  useEffect(() => {
    if (!authIsLoading && !hasPermission('orders_view')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لعرض هذا الطلب.' : 'You do not have permission to view this order.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/orders`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);

  const t = {
    orderDetailsTitle: (id: string) => effectiveLang === 'ar' ? `تفاصيل الطلب #${id}` : `Order Details #${id}`,
    orderCodeLabel: effectiveLang === 'ar' ? 'كود الطلب' : 'Order Code',
    orderNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على الطلب.' : 'Order not found.',
    backToOrders: effectiveLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders',
    itemsLabel: effectiveLang === 'ar' ? 'الأصناف' : 'Items',
    itemProduct: effectiveLang === 'ar' ? 'المنتج' : 'Product',
    itemQuantity: effectiveLang === 'ar' ? 'الكمية' : 'Qty',
    itemPrice: effectiveLang === 'ar' ? 'السعر' : 'Price',
    itemSubtotal: effectiveLang === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
    productLabel: effectiveLang === 'ar' ? 'المنتج' : 'Product', // Still used for fallback/primary display
    customerLabel: effectiveLang === 'ar' ? 'العميل' : 'Customer',
    sellerLabel: effectiveLang === 'ar' ? 'البائع' : 'Seller',
    processorLabel: effectiveLang === 'ar' ? 'المُعالج بواسطة' : 'Processed by',
    branchLabel: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    orderDateLabel: effectiveLang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    deliveryDateLabel: effectiveLang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDateLabel: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    totalLabel: effectiveLang === 'ar' ? 'الإجمالي' : 'Total',
    paidLabel: effectiveLang === 'ar' ? 'المدفوع' : 'Paid',
    discountLabel: effectiveLang === 'ar' ? 'الخصم' : 'Discount',
    remainingLabel: effectiveLang === 'ar' ? 'المتبقي' : 'Remaining',
    statusLabel: effectiveLang === 'ar' ? 'الحالة' : 'Status',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات' : 'Notes',
    transactionTypeLabel: effectiveLang === 'ar' ? 'نوع المعاملة' : 'Transaction Type',
    transactionTypeRental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    transactionTypeSale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    statusOngoing: effectiveLang === 'ar' ? 'جاري التنفيذ' : 'Ongoing',
    statusPendingPreparation: effectiveLang === 'ar' ? 'قيد التجهيز' : 'Pending Preparation',
    statusPrepared: effectiveLang === 'ar' ? 'تم التجهيز' : 'Prepared',
    statusDeliveredToCustomer: effectiveLang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    statusCompleted: effectiveLang === 'ar' ? 'مكتمل' : 'Completed',
    statusOverdue: effectiveLang === 'ar' ? 'متأخر' : 'Overdue',
    statusCancelled: effectiveLang === 'ar' ? 'ملغى' : 'Cancelled',
    applyDiscount: effectiveLang === 'ar' ? 'تطبيق خصم' : 'Apply Discount',
    addPayment: effectiveLang === 'ar' ? 'إضافة دفعة' : 'Add Payment',
    deleteOrder: effectiveLang === 'ar' ? 'حذف الطلب' : 'Delete Order',
    orderDeletedSuccess: effectiveLang === 'ar' ? 'تم حذف الطلب بنجاح.' : 'Order deleted successfully.',
    orderDeleteError: effectiveLang === 'ar' ? 'فشل حذف الطلب.' : 'Failed to delete order.',
    printInvoice: effectiveLang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice',
    actions: effectiveLang === 'ar' ? 'الإجراءات' : 'Actions',
    confirmDeleteTitle: effectiveLang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion',
    confirmDeleteDescription: effectiveLang === 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this order? This action cannot be undone.',
    confirm: effectiveLang === 'ar' ? 'تأكيد' : 'Confirm',
    cancel: effectiveLang === 'ar' ? 'إلغاء' : 'Cancel',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    unknownSeller: effectiveLang === 'ar' ? 'بائع غير معروف' : 'Unknown Seller',
    unknownProcessor: effectiveLang === 'ar' ? 'معالج غير معروف' : 'Unknown Processor',
    unknownProduct: effectiveLang === 'ar' ? 'منتج غير معروف' : 'Unknown Product',
    unknownCustomer: effectiveLang === 'ar' ? 'عميل غير معروف' : 'Unknown Customer',
    unknownBranch: effectiveLang === 'ar' ? 'فرع غير محدد' : 'Unassigned Branch',
    shopName: effectiveLang === 'ar' ? 'هاي كلاس' : 'Clasic',
    thankYou: effectiveLang === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
  };
  
  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 rtl:mr-4">{t.loadingPage}</p>
      </div>
    );
  }
  
  if (!hasPermission('orders_view') && !authIsLoading) {
    return null; 
  }

  if (!orderDetails) { 
    return (
      <div className="space-y-8 text-center py-12">
        <PageTitle>{t.orderDetailsTitle(orderId)}</PageTitle>
         <Card className="border-destructive bg-destructive/10 max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg justify-center">
              <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {t.orderNotFound} 
            </CardTitle>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/orders`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.backToOrders}
          </Link>
        </Button>
      </div>
    );
  }
  
  const { order, product, customer, seller, processor } = orderDetails;
  const pageTitleContent = order.orderCode 
    ? `${t.orderDetailsTitle(order.id)} (${t.orderCodeLabel} ${order.orderCode})`
    : t.orderDetailsTitle(order.id);

  const displayTransactionType = (type: TransactionType): string => {
    if (type === 'Rental') {
      return t.transactionTypeRental;
    }
    if (type === 'Sale') {
      return t.transactionTypeSale;
    }
    return type; 
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return effectiveLang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); 
      return format(dateObj, 'PPP', { locale: effectiveLang === 'ar' ? arSA : enUS });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return effectiveLang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date';
    }
  };
  
  const formatReceiptDate = (dateString?: string) => {
    if (!dateString) return effectiveLang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return format(dateObj, 'dd/MM/yyyy', { locale: effectiveLang === 'ar' ? arSA : enUS });
    } catch (error) {
      return effectiveLang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date';
    }
  };

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
      case 'Ongoing': return <Clock className="h-4 w-4 text-current" />;
      case 'Pending Preparation': return <PlayCircle className="h-4 w-4 text-current" />;
      case 'Prepared': return <CheckCircle2 className="h-4 w-4 text-current" />;
      case 'Delivered to Customer': return <Send className="h-4 w-4 text-green-600" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Overdue': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'Cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const handleDiscountApplied = () => {
    // Refresh the page to show updated order data
    window.location.reload();
  };

  const handlePaymentAdded = () => {
    // Refresh the page to show updated order data
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!hasPermission('orders_delete') || !currentUser) {
        toast({ title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied', description: effectiveLang === 'ar' ? 'ليس لديك صلاحية لحذف الطلبات.' : "You don't have permission to delete orders.", variant: "destructive"});
        setShowDeleteConfirm(false);
        return;
    }

    // Check if order has been delivered to customer
    if (order.status === 'Delivered to Customer' || order.status === 'Completed') {
        toast({
            title: effectiveLang === 'ar' ? 'لا يمكن حذف الطلب' : 'Cannot Delete Order',
            description: effectiveLang === 'ar' ? 'لا يمكن حذف طلب تم تسليمه للعميل' : 'Cannot delete an order that has been delivered to customer',
            variant: "destructive"
        });
        setShowDeleteConfirm(false);
        return;
    }

    console.log('Deleting order...', order.id);
    try {
        // Delete related financial transactions first
        const financialTransactionsRef = ref(database, 'financial_transactions');
        const transactionsQuery = query(financialTransactionsRef, orderByChild('orderId'), equalTo(order.id));
        const transactionsSnapshot = await get(transactionsQuery);

        if (transactionsSnapshot.exists()) {
            const transactions = transactionsSnapshot.val();
            const deletePromises = Object.keys(transactions).map(transactionId => {
                const transactionRef = ref(database, `financial_transactions/${transactionId}`);
                return remove(transactionRef);
            });
            await Promise.all(deletePromises);
        }

        // TODO: Add logic to revert stock quantities if order is deleted.
        // This requires knowing if items were rentals (decrement quantityRented) or sales (increment quantityInStock).
        // This should ideally be done in a transaction.
        const orderRef = ref(database, `orders/${order.id}`);
        await remove(orderRef);
        toast({ title: t.orderDeletedSuccess });
        router.push(`/${effectiveLang}/orders`);
    } catch (error) {
        console.error("Error deleting order:", error);
        toast({ title: t.orderDeleteError, description: (error as Error).message, variant: "destructive" });
    }
    setShowDeleteConfirm(false);
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const formatReceiptDate = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const dateObj = new Date(dateString.replace(/-/g, '/'));
        if (isNaN(dateObj.getTime())) return dateString;
        return format(dateObj, 'dd/MM/yyyy', { locale: effectiveLang === 'ar' ? arSA : enUS });
      } catch {
        return dateString;
      }
    };

    const displayTransactionType = (type: string) => {
      return type === 'Rental' ? (effectiveLang === 'ar' ? 'إيجار' : 'Rental') : (effectiveLang === 'ar' ? 'بيع' : 'Sale');
    };

    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="${effectiveLang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: black;
            background: white;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 12px;
            margin: 2px 0;
          }
          .section {
            margin: 10px 0;
          }
          .section h3 {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
            border-bottom: 1px dashed black;
            padding-bottom: 2px;
          }
          .line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            align-items: flex-start;
          }
          .line .label {
            flex-shrink: 0;
            margin-right: 10px;
          }
          .line .value {
            text-align: right;
            flex-grow: 1;
            word-wrap: break-word;
          }
          .total-line {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid black;
            padding-top: 3px;
            margin-top: 5px;
          }
          .divider {
            border-top: 1px dashed black;
            margin: 8px 0;
            height: 1px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 12px;
            border-top: 2px solid black;
            padding-top: 10px;
          }
          .notes {
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 5px 0;
            text-align: left;
          }
          @media print {
            body { margin: 0; padding: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t.shopName}</h1>
          <p>${displayTransactionType(order.transactionType)} ${effectiveLang === 'ar' ? 'فاتورة' : 'Invoice'}</p>
          ${order.branchName ? `<p>${t.branchLabel}: ${order.branchName}</p>` : ''}
        </div>

        <div class="section">
          <div class="line">
            <span class="label">${effectiveLang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
            <span class="value">${order.id}</span>
          </div>
          ${order.orderCode ? `
          <div class="line">
            <span class="label">${t.orderCodeLabel}:</span>
            <span class="value">${order.orderCode}</span>
          </div>` : ''}
          <div class="line">
            <span class="label">${t.orderDateLabel}:</span>
            <span class="value">${formatReceiptDate(order.orderDate)}</span>
          </div>
          <div class="line">
            <span class="label">${t.customerLabel}:</span>
            <span class="value">${customerFullName}</span>
          </div>
          ${customer?.phoneNumber ? `
          <div class="line">
            <span class="label">${effectiveLang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
            <span class="value">${customer.phoneNumber}</span>
          </div>` : ''}
          ${sellerFullName !== t.unknownSeller ? `
          <div class="line">
            <span class="label">${t.sellerLabel}:</span>
            <span class="value">${sellerFullName}</span>
          </div>` : ''}
          ${processorFullName !== t.unknownProcessor ? `
          <div class="line">
            <span class="label">${t.processorLabel}:</span>
            <span class="value">${processorFullName}</span>
          </div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="section">
          <h3>${t.itemsLabel}</h3>
          ${order.items.map(item => `
          <div class="line">
            <span class="label">
              ${item.productName} (x${item.quantity})
              ${item.productCode ? ` (${item.productCode})` : ''}
            </span>
            <span class="value">${t.currencySymbol} ${(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}</span>
          </div>`).join('')}
        </div>

        ${order.transactionType === 'Rental' ? `
        <div class="divider"></div>
        <div class="section">
          <div class="line">
            <span class="label">${t.deliveryDateLabel}:</span>
            <span class="value">${formatReceiptDate(order.deliveryDate)}</span>
          </div>
          ${order.returnDate ? `
          <div class="line">
            <span class="label">${t.returnDateLabel}:</span>
            <span class="value">${formatReceiptDate(order.returnDate)}</span>
          </div>` : ''}
        </div>` : ''}

        <div class="divider"></div>

        <div class="section">
          <div class="line total-line">
            <span class="label">${t.totalLabel}:</span>
            <span class="value">${t.currencySymbol} ${order.totalPrice.toFixed(2)}</span>
          </div>
          <div class="line">
            <span class="label">${t.paidLabel}:</span>
            <span class="value">${t.currencySymbol} ${order.paidAmount.toFixed(2)}</span>
          </div>
          ${order.discountAmount && order.discountAmount > 0 ? `
          <div class="line">
            <span class="label">${t.discountLabel}:</span>
            <span class="value">-${t.currencySymbol} ${order.discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="line">
            <span class="label">${t.remainingLabel}:</span>
            <span class="value">${t.currencySymbol} ${order.remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        ${order.notes ? `
        <div class="divider"></div>
        <div class="section">
          <h3>${t.notesLabel}</h3>
          <div class="notes">${order.notes}</div>
        </div>` : ''}

        <div class="footer">
          <p>${t.thankYou}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };
  
  const customerFullName = customer?.fullName || order.customerName || t.unknownCustomer;
  const customerPhoneNumber = customer?.phoneNumber || (effectiveLang === 'ar' ? 'غير متوفر' : 'N/A');
  const sellerFullName = seller?.fullName || order.sellerName || t.unknownSeller;
  const processorFullName = processor?.fullName || order.processedByUserName || t.unknownProcessor;
  // productNameDisplay now comes from order.items in the items table
  const branchNameDisplay = order.branchName || t.unknownBranch;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center no-print">
        <PageTitle>{pageTitleContent}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/orders`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.backToOrders}
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg rounded-lg no-print">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-2xl">{t.transactionTypeLabel}: {displayTransactionType(order.transactionType)}</CardTitle>
            <Badge variant={getStatusVariant(order.status)} className="text-md px-3 py-1 flex items-center gap-1">
              {getStatusIcon(order.status)}
              {displayStatus()}
            </Badge>
          </div>
           {order.orderCode && (
            <CardDescription className="text-sm text-muted-foreground pt-1 flex items-center">
                <Fingerprint className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                {t.orderCodeLabel} {order.orderCode}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6 text-base">
           <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">{t.branchLabel}</h3>
            <p><Store className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {branchNameDisplay}</p>
          </div>
          <hr/>
           <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">{t.customerLabel}</h3>
            <p><User className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {customerFullName}</p>
            {customer?.phoneNumber && <p className="text-sm text-muted-foreground ml-7 rtl:mr-7 rtl:ml-0">{customer.phoneNumber}</p>}
            {customer?.address && <p className="text-sm text-muted-foreground ml-7 rtl:mr-7 rtl:ml-0">{customer.address}</p>}
            {customer?.branchName && <p className="text-sm text-muted-foreground ml-7 rtl:mr-7 rtl:ml-0">
              <Store className="inline h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
              {effectiveLang === 'ar' ? 'فرع العميل: ' : 'Customer Branch: '}{customer.branchName}
            </p>}
          </div>
          <hr/>
           <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">{t.sellerLabel}</h3>
            <p><Briefcase className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {sellerFullName}</p>
            {seller && <p className="text-sm text-muted-foreground ml-7 rtl:mr-7 rtl:ml-0">@{seller.username}</p>}
          </div>
           <hr/>
           <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">{t.processorLabel}</h3>
            <p><User className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {processorFullName}</p>
            {processor && <p className="text-sm text-muted-foreground ml-7 rtl:mr-7 rtl:ml-0">@{processor.username}</p>}
          </div>
          <hr/>
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary flex items-center"><List className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" />{t.itemsLabel}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.itemProduct}</TableHead>
                  <TableHead className="text-center">{t.itemQuantity}</TableHead>
                  <TableHead className="text-right">{t.itemPrice}</TableHead>
                  <TableHead className="text-right">{t.itemSubtotal}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Link href={`/${effectiveLang}/products/${item.productId}`} className="hover:underline text-primary">
                        {item.productName}
                      </Link>
                      {item.productCode && <span className="text-xs text-muted-foreground ml-1">({item.productCode})</span>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{t.currencySymbol} {item.priceAtTimeOfOrder.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{t.currencySymbol} {(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <hr/>
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">{effectiveLang === 'ar' ? 'تفاصيل التواريخ والمالية' : 'Dates & Financials'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <p><CalendarDays className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.orderDateLabel}: {formatDate(order.orderDate)}</p>
              <p><CalendarDays className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.deliveryDateLabel}: {formatDate(order.deliveryDate)}</p>
              {order.transactionType === 'Rental' && order.returnDate && (
                <p><CalendarDays className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.returnDateLabel}: {formatDate(order.returnDate)}</p>
              )}
              <p><DollarSign className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.totalLabel}: {t.currencySymbol} {order.totalPrice.toFixed(2)}</p>
              <p><DollarSign className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.paidLabel}: {t.currencySymbol} {order.paidAmount.toFixed(2)}</p>
              {order.discountAmount && order.discountAmount > 0 && (
                <p><Percent className="inline h-5 w-5 mr-2 text-green-600 rtl:ml-2 rtl:mr-0" /> {t.discountLabel}: {t.currencySymbol} {order.discountAmount.toFixed(2)}</p>
              )}
              {order.discountAppliedDate && (
                <p><CalendarDays className="inline h-5 w-5 mr-2 text-green-600 rtl:ml-2 rtl:mr-0" /> {effectiveLang === 'ar' ? 'تاريخ تطبيق الخصم' : 'Discount Applied Date'}: {formatDate(order.discountAppliedDate)}</p>
              )}
              <p><DollarSign className="inline h-5 w-5 mr-2 text-muted-foreground rtl:ml-2 rtl:mr-0" /> {t.remainingLabel}: {t.currencySymbol} {order.remainingAmount.toFixed(2)}</p>
            </div>
          </div>
          {order.notes && (
            <>
              <hr/>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-primary">{t.notesLabel}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 no-print">
            <h3 className="font-semibold text-lg text-primary sm:mb-0">{t.actions}:</h3>
            <div className="flex flex-wrap gap-2">
                {hasPermission('orders_apply_discount') && order.status !== 'Delivered to Customer' && order.status !== 'Completed' && (
                  <Button variant="outline" onClick={() => setShowDiscountDialog(true)}>
                    <Percent className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.applyDiscount}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowPaymentDialog(true)} className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <CreditCard className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.addPayment}
                </Button>
                {hasPermission('orders_delete') && order.status !== 'Delivered to Customer' && order.status !== 'Completed' && (
                    <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.deleteOrder}
                    </Button>
                )}
                 <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.printInvoice}
                </Button>
            </div>
        </CardFooter>
      </Card>



      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply Discount Dialog */}
      {showDiscountDialog && (
        <ApplyDiscountDialog
          isOpen={showDiscountDialog}
          setIsOpen={setShowDiscountDialog}
          order={order}
          lang={effectiveLang}
          currentUserName={currentUser?.fullName || currentUser?.username || 'Unknown User'}
          onDiscountApplied={handleDiscountApplied}
        />
      )}

      {/* Add Payment Dialog */}
      {showPaymentDialog && (
        <AddPaymentDialog
          isOpen={showPaymentDialog}
          setIsOpen={setShowPaymentDialog}
          order={order}
          lang={effectiveLang}
          currentUserName={currentUser?.fullName || currentUser?.username || 'Unknown User'}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

    </div>
  );
}
