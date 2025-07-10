
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isSameDay, isAfter, startOfDay as dateFnsStartOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageTitle } from '@/components/shared/PageTitle';
import { DatePicker } from '@/components/shared/DatePicker';
import { ProductSelector } from '@/components/orders/ProductSelector';
import { ArrowLeft, PlusCircle, Save, ShoppingBag, Loader, Info, Store, Trash2 } from 'lucide-react';
import type { TransactionType, Product, User, Order, Customer, FinancialTransaction, Branch, PaymentMethod, OrderItem } from '@/types';
import { paymentMethodValues } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, get, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { generateUniqueOrderCode } from '@/lib/orderCodeUtils';
import { validateOrder } from '@/lib/orderValidation';

const transactionTypeValues: TransactionType[] = ['Rental', 'Sale'];
const NO_SELLER_VALUE = "__NO_SELLER__";

export default function AddNewOrderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission: currentHasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [allFetchedProducts, setAllFetchedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sellersList, setSellersList] = useState<User[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [overallTotalPrice, setOverallTotalPrice] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [initialProductIdFromUrl, setInitialProductIdFromUrl] = useState<string | null>(null);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة طلب جديد' : 'Add New Order',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل أدناه لإنشاء طلب جديد.' : 'Fill in the details below to create a new order.',
    backToOrders: effectiveLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders',
    saveOrder: effectiveLang === 'ar' ? 'حفظ الطلب' : 'Save Order',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    orderSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ الطلب بنجاح!' : 'Order saved successfully!',
    orderSavedError: effectiveLang === 'ar' ? 'فشل حفظ الطلب. حاول مرة أخرى.' : 'Failed to save order. Please try again.',
    financialTransactionError: effectiveLang === 'ar' ? 'فشل تسجيل المعاملة المالية. تم حفظ الطلب.' : 'Failed to record financial transaction. Order was saved.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingProducts: effectiveLang === 'ar' ? 'جار تحميل المنتجات...' : 'Loading products...',
    loadingSellers: effectiveLang === 'ar' ? 'جار تحميل البائعين...' : 'Loading sellers...',
    loadingCustomers: effectiveLang === 'ar' ? 'جار تحميل العملاء...' : 'Loading customers...',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',
    
    orderItemsSectionTitle: effectiveLang === 'ar' ? 'أصناف الطلب' : 'Order Items',
    addItemButton: effectiveLang === 'ar' ? 'إضافة صنف آخر' : 'Add Another Item',
    removeItemButton: effectiveLang === 'ar' ? 'إزالة' : 'Remove',
    productLabel: effectiveLang === 'ar' ? 'المنتج' : 'Product',
    selectProductPlaceholder: effectiveLang === 'ar' ? 'ابحث واختر المنتج...' : 'Search and select product...',
    quantityLabel: effectiveLang === 'ar' ? 'الكمية' : 'Quantity',
    quantityMin: effectiveLang === 'ar' ? 'الكمية يجب أن تكون 1 على الأقل' : 'Quantity must be at least 1',
    pricePerItemLabel: effectiveLang === 'ar' ? 'سعر الوحدة' : 'Unit Price',
    subtotalLabel: effectiveLang === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
    noProductsAvailable: effectiveLang === 'ar' ? "لا توجد منتجات متاحة (أو متوافقة مع الفرع ونوع المعاملة)" : "No products available (or compatible with branch and transaction type)",
    atLeastOneItem: effectiveLang === 'ar' ? 'يجب إضافة صنف واحد على الأقل للطلب.' : 'At least one item must be added to the order.',

    customerIdLabel: effectiveLang === 'ar' ? 'العميل' : 'Customer',
    customerIdPlaceholder: effectiveLang === 'ar' ? 'اختر العميل' : 'Select customer',
    customerIdRequired: effectiveLang === 'ar' ? 'اختيار العميل مطلوب' : 'Customer selection is required',
    noCustomersAvailable: effectiveLang === 'ar' ? 'لا يوجد عملاء متاحون' : 'No customers available',
    sellerIdLabel: effectiveLang === 'ar' ? 'البائع (لأغراض التتبع)' : 'Salesperson (for tracking)',
    sellerIdPlaceholder: effectiveLang === 'ar' ? 'اختر البائع' : 'Select salesperson',
    noSellersAvailable: effectiveLang === 'ar' ? "لا يوجد بائعون متاحون" : "No sellers available",
    noSpecificSeller: effectiveLang === 'ar' ? 'لا يوجد بائع محدد' : 'No Specific Seller',
    transactionTypeLabel: effectiveLang === 'ar' ? 'نوع المعاملة (للطلب بأكمله)' : 'Transaction Type (for whole order)',
    transactionTypePlaceholder: effectiveLang === 'ar' ? 'اختر النوع' : 'Select type',
    transactionTypeRequired: effectiveLang === 'ar' ? 'نوع المعاملة مطلوب' : 'Transaction type is required',
    rental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    sale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    orderDateLabel: effectiveLang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    orderDateRequired: effectiveLang === 'ar' ? 'تاريخ الطلب مطلوب' : 'Order date is required',
    deliveryDateLabel: effectiveLang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    deliveryDateRequired: effectiveLang === 'ar' ? 'تاريخ التسليم مطلوب' : 'Delivery date is required',
    deliveryDateAfterOrderDate: effectiveLang === 'ar' ? 'يجب أن يكون تاريخ التسليم في نفس يوم تاريخ الطلب أو بعده' : 'Delivery date must be on or after order date',
    returnDateLabel: effectiveLang === 'ar' ? 'تاريخ الإرجاع (للإيجار)' : 'Return Date (for Rental)',
    returnDateRequired: effectiveLang === 'ar' ? 'تاريخ الإرجاع مطلوب للإيجار' : 'Return date is required for rentals',
    returnDateAfterDeliveryDate: effectiveLang === 'ar' ? 'يجب أن يكون تاريخ الإرجاع في نفس يوم تاريخ التسليم أو بعده' : 'Return date must be on or after delivery date',
    
    overallTotalPriceLabel: effectiveLang === 'ar' ? 'السعر الإجمالي للطلب' : 'Overall Total Price',
    paidAmountLabel: effectiveLang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount',
    paidAmountPlaceholder: effectiveLang === 'ar' ? 'مثال: 50.00' : 'e.g., 50.00',
    paidAmountRequired: effectiveLang === 'ar' ? 'المبلغ المدفوع مطلوب' : 'Paid amount is required',
    paidAmountNonNegative: effectiveLang === 'ar' ? 'المبلغ المدفوع لا يمكن أن يكون سالبًا' : 'Paid amount cannot be negative',
    paidAmountNotMoreThanTotal: effectiveLang === 'ar' ? 'المبلغ المدفوع لا يمكن أن يتجاوز السعر الإجمالي' : 'Paid amount cannot exceed total price',
    remainingAmountLabel: effectiveLang === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية عن الطلب...' : 'Any additional notes about the order...',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    errorFetchingSellers: effectiveLang === 'ar' ? 'خطأ في جلب البائعين' : 'Error fetching sellers',
    errorFetchingCustomers: effectiveLang === 'ar' ? 'خطأ في جلب العملاء' : 'Error fetching customers',
    errorSavingOrder: effectiveLang === 'ar' ? 'حدث خطأ أثناء محاولة حفظ بيانات الطلب.' : 'An error occurred while trying to save the order data.',
    productNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على المنتج المحدد.' : 'Selected product not found.',
    productUnavailableForRent: effectiveLang === 'ar' ? 'المنتج غير متوفر للإيجار حاليًا.' : 'Product is not available for rent currently.',
    productOutOfStockForSale: effectiveLang === 'ar' ? 'المنتج غير متوفر للبيع حاليًا (نفذت الكمية).' : 'Product is out of stock for sale.',
    branchLabel: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    branchPlaceholder: effectiveLang === 'ar' ? 'اختر الفرع' : 'Select Branch',
    branchRequired: effectiveLang === 'ar' ? 'اختيار الفرع إلزامي لهذا الطلب' : 'Branch selection is required for this order',
    noBranchesAvailable: effectiveLang === 'ar' ? 'لا توجد فروع متاحة حاليًا.' : 'No branches available currently.',
    paymentMethodLabel: effectiveLang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    paymentMethodPlaceholder: effectiveLang === 'ar' ? 'اختر طريقة الدفع' : 'Select payment method',
    paymentMethodRequired: effectiveLang === 'ar' ? 'طريقة الدفع مطلوبة للدفعة الأولى' : 'Payment method is required for initial payment',
    cash: effectiveLang === 'ar' ? 'نقداً' : 'Cash',
    card: effectiveLang === 'ar' ? 'بطاقة' : 'Card',
    bankTransfer: effectiveLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    other: effectiveLang === 'ar' ? 'أخرى' : 'Other',
    orderCodeGenerationError: effectiveLang === 'ar' ? 'خطأ في إنشاء كود الطلب' : 'Error generating order code',
    noteOrderCreated: (user: string) => effectiveLang === 'ar' ? `تم إنشاء الطلب بواسطة ${user}. الحالة: جاري التنفيذ.` : `Order created by ${user}. Status: Ongoing.`,
    noteInitialPayment: (amount: string, method: string, user: string) => effectiveLang === 'ar' ? `تم استلام دفعة أولية بقيمة ${t.currencySymbol}${amount} عبر ${method} بواسطة ${user}.` : `Initial payment of ${t.currencySymbol}${amount} received via ${method} by ${user}.`,
    productBranchMismatchErrorTitle: effectiveLang === 'ar' ? 'عدم تطابق فرع المنتج' : 'Product Branch Mismatch',
    productBranchMismatchErrorDesc: (productName: string, branchName: string) => effectiveLang === 'ar' ? `المنتج "${productName}" لا ينتمي إلى الفرع المحدد للطلب "${branchName}" وليس منتجًا عالميًا. يرجى إزالته أو تغييره.` : `Product "${productName}" does not belong to the selected order branch "${branchName}" and is not a global product. Please remove or change it.`,
    orderBranchRequiredForNonGlobalTitle: effectiveLang === 'ar' ? 'الفرع مطلوب للطلب' : 'Order Branch Required',
    orderBranchRequiredForNonGlobalDesc: (productName: string) => effectiveLang === 'ar' ? `المنتج "${productName}" ليس منتجًا عالميًا. يرجى تحديد فرع للطلب بأكمله أو إزالة المنتجات الخاصة بالفروع.` : `Product "${productName}" is not global. Please select a branch for the entire order or remove branch-specific items.`,
    productRequiresOrderBranch: effectiveLang === 'ar' ? 'هذا المنتج خاص بفرع. يرجى اختيار فرع للطلب أولاً أو اختيار منتج عالمي.' : 'This product is branch-specific. Please select an order branch first or choose a global product.',
  };
  
  const OrderItemSchema = z.object({
    productId: z.string().min(1, { message: t.productLabel + " " + (effectiveLang === 'ar' ? 'مطلوب' : 'is required')}),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    quantity: z.coerce.number().int().min(1, {message: t.quantityMin}),
    priceAtTimeOfOrder: z.coerce.number().min(0, {message: "Price must be non-negative"}),
  });

  const FinalFormSchema = z.object({
    items: z.array(OrderItemSchema).min(1, { message: t.atLeastOneItem }),
    customerId: z.string().min(1, { message: t.customerIdRequired }),
    sellerId: z.string().optional(),
    transactionType: z.enum(transactionTypeValues, { required_error: t.transactionTypeRequired }),
    orderDate: z.date({ required_error: t.orderDateRequired }),
    deliveryDate: z.date({ required_error: t.deliveryDateRequired }),
    returnDate: z.date().optional(),
    paidAmount: z.coerce.number().min(0, { message: t.paidAmountNonNegative }).default(0),
    branchId: z.string().optional(),
    paymentMethod: z.enum(paymentMethodValues).optional(),
    notes: z.string().optional(),
  }).refine(data => {
    if (data.orderDate && data.deliveryDate) {
      const orderD = dateFnsStartOfDay(data.orderDate);
      const deliveryD = dateFnsStartOfDay(data.deliveryDate);
      return isSameDay(deliveryD, orderD) || isAfter(deliveryD, orderD);
    }
    return true;
  }, {
    message: t.deliveryDateAfterOrderDate,
    path: ["deliveryDate"],
  }).refine(data => {
    if (data.transactionType === 'Rental' && data.returnDate && data.deliveryDate) {
      const deliveryD = dateFnsStartOfDay(data.deliveryDate);
      const returnD = dateFnsStartOfDay(data.returnDate);
      return isSameDay(returnD, deliveryD) || isAfter(returnD, deliveryD);
    }
    return true;
  }, {
    message: t.returnDateAfterDeliveryDate, // Corrected from returnDateAfterReturnDate
    path: ["returnDate"],
  }).refine(data => {
    if (data.transactionType === 'Rental') {
      return !!data.returnDate;
    }
    return true;
  }, {
    message: t.returnDateRequired,
    path: ["returnDate"],
  }).refine(data => {
    const currentTotal = data.items.reduce((sum, item) => sum + ((Number(item.priceAtTimeOfOrder) || 0) * (Number(item.quantity) || 1)), 0);
    return data.paidAmount <= currentTotal;
  }, {
    message: t.paidAmountNotMoreThanTotal,
    path: ["paidAmount"],
  }).refine(data => (data.paidAmount > 0 ? !!data.paymentMethod : true), {
    message: t.paymentMethodRequired,
    path: ["paymentMethod"],
  });
  
  type FormData = z.infer<typeof FinalFormSchema>;
  
  const defaultItemValue: OrderItem = { productId: '', productName: '', productCode: '', quantity: 1, priceAtTimeOfOrder: 0 };

  const form = useForm<FormData>({
    resolver: zodResolver(FinalFormSchema),
    defaultValues: {
      items: [defaultItemValue],
      customerId: '',
      sellerId: NO_SELLER_VALUE,
      transactionType: undefined,
      orderDate: new Date(),
      deliveryDate: new Date(),
      returnDate: undefined,
      paidAmount: 0,
      branchId: currentHasPermission('view_all_branches') ? undefined : currentUser?.branchId,
      paymentMethod: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (!authIsLoading && !currentHasPermission('orders_add')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لإضافة طلبات.' : 'You do not have permission to add orders.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/orders`);
    }
  }, [authIsLoading, currentHasPermission, effectiveLang, router, toast]);

  useEffect(() => {
    const pid = searchParams.get('productId');
    if (pid) {
      setInitialProductIdFromUrl(pid);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentHasPermission('orders_add')) return;

      setProductsLoading(true);
      setSellersLoading(true);
      setCustomersLoading(true);
      if (currentHasPermission('view_all_branches')) {
        setBranchesLoading(true);
      }

      try {
        const productsRef = ref(database, 'products');
        const productSnapshot = await get(productsRef);

        let productList: Product[] = [];
        if (productSnapshot.exists()) {
          const productsData = productSnapshot.val();
          productList = Object.entries(productsData).map(([id, data]: [string, any]) => ({
            id,
            ...data
          } as Product));
        }

        setAllFetchedProducts(productList);

        if (initialProductIdFromUrl && productList.length > 0) {
          const initialProduct = productList.find(p => p.id === initialProductIdFromUrl);
          if (initialProduct) {
             form.reset({
              ...form.getValues(),
              items: [{
                productId: initialProduct.id,
                productName: initialProduct.name,
                productCode: initialProduct.productCode,
                quantity: 1,
                priceAtTimeOfOrder: initialProduct.price
              }]
            });
          }
        }

      } catch (error) {
        console.error("Error fetching products:", error);
        toast({ title: effectiveLang === 'ar' ? 'خطأ في جلب المنتجات' : 'Error fetching products', variant: 'destructive' });
      } finally {
        setProductsLoading(false);
      }

      try {
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);

        let fetchedSellers: User[] = [];
        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val();
          fetchedSellers = Object.entries(usersData)
            .map(([id, data]: [string, any]) => ({ id, ...data } as User))
            .filter(user => user.isSeller === true)
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        }

        setSellersList(fetchedSellers);
      } catch (error) {
        console.error("Error fetching sellers:", error);
        toast({ title: t.errorFetchingSellers, variant: 'destructive' });
      } finally {
        setSellersLoading(false);
      }

      try {
        const customersRef = ref(database, 'customers');
        const customersSnapshot = await get(customersRef);

        let customerList: Customer[] = [];
        if (customersSnapshot.exists()) {
          const customersData = customersSnapshot.val();
          customerList = Object.entries(customersData)
            .map(([id, data]: [string, any]) => ({ id, ...data } as Customer))
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

          // Apply branch filtering for customers
          if (!currentHasPermission('view_all_branches') && currentUser?.branchId) {
            customerList = customerList.filter(customer => customer.branchId === currentUser.branchId);
          }
        }

        setAvailableCustomers(customerList);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({ title: t.errorFetchingCustomers, variant: 'destructive' });
      } finally {
        setCustomersLoading(false);
      }

      if (currentHasPermission('view_all_branches')) {
        try {
          const branchesRef = ref(database, 'branches');
          const branchesSnapshot = await get(branchesRef);

          let branchList: Branch[] = [];
          if (branchesSnapshot.exists()) {
            const branchesData = branchesSnapshot.val();
            branchList = Object.entries(branchesData)
              .map(([id, data]: [string, any]) => ({ id, ...data } as Branch))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          }

          setBranches(branchList);
        } catch (error) {
          console.error("Error fetching branches:", error);
          toast({ title: effectiveLang === 'ar' ? 'خطأ في جلب الفروع' : 'Error fetching branches', variant: 'destructive' });
        } finally {
          setBranchesLoading(false);
        }
      }
    };
    
    if (currentHasPermission('orders_add')) {
        fetchInitialData();
    }
  }, [currentHasPermission, effectiveLang, toast, t.errorFetchingCustomers, t.errorFetchingSellers, initialProductIdFromUrl, form]);
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const transactionTypeWatcher = form.watch('transactionType');
  const itemsWatcher = form.watch('items');
  const paidAmountWatcher = form.watch('paidAmount');
  const orderBranchIdWatcher = form.watch('branchId');

  const availableProductsForDropdown = useCallback(() => {
    let products = allFetchedProducts;
    const orderBranchSelected = form.getValues('branchId'); // Order's designated branch

    if (currentHasPermission('view_all_branches')) {
        if (orderBranchSelected && orderBranchSelected !== 'all') {
            // Admin selected a specific branch FOR THE ORDER
            products = products.filter(p => p.isGlobalProduct || p.branchId === orderBranchSelected);
        } else {
            // Admin has NOT selected a specific branch for the order yet OR selected "All Branches" for the order
            // In this case, show ALL products (globals + all branch-specific ones).
            // Validation on submit will handle if branch-specific items are added without a specific order branch.
        }
    } else if (currentUser?.branchId) {
        // User has a specific branch and no 'view_all_branches'
        products = products.filter(p => p.isGlobalProduct || p.branchId === currentUser.branchId);
    } else {
        // User has no branch and no 'view_all_branches' - only show global products
        products = products.filter(p => p.isGlobalProduct);
    }
    
    return products.filter(p => {
      if (p.status === 'Sold') return false;
      if (transactionTypeWatcher === 'Rental' && p.category !== 'Rental' && p.category !== undefined) return false; 
      if (transactionTypeWatcher === 'Sale' && p.category !== 'Sale' && p.category !== undefined) return false; 

      const availableForOperation = p.quantityInStock - p.quantityRented;
      return availableForOperation > 0;
    });
  }, [allFetchedProducts, currentUser, currentHasPermission, orderBranchIdWatcher, transactionTypeWatcher, form]);


  useEffect(() => {
    const newTotal = itemsWatcher.reduce((sum, item) => {
      const price = Number(item.priceAtTimeOfOrder) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
    setOverallTotalPrice(newTotal);
  }, [JSON.stringify(itemsWatcher.map(item => ({ q: item.quantity, p: item.priceAtTimeOfOrder })))]);


  useEffect(() => {
    setRemainingAmount(overallTotalPrice - (paidAmountWatcher || 0));
  }, [overallTotalPrice, paidAmountWatcher]);
  
  useEffect(() => {
    if (transactionTypeWatcher === 'Sale') {
      form.setValue('returnDate', undefined);
      form.clearErrors('returnDate');
      if (overallTotalPrice > 0) {
        form.setValue('paidAmount', overallTotalPrice);
      } else {
        form.setValue('paidAmount', 0);
      }
    }
  }, [transactionTypeWatcher, overallTotalPrice, form]);


  const handleProductDetailsChange = (index: number, product: Product | undefined) => {
    const orderBranchIdSelected = form.getValues('branchId');

    if (product) {
      // If admin hasn't selected an order branch, AND the chosen product is NOT global, prompt to select order branch.
      if (currentHasPermission('view_all_branches') && !orderBranchIdSelected && !product.isGlobalProduct) {
        toast({ title: t.orderBranchRequiredForNonGlobalTitle, description: t.productRequiresOrderBranch, variant: "destructive" });
        update(index, { ...defaultItemValue, productId: '' }); // Clear the selection
        return;
      }
      // If admin HAS selected an order branch, AND the chosen product is NOT global AND doesn't match the order branch, prevent.
      if (currentHasPermission('view_all_branches') && orderBranchIdSelected && !product.isGlobalProduct && product.branchId !== orderBranchIdSelected) {
         toast({ title: t.productBranchMismatchErrorTitle, description: t.productBranchMismatchErrorDesc(product.name, branches.find(b => b.id === orderBranchIdSelected)?.name || orderBranchIdSelected), variant: "destructive"});
         update(index, { ...defaultItemValue, productId: '' }); // Clear the selection
         return;
      }

      update(index, {
        productId: product.id,
        productName: product.name,
        productCode: product.productCode || '',
        quantity: itemsWatcher[index]?.quantity || 1,
        priceAtTimeOfOrder: product.price,
      });
    } else { 
       update(index, {
        productId: '',
        productName: '',
        productCode: '',
        quantity: 1,
        priceAtTimeOfOrder: 0,
      });
    }
  };
  
  const [isSaving, setIsSaving] = useState(false);
  
  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    setIsSaving(true);
    let newOrderId = '';

    try {
      const customerInfo = availableCustomers.find(c => c.id === formData.customerId);
      if (!customerInfo) {
        toast({ title: effectiveLang === 'ar' ? 'لم يتم العثور على العميل المحدد.' : 'Selected customer not found.', variant: "destructive" });
        setIsSaving(false);
        return;
      }
      
      const sellerInfo = formData.sellerId && formData.sellerId !== NO_SELLER_VALUE ? sellersList.find(s => s.id === formData.sellerId) : null;

      let orderBranchIdForSaving: string | undefined;
      let orderBranchNameForSaving: string | undefined;

      if (currentHasPermission('view_all_branches')) {
        orderBranchIdForSaving = formData.branchId; 
        if (orderBranchIdForSaving) {
          orderBranchNameForSaving = branches.find(b => b.id === orderBranchIdForSaving)?.name;
        }
      } else { 
        orderBranchIdForSaving = currentUser?.branchId;
        orderBranchNameForSaving = currentUser?.branchName;
      }

      for (const item of formData.items) {
        const productForItem = allFetchedProducts.find(p => p.id === item.productId);
        if (!productForItem) continue; 

        if (!productForItem.isGlobalProduct) { // Product is branch-specific
            if (!orderBranchIdForSaving) { // No order branch assigned (could happen if admin didn't pick one)
                toast({ title: t.orderBranchRequiredForNonGlobalTitle, description: t.orderBranchRequiredForNonGlobalDesc(productForItem.name), variant: "destructive" });
                setIsSaving(false);
                return;
            }
            if (productForItem.branchId !== orderBranchIdForSaving) { // Product's branch doesn't match order's branch
                toast({ title: t.productBranchMismatchErrorTitle, description: t.productBranchMismatchErrorDesc(productForItem.name, orderBranchNameForSaving || orderBranchIdForSaving!), variant: "destructive" });
                setIsSaving(false);
                return;
            }
        }
        // If product is global, it's fine. If it's branch-specific and matches, it's fine.
      }
      

      let calculatedTotalPrice = 0;
      const processedItems: OrderItem[] = [];

      for (const item of formData.items) {
        const productDetails = allFetchedProducts.find(p => p.id === item.productId);
        if (!productDetails) {
          toast({ title: t.productNotFound, description: `Product ID ${item.productId} not found in fetched products.`, variant: "destructive" });
          setIsSaving(false);
          return;
        }
        // Price used for calculation and saving depends on permission
        const priceForThisItem = currentHasPermission('orders_edit_price')
                                 ? Number(item.priceAtTimeOfOrder) // Use price from form if permission
                                 : productDetails.price;         // Else, use original product price
        calculatedTotalPrice += priceForThisItem * Number(item.quantity);
        
        processedItems.push({
          productId: item.productId,
          productName: productDetails.name,
          productCode: productDetails.productCode,
          quantity: Number(item.quantity),
          priceAtTimeOfOrder: priceForThisItem, // Save the determined price
        });
      }


      if (calculatedTotalPrice <= 0 && formData.items.length > 0) {
          toast({ title: effectiveLang === 'ar' ? "السعر الإجمالي يجب أن يكون أكبر من صفر." : "Total price must be greater than zero.", variant: "destructive" });
          setIsSaving(false);
          return;
      }

      // Generate a new order ID using push
      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      newOrderId = newOrderRef.key!;

      // Generate unique order code using utility function
      const orderCodeString = await generateUniqueOrderCode();

      // Get product snapshots from database
      const productSnapshotsFromDbMap = new Map<string, Product>();
      for (const item of processedItems) {
          const productRef = ref(database, `products/${item.productId}`);
          const productSnap = await get(productRef);
          if (!productSnap.exists()) {
              throw new Error(`${effectiveLang === 'ar' ? 'المنتج بالمعرف' : 'Product with ID'} ${item.productId} ${effectiveLang === 'ar' ? 'غير موجود.' : 'not found.'}`);
          }
          productSnapshotsFromDbMap.set(item.productId, {id: item.productId, ...productSnap.val()} as Product);
      }

      // Update product quantities
      for (const item of processedItems) {
          const productDataFromDb = productSnapshotsFromDbMap.get(item.productId);
          if (!productDataFromDb) {
               throw new Error(`Logic error: Product snapshot for ${item.productId} not found after read.`);
          }
          const updatedProductFields: Partial<Product> & {updatedAt: string} = { updatedAt: new Date().toISOString() };
          const productRefToWrite = ref(database, `products/${item.productId}`);

          if (formData.transactionType === 'Rental') {
            if ((productDataFromDb.quantityInStock - productDataFromDb.quantityRented) < Number(item.quantity)) {
              throw new Error(`${t.productUnavailableForRent} (${productDataFromDb.name})`);
            }
            updatedProductFields.quantityRented = (productDataFromDb.quantityRented || 0) + Number(item.quantity);
          } else {
            if (productDataFromDb.quantityInStock < Number(item.quantity)) {
              throw new Error(`${t.productOutOfStockForSale} (${productDataFromDb.name})`);
            }
            updatedProductFields.quantityInStock = productDataFromDb.quantityInStock - Number(item.quantity);
            updatedProductFields.quantitySold = (productDataFromDb.quantitySold || 0) + Number(item.quantity);
            if (updatedProductFields.quantityInStock <= 0) {
              updatedProductFields.status = 'Sold';
            }
          }
          await update(productRefToWrite, updatedProductFields);
      }
        
      const currentUserFullName = currentUser?.fullName || currentUser?.username || 'SystemUser';
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

      let orderNotes = formData.notes?.trim() ? formData.notes.trim() : '';
      const creationNote = `[${timestamp}] - ${t.noteOrderCreated(currentUserFullName)}`;
      orderNotes = orderNotes ? `${orderNotes}\n${creationNote}` : creationNote;

      if (formData.paidAmount && formData.paidAmount > 0 && formData.paymentMethod) {
          const paymentMethodDisplay = getPaymentMethodDisplay(formData.paymentMethod);
          const paymentNote = `[${timestamp}] - ${t.noteInitialPayment(formData.paidAmount.toFixed(2), paymentMethodDisplay, currentUserFullName)}`;
          orderNotes += `\n${paymentNote}`;
      }

      const orderDataToSave: Omit<Order, 'id'> & { createdAt: string; orderCode: string; } = {
        orderCode: orderCodeString,
        items: processedItems,
        customerId: formData.customerId,
        customerName: customerInfo.fullName,
        sellerId: sellerInfo?.id || null,
        sellerName: sellerInfo?.fullName || null,
        processedByUserId: currentUser?.id || 'U_UNKNOWN_PROCESSOR',
        processedByUserName: currentUserFullName,
        transactionType: formData.transactionType,
        orderDate: format(formData.orderDate, 'yyyy-MM-dd'),
        deliveryDate: format(formData.deliveryDate, 'yyyy-MM-dd'),
        returnDate: formData.transactionType === 'Sale'
          ? '2099-12-31'
          : (formData.returnDate ? format(formData.returnDate, 'yyyy-MM-dd') : null),
        totalPrice: calculatedTotalPrice,
        paidAmount: formData.paidAmount || 0,
        discountAmount: 0,
        remainingAmount: calculatedTotalPrice - (formData.paidAmount || 0),
        status: 'Ongoing',
        notes: orderNotes || null,
        branchId: orderBranchIdForSaving || null,
        branchName: orderBranchNameForSaving || null,
        createdAt: new Date().toISOString(),
      };

      const financialTransactionBase = {
        orderId: newOrderId,
        orderCode: orderCodeString, // Add orderCode here
        date: format(formData.orderDate, 'yyyy-MM-dd'),
        processedByUserId: currentUser?.id || 'SYS_ORDERS_NEW',
        processedByUserName: currentUserFullName,
        customerId: customerInfo.id,
        customerName: customerInfo.fullName,
        productName: processedItems.length > 0 ? (processedItems[0]?.productName || "Multiple Items") : "N/A",
        productId: processedItems.length > 0 ? (processedItems[0]?.productId || null) : null,
        notes: `Order ID: ${newOrderId}, Order Code: ${orderCodeString} (${processedItems.length} items)`,
        branchId: orderBranchIdForSaving || null,
        branchName: orderBranchNameForSaving || null,
        createdAt: new Date().toISOString(),
      };

      const initialOrderValueTransaction: Omit<FinancialTransaction, 'id'> = {
        ...financialTransactionBase,
        type: formData.transactionType === 'Sale' ? 'Initial Sale Value' : 'Initial Rental Value',
        transactionCategory: formData.transactionType === 'Sale' ? 'Sale Revenue' : 'Rental Revenue',
        description: `${formData.transactionType === 'Sale' ? t.sale : t.rental}: ${processedItems.map(i => i.productName).join(', ')}`,
        amount: calculatedTotalPrice,
      };

      let initialPaymentTransactionData: Omit<FinancialTransaction, 'id'> | null = null;
      if (formData.paidAmount && formData.paidAmount > 0 && formData.paymentMethod) {
        initialPaymentTransactionData = {
          ...financialTransactionBase,
          type: 'Payment Received',
          transactionCategory: 'Customer Payment',
          description: `Initial payment for order ${newOrderId} (Code: ${orderCodeString})`,
          amount: formData.paidAmount,
          paymentMethod: formData.paymentMethod,
        };
      }

      // Order code counter already updated above to prevent race conditions

      // Validate order data before saving
      const validationResult = await validateOrder(orderDataToSave, effectiveLang);
      if (!validationResult.isValid) {
        throw new Error(`${effectiveLang === 'ar' ? 'بيانات الطلب غير صحيحة' : 'Invalid order data'}: ${validationResult.errors.join(', ')}`);
      }

      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('Order validation warnings:', validationResult.warnings);
      }

      // Clean undefined values from order data before saving
      const cleanOrderData = Object.fromEntries(
        Object.entries(orderDataToSave).filter(([, value]) => value !== undefined)
      );

      // Save the order
      await set(newOrderRef, cleanOrderData);

      // Save financial transactions
      const financialTransactionsRef = ref(database, 'financial_transactions');

      // Clean undefined values from financial transaction data
      const cleanInitialOrderTransaction = Object.fromEntries(
        Object.entries(initialOrderValueTransaction).filter(([, value]) => value !== undefined)
      );

      const ftRef1 = push(financialTransactionsRef);
      await set(ftRef1, cleanInitialOrderTransaction);

      if (initialPaymentTransactionData) {
        const cleanPaymentTransaction = Object.fromEntries(
          Object.entries(initialPaymentTransactionData).filter(([, value]) => value !== undefined)
        );
        const ftRef2 = push(financialTransactionsRef);
        await set(ftRef2, cleanPaymentTransaction);
      }

      toast({
        title: t.orderSavedSuccess,
        description: `${effectiveLang === 'ar' ? 'الطلب برقم معرف' : 'Order with ID'}: ${newOrderId} ${effectiveLang === 'ar' ? 'أضيف بنجاح.' : 'has been added.'}`,
      });
      form.reset({
        items: [defaultItemValue],
        customerId: '',
        sellerId: NO_SELLER_VALUE,
        transactionType: undefined,
        orderDate: new Date(),
        deliveryDate: new Date(),
        returnDate: undefined,
        paidAmount: 0,
        branchId: currentHasPermission('view_all_branches') ? undefined : currentUser?.branchId,
        paymentMethod: undefined,
        notes: '',
      });
      router.push(`/${effectiveLang}/orders/${newOrderId}`);
    } catch (error: any) {
      console.error("Error saving order to Realtime Database: ", error);
      toast({
        title: t.orderSavedError,
        description: error.message || t.errorSavingOrder,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getTransactionTypeDisplay = (typeValue: TransactionType) => {
    if (typeValue === 'Rental') return t.rental;
    if (typeValue === 'Sale') return t.sale;
    return typeValue;
  };
  
  const getPaymentMethodDisplay = (methodValue?: PaymentMethod) => {
    if (!methodValue) return '';
    if (methodValue === 'Cash') return t.cash;
    if (methodValue === 'Card') return t.card;
    if (methodValue === 'Bank Transfer') return t.bankTransfer;
    if (methodValue === 'Other') return t.other;
    return methodValue;
  };


  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }

  if (!currentHasPermission('orders_add')) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/orders`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToOrders}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg rounded-lg mb-6">
            <CardHeader>
              <CardTitle>{effectiveLang === 'ar' ? 'معلومات الطلب الأساسية' : 'Basic Order Information'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {currentHasPermission('view_all_branches') ? (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.branchLabel}</FormLabel>
                      {branchesLoading ? (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Loader className="h-5 w-5 animate-spin" />
                          <span>{t.loadingBranches}</span>
                        </div>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                          dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.branchPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.length === 0 && <SelectItem value="no-branches-placeholder" disabled>{t.noBranchesAvailable}</SelectItem>}
                            {branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : currentUser?.branchName ? (
                <FormItem>
                  <FormLabel>{t.branchLabel}</FormLabel>
                  <FormControl>
                    <Input value={currentUser.branchName} disabled />
                  </FormControl>
                </FormItem>
              ) : null}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.customerIdLabel}</FormLabel>
                    {customersLoading ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>{t.loadingCustomers}</span>
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.customerIdPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCustomers.length === 0 && <SelectItem value="no-customers-placeholder" disabled>{t.noCustomersAvailable}</SelectItem>}
                          {availableCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.fullName} ({customer.phoneNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sellerIdLabel}</FormLabel>
                    {sellersLoading ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>{t.loadingSellers}</span>
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value || NO_SELLER_VALUE} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.sellerIdPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_SELLER_VALUE}>{t.noSpecificSeller}</SelectItem>
                          {sellersList.length === 0 && !field.value && <SelectItem value="no-sellers-placeholder" disabled>{t.noSellersAvailable}</SelectItem>}
                          {sellersList.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>{seller.fullName} ({seller.username})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.transactionTypeLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.transactionTypePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionTypeValues.map(typeVal => (
                          <SelectItem key={typeVal} value={typeVal}>{getTransactionTypeDisplay(typeVal)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.orderDateLabel}</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      lang={effectiveLang}
                      placeholder={t.orderDateLabel}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.deliveryDateLabel}</FormLabel>
                     <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      lang={effectiveLang}
                      placeholder={t.deliveryDateLabel}
                      disabled={(date) => {
                        const orderDateValue = form.getValues("orderDate");
                        return orderDateValue instanceof Date && !isNaN(orderDateValue.getTime())
                          ? date < dateFnsStartOfDay(orderDateValue)
                          : false;
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {transactionTypeWatcher === 'Rental' && (
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t.returnDateLabel}</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        lang={effectiveLang}
                        placeholder={t.returnDateLabel}
                        disabled={(date) => {
                           const deliveryDateValue = form.getValues("deliveryDate");
                           return deliveryDateValue instanceof Date && !isNaN(deliveryDateValue.getTime())
                             ? date < dateFnsStartOfDay(deliveryDateValue)
                             : false;
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle>{t.orderItemsSectionTitle}</CardTitle>
              <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-md space-y-4 relative bg-muted/20">
                   {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 rtl:left-2 rtl:right-auto text-destructive hover:bg-destructive/10"
                      aria-label={t.removeItemButton}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 md:col-span-1">
                          <FormLabel>{t.productLabel}</FormLabel>
                          {productsLoading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <ProductSelector
                              products={availableProductsForDropdown()}
                              value={field.value}
                              onValueChange={(productId) => {
                                field.onChange(productId);
                                const selectedProduct = allFetchedProducts.find(p => p.id === productId);
                                handleProductDetailsChange(index, selectedProduct);
                              }}
                              onProductSelect={(product) => handleProductDetailsChange(index, product)}
                              lang={effectiveLang}
                              placeholder={t.selectProductPlaceholder}
                              disabled={productsLoading || !transactionTypeWatcher}
                            />
                          )}
                           {!transactionTypeWatcher && <FormDescription className="text-xs">{effectiveLang === 'ar' ? 'الرجاء اختيار نوع المعاملة أولاً.' : 'Please select transaction type first.'}</FormDescription>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.quantityLabel}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              value={field.value === 1 ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 1 : parseInt(e.target.value, 10) || 1)}
                              onFocus={e => {
                                if (e.target.value === '1') {
                                  e.target.value = '';
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name={`items.${index}.priceAtTimeOfOrder`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.pricePerItemLabel}</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    field.onChange(isNaN(value) ? 0 : value);
                                }}
                                onFocus={e => {
                                  if (e.target.value === '0') {
                                    e.target.value = '';
                                    field.onChange('');
                                  }
                                }}
                                disabled={!currentHasPermission('orders_edit_price')}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormItem>
                        <FormLabel>{t.subtotalLabel}</FormLabel>
                        <Input value={`${t.currencySymbol} ${((Number(itemsWatcher[index]?.priceAtTimeOfOrder) || 0) * (Number(itemsWatcher[index]?.quantity) || 1)).toFixed(2)}`} disabled readOnly />
                     </FormItem>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append(defaultItemValue)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addItemButton}
              </Button>
            </CardContent>
             <CardFooter className="flex flex-col items-end space-y-2 border-t pt-4">
                <div className="text-lg font-semibold">
                    {t.overallTotalPriceLabel}: {t.currencySymbol} {overallTotalPrice.toFixed(2)}
                </div>
            </CardFooter>
          </Card>
          
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>{effectiveLang === 'ar' ? 'الدفع والملاحظات' : 'Payment & Notes'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.paidAmountLabel} ({t.currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t.paidAmountPlaceholder}
                        {...field}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        onFocus={e => {
                          if (e.target.value === '0') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        disabled={authIsLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>{t.remainingAmountLabel} ({t.currencySymbol})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={remainingAmount.toFixed(2)}
                    disabled
                    readOnly
                    className="text-muted-foreground font-semibold"
                  />
                </FormControl>
              </FormItem>
              {paidAmountWatcher !== undefined && paidAmountWatcher > 0 && (
                 <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.paymentMethodLabel}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.paymentMethodPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethodValues.map(methodVal => (
                            <SelectItem key={methodVal} value={methodVal}>{getPaymentMethodDisplay(methodVal)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.notesLabel}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.notesPlaceholder} rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || authIsLoading || fields.length === 0 || (fields.length === 1 && !fields[0].productId) }>
                 {isSaving ? (
                  <>
                    <Loader className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saving}
                  </>
                ) : (
                  <>
                    <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveOrder}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
    

    

    

