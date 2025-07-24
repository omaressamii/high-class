
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Order, Product, ProductReturnCondition, PaymentMethod, FinancialTransaction, Customer, Branch, OrderItem } from '@/types';
import { paymentMethodValues } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Undo2, CheckCircle, AlertCircle, Filter, CalendarDays, InfoIcon, AlertTriangle, DollarSign, Loader, CreditCard, Store, Send, List } from 'lucide-react';
import { format, parseISO, isWithinInterval, isValid } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { DatePicker } from '@/components/shared/DatePicker';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { ref, get, update, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';


type OrderWithDetails = Order & {
  customerName?: string;
  customerPhoneNumber?: string;
  branchName?: string;
  isReturnedInThisSession?: boolean
};

const returnConditionValues: ProductReturnCondition[] = ['Good', 'Damaged'];


export default function ReceiveReturnsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';
  const locale = effectiveLang === 'ar' ? arSA : enUS;

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  const [ordersToShow, setOrdersToShow] = useState<OrderWithDetails[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCustomerContactDialogOpen, setIsCustomerContactDialogOpen] = useState(false);
  const [selectedOrderForContactDialog, setSelectedOrderForContactDialog] = useState<OrderWithDetails | null>(null);

  const [isReturnDetailsModalOpen, setIsReturnDetailsModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderWithDetails | null>(null);
  const [productCondition, setProductCondition] = useState<ProductReturnCondition | ''>('');
  const [conditionNotes, setConditionNotes] = useState('');

  const [amountPaidNow, setAmountPaidNow] = useState<number | undefined>(undefined);
  const [paymentMethodForReturn, setPaymentMethodForReturn] = useState<PaymentMethod | ''>('');
  const [paymentNotesForReturn, setPaymentNotesForReturn] = useState('');

  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  useEffect(() => {
      const fetchBranches = async () => {
          if (hasPermission('view_all_branches')) {
              try {
                  const branchesRef = ref(database, 'branches');
                  const branchSnapshot = await get(branchesRef);

                  let branchList: Branch[] = [];
                  if (branchSnapshot.exists()) {
                    const branchesData = branchSnapshot.val();
                    branchList = Object.entries(branchesData)
                      .map(([id, data]: [string, any]) => ({ id, ...data } as Branch))
                      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                  }

                  setAvailableBranches(branchList);
              } catch (error) {
                  console.error("Error fetching branches for filter:", error);
              }
          }
      };
      if (currentUser) {
          fetchBranches();
      }
  }, [currentUser, hasPermission]);


  useEffect(() => {
    if (!authIsLoading && !hasPermission('returns_receive')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لاستلام المرتجعات.' : 'You do not have permission to receive returns.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'استلام المرتجعات' : 'Receive Returns',
    pageDescription: effectiveLang === 'ar' ? 'ابحث عن طلبات الإيجار التي تم تسليمها للعميل والمستحقة للإرجاع خلال الفترة المحددة وقم بمعالجتها.' : 'Find and process delivered rental orders due for return within the selected period.',
    filterSectionTitle: effectiveLang === 'ar' ? 'تحديد فترة الإرجاع' : 'Select Return Period',
    startDateLabel: effectiveLang === 'ar' ? 'تاريخ البدء' : 'Start Date',
    endDateLabel: effectiveLang === 'ar' ? 'تاريخ الانتهاء' : 'End Date',
    filterButton: effectiveLang === 'ar' ? 'عرض المرتجعات المستحقة' : 'Show Due Returns',
    filtering: effectiveLang === 'ar' ? 'جار البحث...' : 'Filtering...',
    dueReturnsTitle: effectiveLang === 'ar' ? 'المرتجعات المستحقة (من طلبات تم تسليمها)' : 'Due Returns (from Delivered Orders)',
    orderIdLabel: effectiveLang === 'ar' ? 'رقم الطلب' : 'Order ID',
    orderCodeLabel: effectiveLang === 'ar' ? 'كود الطلب' : 'Order Code',
    orderItems: effectiveLang === 'ar' ? 'أصناف الطلب' : 'Order Items',
    customerName: effectiveLang === 'ar' ? 'اسم العميل' : 'Customer Name',
    customerPhone: effectiveLang === 'ar' ? 'هاتف العميل' : 'Customer Phone',
    branchName: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    expectedReturnDate: effectiveLang === 'ar' ? 'تاريخ الإرجاع المتوقع' : 'Expected Return Date',
    orderStatus: effectiveLang === 'ar' ? 'حالة الطلب' : 'Order Status',
    action: effectiveLang === 'ar' ? 'الإجراء' : 'Action',
    processReturnButton: effectiveLang === 'ar' ? 'معالجة الاستلام' : 'Process Return',
    itemReceivedSuccessfully: (itemName: string, condition: string) => effectiveLang === 'ar' ? `تم استلام "${itemName}" بنجاح. الحالة: ${condition === 'Good' ? 'جيدة' : 'تالفة'}.` : `Successfully received "${itemName}". Condition: ${condition}.`,
    orderReturnProcessed: effectiveLang === 'ar' ? 'تمت معالجة إرجاع الطلب بنجاح.' : 'Order return processed successfully.',
    itemAlreadyReturned: effectiveLang === 'ar' ? 'تم استلام هذه القطعة بالفعل.' : 'This item has already been received.',
    noItemsToReturnInPeriod: effectiveLang === 'ar' ? 'لا توجد طلبات تم تسليمها ومستحقة للإرجاع خلال الفترة المحددة (أو لفرعك).' : 'No delivered orders due for return within the selected period (or for your branch).',
    productDetailsError: effectiveLang === 'ar' ? 'خطأ في العثور على تفاصيل المنتج.' : 'Error finding product details.',
    returnProcessingError: effectiveLang === 'ar' ? 'حدث خطأ أثناء معالجة الإرجاع.' : 'An error occurred while processing the return.',
    errorTitle: effectiveLang === 'ar' ? 'خطأ' : 'Error',
    successTitle: effectiveLang === 'ar' ? 'نجاح' : 'Success',
    statusOngoing: effectiveLang === 'ar' ? 'جاري التنفيذ' : 'Ongoing',
    statusDeliveredToCustomer: effectiveLang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    statusCompleted: effectiveLang === 'ar' ? 'مكتمل' : 'Completed',
    statusOverdue: effectiveLang === 'ar' ? 'متأخر' : 'Overdue',
    statusCancelled: effectiveLang === 'ar' ? 'ملغى' : 'Cancelled',
    viewCustomerDetails: effectiveLang === 'ar' ? 'بيانات العميل' : 'Customer Details',
    customerContactDialogTitle: effectiveLang === 'ar' ? 'تفاصيل الاتصال بالعميل' : 'Customer Contact Details',
    closeDialog: effectiveLang === 'ar' ? 'إغلاق' : 'Close',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    returnDetailsModalTitle: effectiveLang === 'ar' ? 'تفاصيل استلام الطلب' : 'Order Return Details',
    productConditionLabel: effectiveLang === 'ar' ? 'حالة المنتجات عند الاستلام' : 'Product(s) Condition on Return',
    selectConditionPlaceholder: effectiveLang === 'ar' ? 'اختر الحالة' : 'Select Condition',
    conditionGood: effectiveLang === 'ar' ? 'جيد' : 'Good',
    conditionDamaged: effectiveLang === 'ar' ? 'تالف' : 'Damaged',
    conditionNotesLabel: effectiveLang === 'ar' ? 'ملاحظات حول الحالة (اختياري)' : 'Condition Notes (Optional)',
    conditionNotesPlaceholder: effectiveLang === 'ar' ? 'مثال: خدش بسيط، بقعة...' : 'e.g., Minor scratch, stain...',
    confirmReturnButton: effectiveLang === 'ar' ? 'تأكيد الاستلام' : 'Confirm Receipt',
    confirmingReturn: effectiveLang === 'ar' ? 'جار تأكيد الاستلام...' : 'Confirming Return...',
    remainingAmountLabel: effectiveLang === 'ar' ? 'المبلغ المتبقي على الطلب' : 'Remaining Amount on Order',
    paidAmountLabel: effectiveLang === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    mustSelectCondition: effectiveLang === 'ar' ? 'يرجى تحديد حالة المنتج عند الاستلام.' : 'Please select the product condition upon return.',
    settlePaymentSectionTitle: effectiveLang === 'ar' ? 'تسوية المبلغ المتبقي' : 'Settle Outstanding Amount',
    amountPaidNowLabel: effectiveLang === 'ar' ? 'المبلغ المدفوع الآن' : 'Amount Paid Now',
    paymentMethodLabel: effectiveLang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    selectPaymentMethodPlaceholder: effectiveLang === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method',
    paymentNotesLabel: effectiveLang === 'ar' ? 'ملاحظات الدفع (اختياري)' : 'Payment Notes (Optional)',
    paymentNotesPlaceholder: effectiveLang === 'ar' ? 'أدخل ملاحظات الدفع...' : 'Enter payment notes...',
    confirmReturnAndPaymentButton: effectiveLang === 'ar' ? 'تأكيد الاستلام والدفع' : 'Confirm Receipt & Payment',
    paymentRecordedSuccess: effectiveLang === 'ar' ? 'تم تسجيل الدفعة بنجاح.' : 'Payment recorded successfully.',
    paymentProcessingError: effectiveLang === 'ar' ? 'خطأ في تسجيل الدفعة.' : 'Error recording payment.',
    mustSelectPaymentMethod: effectiveLang === 'ar' ? 'يرجى تحديد طريقة الدفع.' : 'Please select a payment method.',
    amountPaidCannotExceedRemaining: effectiveLang === 'ar' ? 'المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المتبقي.' : 'Amount paid cannot exceed the remaining amount.',
    amountPaidMustBePositive: effectiveLang === 'ar' ? 'المبلغ المدفوع يجب أن يكون رقمًا موجبًا.' : 'Amount paid must be a positive number.',
    cash: effectiveLang === 'ar' ? 'نقداً' : 'Cash',
    card: effectiveLang === 'ar' ? 'بطاقة' : 'Card',
    bankTransfer: effectiveLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    other: effectiveLang === 'ar' ? 'أخرى' : 'Other',
    noteOrderReturned: (user: string) => effectiveLang === 'ar' ? `تم استلام الطلب بواسطة ${user}.` : `Order returned by ${user}.`,
    noteItemReturned: (itemName: string, condition: string, notes: string, user: string) => effectiveLang === 'ar' ? `تم استلام المنتج ${itemName}. الحالة: ${condition}. ملاحظات: ${notes}. بواسطة ${user}.` : `Item ${itemName} returned. Condition: ${condition}. Notes: ${notes}. By ${user}.`,
    notePaymentOnReturn: (amount: string, method: string, notes: string, user: string) => effectiveLang === 'ar' ? `تم استلام دفعة بقيمة ${amount} عند الإرجاع عبر ${method}. ملاحظات: ${notes}. بواسطة ${user}.` : `Payment of ${amount} received on return via ${method}. Notes: ${notes}. By ${user}.`,
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (!isValid(dateObj)) return dateString;
      return format(dateObj, 'PPP', { locale });
    } catch { return dateString; }
  };

  const handleFilterOrders = useCallback(async () => {
    if (!startDate || !endDate) {
      setError(effectiveLang === 'ar' ? 'يرجى تحديد تاريخ البدء وتاريخ الإنتهاء.' : 'Please select both start and end dates.');
      setOrdersToShow([]);
      return;
    }
    if (endDate < startDate) {
      setError(effectiveLang === 'ar' ? 'تاريخ الإنتهاء يجب أن يكون بعد تاريخ البدء.' : 'End date must be after start date.');
      setOrdersToShow([]);
      return;
    }

    setIsFiltering(true);
    setError(null);
    setSuccessMessage(null);
    setOrdersToShow([]);

    try {
      // Fetch all orders from Realtime Database
      const ordersRef = ref(database, "orders");
      const ordersSnapshot = await get(ordersRef);

      let fetchedOrdersRaw: Order[] = [];
      if (ordersSnapshot.exists()) {
        const ordersData = ordersSnapshot.val();
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');

        // Client-side filtering since Realtime DB doesn't support complex queries
        fetchedOrdersRaw = Object.entries(ordersData)
          .map(([id, data]: [string, any]) => ({ id, ...data } as Order))
          .filter(order => {
            // Filter by transaction type
            if (order.transactionType !== 'Rental') return false;

            // Filter by status
            if (order.status !== 'Delivered to Customer') return false;

            // Filter by return date range
            if (!order.returnDate || order.returnDate < startDateStr || order.returnDate > endDateStr) return false;

            // Filter by branch permissions
            if (!hasPermission('view_all_branches') && currentUser?.branchId) {
              return order.branchId === currentUser.branchId;
            }

            return true;
          })
          .sort((a, b) => (a.returnDate || '').localeCompare(b.returnDate || ''));
      }

      if (fetchedOrdersRaw.length === 0) {
        setError(t.noItemsToReturnInPeriod);
        setIsFiltering(false);
        return;
      }

      // Fetch customers data from Realtime Database
      const customersRef = ref(database, 'customers');
      const customersSnapshot = await get(customersRef);
      const customersMap = new Map<string, Customer>();

      if (customersSnapshot.exists()) {
        const customersData = customersSnapshot.val();
        Object.entries(customersData).forEach(([id, data]) => {
          customersMap.set(id, { id, ...data } as Customer);
        });
      }


      const resolvedOrders: OrderWithDetails[] = fetchedOrdersRaw.map(order => {
        const customer = customersMap.get(order.customerId);
        let branchName = order.branchName;
        if (!branchName && order.branchId) {
            const foundBranch = availableBranches.find(b => b.id === order.branchId);
            if (foundBranch) branchName = foundBranch.name;
        }

        return {
          ...order,
          customerName: customer?.fullName || order.customerName || order.customerId,
          customerPhoneNumber: customer?.phoneNumber,
          branchName: branchName || (effectiveLang === 'ar' ? 'فرع غير معروف' : 'Unknown Branch'),
          isReturnedInThisSession: false,
          orderDate: String(order.orderDate),
          deliveryDate: String(order.deliveryDate),
          returnDate: order.returnDate ? String(order.returnDate) : undefined,
        };
      });
      
      setOrdersToShow(resolvedOrders);
      if (resolvedOrders.length === 0) {
        setError(t.noItemsToReturnInPeriod);
      } else {
        setError(null);
      }

    } catch (e: any) {
      console.error("Error fetching orders from Realtime Database:", e);
      setError(e.message || (effectiveLang === 'ar' ? 'خطأ في جلب الطلبات.' : 'Error fetching orders.'));
    } finally {
      setIsFiltering(false);
    }
  }, [startDate, endDate, currentUser, hasPermission, effectiveLang, t.noItemsToReturnInPeriod, availableBranches]); 

   useEffect(() => {
     if (currentUser && hasPermission('returns_receive')) {
       handleFilterOrders();
     }
   }, [currentUser, hasPermission, startDate, endDate, handleFilterOrders]); 


  const handleOpenReturnModal = (orderToUpdate: OrderWithDetails) => {
    if (orderToUpdate.isReturnedInThisSession || orderToUpdate.status === 'Completed' || orderToUpdate.status === 'Cancelled') {
        toast({ title: t.itemAlreadyReturned, variant: "default" });
        return;
    }
    setSelectedOrderForModal(orderToUpdate);
    setProductCondition('');
    setConditionNotes('');
    setAmountPaidNow(orderToUpdate.remainingAmount > 0 ? parseFloat(orderToUpdate.remainingAmount.toFixed(2)) : undefined);
    setPaymentMethodForReturn('');
    setPaymentNotesForReturn('');
    setIsReturnDetailsModalOpen(true);
  };

  const handleConfirmReturnAndProcess = async () => {
    if (!selectedOrderForModal || !currentUser) return;
    if (!productCondition) {
        toast({ title: t.mustSelectCondition, variant: "destructive"});
        return;
    }

    let paymentMade = false;
    let actualAmountPaidNow = 0;

    if (selectedOrderForModal.remainingAmount > 0 && amountPaidNow !== undefined && amountPaidNow > 0) {
      if (!paymentMethodForReturn) {
        toast({ title: t.mustSelectPaymentMethod, variant: "destructive" });
        return;
      }
      if (amountPaidNow <= 0) {
        toast({ title: t.amountPaidMustBePositive, variant: "destructive" });
        return;
      }
      if (amountPaidNow > selectedOrderForModal.remainingAmount) {
        toast({ title: t.amountPaidCannotExceedRemaining, variant: "destructive" });
        return;
      }
      actualAmountPaidNow = amountPaidNow;
      paymentMade = true;
    }

    setIsProcessingReturn(true);

    try {
      const orderToUpdate = selectedOrderForModal;

      // Get order data from Realtime Database
      const orderRef = ref(database, `orders/${orderToUpdate.id}`);
      const orderSnap = await get(orderRef);
      if (!orderSnap.exists()) {
          throw new Error("Order not found for update.");
      }

      // Get product data from Realtime Database
      const productDataMap = new Map<string, Product>();
      for (const item of orderToUpdate.items) {
          const productRef = ref(database, `products/${item.productId}`);
          const productSnap = await get(productRef);
          if (!productSnap.exists()) {
            throw new Error(`${t.productDetailsError} (ID: ${item.productId})`);
          }
          productDataMap.set(item.productId, { id: item.productId, ...productSnap.val() } as Product);
      }

      const currentOrderData = orderSnap.val();
      let existingNotes = currentOrderData?.notes || '';

      const finalConditionNotes = conditionNotes?.trim() ? conditionNotes.trim() : (effectiveLang === 'ar' ? "لا توجد ملاحظات حول حالة المنتجات" : "No notes on product(s) condition");
      const currentUserFullName = currentUser.fullName || currentUser.username || 'SystemUser';
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

      const returnNoteMessage = t.noteOrderReturned(currentUserFullName) + ` ${effectiveLang === 'ar' ? 'حالة المنتجات' : 'Product(s) condition'}: ${productCondition === 'Good' ? t.conditionGood : t.conditionDamaged}. ${effectiveLang === 'ar' ? 'ملاحظات' : 'Notes'}: ${finalConditionNotes}.`;
      const returnAuditNote = `[${timestamp}] - ${returnNoteMessage}`;
      existingNotes = existingNotes ? `${existingNotes}\n${returnAuditNote}` : returnAuditNote;

      const updatedOrderFields: Partial<Order> & {updatedAt: string} = {
        status: 'Completed',
        returnCondition: productCondition as ProductReturnCondition,
        returnNotes: finalConditionNotes,
        notes: existingNotes,
        updatedAt: new Date().toISOString(),
      };

      let paymentDataForTransaction: Omit<FinancialTransaction, 'id'> | null = null;
      if (paymentMade) {
        updatedOrderFields.paidAmount = (orderToUpdate.paidAmount || 0) + actualAmountPaidNow;
        updatedOrderFields.remainingAmount = (orderToUpdate.remainingAmount || 0) - actualAmountPaidNow;

        const finalPaymentNotes = paymentNotesForReturn?.trim()
          ? paymentNotesForReturn.trim()
          : (effectiveLang === 'ar' ? "لا توجد ملاحظات اثناء الدفع" : "No notes during payment");

        const paymentNoteMessage = t.notePaymentOnReturn(
            `${t.currencySymbol}${actualAmountPaidNow.toFixed(2)}`,
            getPaymentMethodDisplay(paymentMethodForReturn as PaymentMethod),
            finalPaymentNotes,
            currentUserFullName
        );
        const paymentAuditNote = `[${timestamp}] - ${paymentNoteMessage}`;
        updatedOrderFields.notes = `${existingNotes}\n${paymentAuditNote}`;

        paymentDataForTransaction = {
          orderId: orderToUpdate.id,
          orderCode: orderToUpdate.orderCode, // Add orderCode here
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'Payment Received',
          transactionCategory: 'Customer Payment',
          description: `Payment upon return for order ${orderToUpdate.orderCode || orderToUpdate.id}`,
          amount: actualAmountPaidNow,
          paymentMethod: paymentMethodForReturn as PaymentMethod,
          notes: finalPaymentNotes,
          processedByUserId: currentUser.id,
          processedByUserName: currentUserFullName,
          customerId: orderToUpdate.customerId,
          customerName: orderToUpdate.customerName,
          productName: orderToUpdate.items.length > 0 ? orderToUpdate.items[0].productName + (orderToUpdate.items.length > 1 ? " + others" : "") : "Order Items",
          productId: orderToUpdate.items.length > 0 ? orderToUpdate.items[0].productId : undefined,
          branchId: orderToUpdate.branchId,
          branchName: orderToUpdate.branchName,
          createdAt: new Date().toISOString(),
        };
      }

      // Update products
      for (const item of orderToUpdate.items) {
          const productDocData = productDataMap.get(item.productId);
          if (!productDocData) {
              console.error(`Critical error: Product data for ID ${item.productId} not found in map during write phase.`);
              throw new Error(`Product data for ${item.productId} disappeared during transaction (map).`);
          }

          const productRefToWrite = ref(database, `products/${item.productId}`);
          const newQuantityRented = Math.max(0, (productDocData.quantityRented || 0) - item.quantity);

          const productUpdatePayload: Partial<Product> & {updatedAt: string} = {
              updatedAt: new Date().toISOString(),
              quantityRented: newQuantityRented,
          };

          if (productDocData.status !== 'Sold') {
              productUpdatePayload.status = 'Available';
          }
          await update(productRefToWrite, productUpdatePayload);
      }

      // Update order
      await update(orderRef, updatedOrderFields);

      // Save financial transaction if payment was made
      if (paymentDataForTransaction) {
        const financialTransactionsRef = ref(database, 'financial_transactions');
        const newPaymentRef = push(financialTransactionsRef);
        await set(newPaymentRef, paymentDataForTransaction);
      }

      setOrdersToShow(prevItems => prevItems.map(item =>
          item.id === orderToUpdate.id ? {
              ...item,
              isReturnedInThisSession: true,
              status: 'Completed',
              returnCondition: productCondition as ProductReturnCondition,
              returnNotes: conditionNotes?.trim() ? conditionNotes.trim() : (effectiveLang === 'ar' ? "لا توجد ملاحظات حول حالة المنتجات" : "No notes on product(s) condition"),
              paidAmount: (item.paidAmount || 0) + (paymentMade ? actualAmountPaidNow : 0),
              remainingAmount: (item.remainingAmount || 0) - (paymentMade ? actualAmountPaidNow : 0)
          } : item
      ));

      let successMsg = t.orderReturnProcessed;
      if (paymentMade) {
          successMsg += ` ${t.paymentRecordedSuccess}`;
      }
      toast({ title: successMsg, variant: "default" });
      setSuccessMessage(successMsg);
      setError(null);
      setIsReturnDetailsModalOpen(false);
      setSelectedOrderForModal(null);

    } catch (e: any) {
        console.error("Error processing return transaction:", e);
        let detailedMessage = e.message || t.returnProcessingError;
        if (e.code === 'aborted') {
            detailedMessage = lang === 'ar' ? 'فشلت العملية بسبب تعارض بيانات. حاول مرة أخرى.' : 'Transaction failed due to data conflict. Please try again.';
        } else if (e.name === 'FirebaseError') { 
            detailedMessage = `${t.returnProcessingError} (Code: ${e.code || 'N/A'})`;
        } else if (e.message?.includes('Product data for')) { 
            detailedMessage = e.message;
        }
        toast({ title: t.returnProcessingError, description: detailedMessage, variant: "destructive"});
        setError(detailedMessage);
    } finally {
        setIsProcessingReturn(false);
    }
  };


  const handleViewCustomerDetails = (order: OrderWithDetails) => {
    setSelectedOrderForContactDialog(order);
    setIsCustomerContactDialogOpen(true);
  };

  const displayOrderStatus = (status: Order['status']) => {
    if (status === 'Ongoing') return t.statusOngoing;
    if (status === 'Delivered to Customer') return t.statusDeliveredToCustomer;
    if (status === 'Completed') return t.statusCompleted;
    return status;
  };

  const getPaymentMethodDisplay = (methodValue?: PaymentMethod) => {
    if (!methodValue) return '';
    if (methodValue === 'Cash') return t.cash;
    if (methodValue === 'Card') return t.card;
    if (methodValue === 'Bank Transfer') return t.bankTransfer;
    if (methodValue === 'Other') return t.other;
    return methodValue;
  };
  
  const displayOrderItemsShort = (items: OrderItem[]) => {
    if (!items || items.length === 0) return effectiveLang === 'ar' ? 'لا أصناف' : 'No Items';
    const firstItemName = items[0].productName;
    if (items.length === 1) return firstItemName;
    return `${firstItemName} + ${items.length - 1} ${effectiveLang === 'ar' ? 'أخرى' : 'more'}`;
  };


  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }

  if (!hasPermission('returns_receive')) {
    return null;
  }


  return (
    <div className="space-y-8">
      <PageTitle>{t.pageTitle}</PageTitle>
      <p className="text-muted-foreground">{t.pageDescription}</p>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.filterSectionTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="startDate" className="text-sm font-medium">{t.startDateLabel}</Label>
            <DatePicker date={startDate} setDate={setStartDate} lang={effectiveLang} placeholder={t.startDateLabel} />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="endDate" className="text-sm font-medium">{t.endDateLabel}</Label>
            <DatePicker date={endDate} setDate={setEndDate} lang={effectiveLang} placeholder={t.endDateLabel} />
          </div>
          <Button onClick={handleFilterOrders} disabled={isFiltering} className="w-full md:w-auto md:self-end">
            {isFiltering ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" /> {t.filtering}
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.filterButton}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center text-lg">
                    <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                    {t.errorTitle}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
      )}
      {successMessage && !error && (
         <Card className="border-green-500 bg-green-500/10">
            <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400 flex items-center text-lg">
                    <CheckCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                     {t.successTitle}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{successMessage}</p>
            </CardContent>
        </Card>
      )}

      {ordersToShow.length > 0 && !error && (
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              {t.dueReturnsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderCodeLabel}</TableHead>
                    <TableHead>{t.customerName}</TableHead>
                    <TableHead>{t.orderItems}</TableHead>
                    {hasPermission('view_all_branches') && <TableHead>{t.branchName}</TableHead>}
                    <TableHead>{t.expectedReturnDate}</TableHead>
                    <TableHead>{t.orderStatus}</TableHead>
                    <TableHead className="text-center" colSpan={2}>{t.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersToShow.map((order) => (
                    <TableRow key={order.id} className={order.remainingAmount > 0 && order.status === 'Delivered to Customer' ? 'bg-amber-500/10 hover:bg-amber-500/20' : ''}>
                      <TableCell>
                        <Link href={`/${effectiveLang}/orders/${order.id}`} className="text-primary hover:underline">
                          {order.orderCode || order.id}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{displayOrderItemsShort(order.items)}</TableCell>
                      {hasPermission('view_all_branches') && <TableCell>{order.branchName || (effectiveLang === 'ar' ? 'غير معروف' : 'Unknown')}</TableCell>}
                      <TableCell>{formatDateDisplay(order.returnDate)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'Completed' || order.isReturnedInThisSession ? "outline" : "default"}>
                          {order.status === 'Delivered to Customer' ? <Send className="inline-block h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" /> : null}
                          {displayOrderStatus(order.status)}
                        </Badge>
                        {order.remainingAmount > 0 && order.status === 'Delivered to Customer' && !order.isReturnedInThisSession && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DollarSign className="ml-2 h-4 w-4 text-amber-600 inline-block rtl:mr-2 rtl:ml-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t.remainingAmountLabel}: {t.currencySymbol} {order.remainingAmount.toFixed(2)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => handleViewCustomerDetails(order)}
                          variant="outline"
                          size="sm"
                        >
                          <InfoIcon className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0" /> {t.viewCustomerDetails}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => handleOpenReturnModal(order)}
                          disabled={isProcessingReturn || order.isReturnedInThisSession || order.status === 'Completed' || order.status === 'Cancelled'}
                          variant={order.isReturnedInThisSession || order.status === 'Completed' ? "outline" : "default"}
                          size="sm"
                        >
                          {order.isReturnedInThisSession || order.status === 'Completed' ? <><CheckCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {effectiveLang === 'ar' ? 'تم الاستلام' : 'Received'}</> : <><Undo2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.processReturnButton}</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {ordersToShow.length === 0 && !error && !isFiltering && (
         <Card>
            <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">{effectiveLang === 'ar' ? 'يرجى تحديد فترة زمنية والضغط على زر "عرض المرتجعات المستحقة".' : 'Please select a date range and click "Show Due Returns".'}</p>
            </CardContent>
        </Card>
      )}

      <Dialog open={isCustomerContactDialogOpen} onOpenChange={setIsCustomerContactDialogOpen}>
        <DialogContent className={`sm:max-w-md ${effectiveLang === 'ar' ? 'rtl' : 'ltr'}`}>
          <DialogHeader>
            <DialogTitle>{t.customerContactDialogTitle}</DialogTitle>
          </DialogHeader>
          {selectedOrderForContactDialog && (
            <div className="space-y-3 py-4">
              <p><strong>{t.orderCodeLabel}:</strong> {selectedOrderForContactDialog.orderCode || selectedOrderForContactDialog.id}</p>
              <p><strong>{t.customerName}:</strong> {selectedOrderForContactDialog.customerName}</p>
              <p><strong>{t.customerPhone}:</strong> {selectedOrderForContactDialog.customerPhoneNumber || (effectiveLang === 'ar' ? 'غير متوفر' : 'N/A')}</p>
              <p><strong>{t.orderItems}:</strong> {displayOrderItemsShort(selectedOrderForContactDialog.items)}</p>
              {hasPermission('view_all_branches') && selectedOrderForContactDialog.branchName && <p><strong>{t.branchName}:</strong> {selectedOrderForContactDialog.branchName}</p>}
              <p><strong>{t.expectedReturnDate}:</strong> {formatDateDisplay(selectedOrderForContactDialog.returnDate)}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t.closeDialog}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnDetailsModalOpen} onOpenChange={setIsReturnDetailsModalOpen}>
        <DialogContent className={`sm:max-w-lg ${effectiveLang === 'ar' ? 'rtl' : 'ltr'}`}>
          <DialogHeader>
            <DialogTitle>{t.returnDetailsModalTitle}</DialogTitle>
            {selectedOrderForModal && <CardDescription>{t.orderCodeLabel}: {selectedOrderForModal.orderCode || selectedOrderForModal.id} - {displayOrderItemsShort(selectedOrderForModal.items)}</CardDescription>}
          </DialogHeader>
          {selectedOrderForModal && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>{t.customerName}:</strong> {selectedOrderForModal.customerName}</div>
                <div><strong>{t.orderItems}:</strong> {displayOrderItemsShort(selectedOrderForModal.items)}</div>
                {hasPermission('view_all_branches') && selectedOrderForModal.branchName && <div><strong>{t.branchName}:</strong> {selectedOrderForModal.branchName}</div>}
                <div><strong>{t.paidAmountLabel}:</strong> {t.currencySymbol} {(selectedOrderForModal.paidAmount || 0).toFixed(2)}</div>
                <div className={(selectedOrderForModal.remainingAmount || 0) > 0 ? "font-bold text-destructive" : ""}>
                  <strong>{t.remainingAmountLabel}:</strong> {t.currencySymbol} {(selectedOrderForModal.remainingAmount || 0).toFixed(2)}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="productCondition">{t.productConditionLabel} <span className="text-destructive">*</span></Label>
                <Select
                    value={productCondition}
                    onValueChange={(value) => setProductCondition(value as ProductReturnCondition | '')}
                    dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <SelectTrigger id="productCondition">
                    <SelectValue placeholder={t.selectConditionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {returnConditionValues.map(cond => (
                      <SelectItem key={cond} value={cond}>
                        {cond === 'Good' ? t.conditionGood : t.conditionDamaged}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionNotes">{t.conditionNotesLabel}</Label>
                <Textarea
                  id="conditionNotes"
                  placeholder={t.conditionNotesPlaceholder}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {selectedOrderForModal.remainingAmount > 0 && (
                <div className="pt-4 border-t mt-4">
                  <h3 className="text-md font-semibold mb-3 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
                    {t.settlePaymentSectionTitle}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="amountPaidNow">{t.amountPaidNowLabel}</Label>
                      <Input
                        id="amountPaidNow"
                        type="number"
                        placeholder={`0.00 ${t.currencySymbol}`}
                        value={amountPaidNow === undefined ? '' : amountPaidNow}
                        onChange={(e) => {
                            const val = e.target.value;
                            setAmountPaidNow(val === '' ? undefined : parseFloat(val))
                        }}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethodForReturn">{t.paymentMethodLabel}</Label>
                       <Select
                          value={paymentMethodForReturn}
                          onValueChange={(value) => setPaymentMethodForReturn(value as PaymentMethod | '')}
                          dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <SelectTrigger id="paymentMethodForReturn">
                          <SelectValue placeholder={t.selectPaymentMethodPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodValues.map(method => (
                            <SelectItem key={method} value={method}>{getPaymentMethodDisplay(method)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentNotesForReturn">{t.paymentNotesLabel}</Label>
                      <Textarea
                        id="paymentNotesForReturn"
                        placeholder={t.paymentNotesPlaceholder}
                        value={paymentNotesForReturn}
                        onChange={(e) => setPaymentNotesForReturn(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReturnDetailsModalOpen(false)} disabled={isProcessingReturn}>
              {t.closeDialog}
            </Button>
            <Button
                type="button"
                onClick={handleConfirmReturnAndProcess}
                disabled={!productCondition || isProcessingReturn || ((selectedOrderForModal?.remainingAmount || 0) > 0 && (amountPaidNow === undefined || (amountPaidNow || 0) <=0 || !paymentMethodForReturn)) }
            >
              {isProcessingReturn ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> {t.confirmingReturn}</> :
                (selectedOrderForModal && (selectedOrderForModal.remainingAmount || 0) > 0 ? t.confirmReturnAndPaymentButton : t.confirmReturnButton)
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

