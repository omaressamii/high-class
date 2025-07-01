'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/shared/DatePicker';
import { ProductSelector } from '@/components/orders/ProductSelector';
import { ArrowLeft, Save, Edit3, Loader, Trash2, PlusCircle } from 'lucide-react';
import type { TransactionType, Product, User, Order, Customer, Branch, PaymentMethod, OrderItem } from '@/types';
import { paymentMethodValues } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { validateOrder } from '@/lib/orderValidation';
import Link from 'next/link';

const transactionTypeValues: TransactionType[] = ['Rental', 'Sale'];
const NO_SELLER_VALUE = "__NO_SELLER__";

export interface EditOrderData {
  order: Order;
  customer: Customer | null;
  seller: User | null;
  branch: Branch | null;
  allProducts: Product[];
  allCustomers: Customer[];
  allUsers: User[];
  allBranches: Branch[];
}

interface EditOrderClientPageProps {
  initialEditOrderData: EditOrderData;
  lang: 'ar' | 'en';
  orderId: string;
}

export function EditOrderClientPage({ initialEditOrderData, lang, orderId }: EditOrderClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const effectiveLang = lang === 'en' ? 'en' : 'ar';

  const [isSaving, setIsSaving] = useState(false);
  const [editOrderData, setEditOrderData] = useState(initialEditOrderData);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تعديل الطلب' : 'Edit Order',
    pageDescription: effectiveLang === 'ar' ? 'تعديل تفاصيل الطلب الحالي' : 'Edit the current order details',
    basicOrderInfo: effectiveLang === 'ar' ? 'معلومات الطلب الأساسية' : 'Basic Order Information',
    orderItems: effectiveLang === 'ar' ? 'عناصر الطلب' : 'Order Items',
    customerLabel: effectiveLang === 'ar' ? 'العميل' : 'Customer',
    sellerLabel: effectiveLang === 'ar' ? 'البائع' : 'Seller',
    transactionTypeLabel: effectiveLang === 'ar' ? 'نوع المعاملة' : 'Transaction Type',
    orderDateLabel: effectiveLang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    deliveryDateLabel: effectiveLang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDateLabel: effectiveLang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    paidAmountLabel: effectiveLang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount',
    branchLabel: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    paymentMethodLabel: effectiveLang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات' : 'Notes',
    saveChanges: effectiveLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    saving: effectiveLang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    backToOrderDetails: effectiveLang === 'ar' ? 'العودة إلى تفاصيل الطلب' : 'Back to Order Details',
    addItem: effectiveLang === 'ar' ? 'إضافة عنصر' : 'Add Item',
    removeItem: effectiveLang === 'ar' ? 'إزالة العنصر' : 'Remove Item',
    productLabel: effectiveLang === 'ar' ? 'المنتج' : 'Product',
    quantityLabel: effectiveLang === 'ar' ? 'الكمية' : 'Quantity',
    priceLabel: effectiveLang === 'ar' ? 'السعر' : 'Price',
    noSeller: effectiveLang === 'ar' ? 'بدون بائع' : 'No Seller',
    selectCustomer: effectiveLang === 'ar' ? 'اختر العميل' : 'Select Customer',
    selectSeller: effectiveLang === 'ar' ? 'اختر البائع' : 'Select Seller',
    selectBranch: effectiveLang === 'ar' ? 'اختر الفرع' : 'Select Branch',
    selectTransactionType: effectiveLang === 'ar' ? 'اختر نوع المعاملة' : 'Select Transaction Type',
    selectPaymentMethod: effectiveLang === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method',
    rental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    sale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    orderUpdatedSuccess: effectiveLang === 'ar' ? 'تم تحديث الطلب بنجاح' : 'Order updated successfully',
    orderUpdateError: effectiveLang === 'ar' ? 'فشل في تحديث الطلب' : 'Failed to update order',
    accessDenied: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    noEditPermission: effectiveLang === 'ar' ? 'ليس لديك صلاحية لتعديل الطلبات.' : "You don't have permission to edit orders.",
    customerRequired: effectiveLang === 'ar' ? 'العميل مطلوب' : 'Customer is required',
    transactionTypeRequired: effectiveLang === 'ar' ? 'نوع المعاملة مطلوب' : 'Transaction type is required',
    orderDateRequired: effectiveLang === 'ar' ? 'تاريخ الطلب مطلوب' : 'Order date is required',
    deliveryDateRequired: effectiveLang === 'ar' ? 'تاريخ التسليم مطلوب' : 'Delivery date is required',
    paidAmountNonNegative: effectiveLang === 'ar' ? 'المبلغ المدفوع يجب أن يكون غير سالب' : 'Paid amount must be non-negative',
    atLeastOneItem: effectiveLang === 'ar' ? 'يجب إضافة عنصر واحد على الأقل' : 'At least one item is required',
    quantityPositive: effectiveLang === 'ar' ? 'الكمية يجب أن تكون أكبر من صفر' : 'Quantity must be greater than zero',
    priceNonNegative: effectiveLang === 'ar' ? 'السعر يجب أن يكون غير سالب' : 'Price must be non-negative',
    productRequired: effectiveLang === 'ar' ? 'المنتج مطلوب' : 'Product is required',
    deliveryAfterOrder: effectiveLang === 'ar' ? 'تاريخ التسليم يجب أن يكون بعد تاريخ الطلب' : 'Delivery date must be after order date',
    returnAfterDelivery: effectiveLang === 'ar' ? 'تاريخ الإرجاع يجب أن يكون بعد تاريخ التسليم' : 'Return date must be after delivery date',
  };

  // Check permissions
  useEffect(() => {
    if (!authIsLoading && !hasPermission('orders_edit')) {
      toast({
        title: t.accessDenied,
        description: t.noEditPermission,
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/orders/${orderId}`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, orderId, toast, t.accessDenied, t.noEditPermission]);

  // Form validation schema
  const OrderItemSchema = z.object({
    productId: z.string().min(1, { message: t.productRequired }),
    productName: z.string(),
    productCode: z.string(),
    quantity: z.coerce.number().min(1, { message: t.quantityPositive }),
    priceAtTimeOfOrder: z.coerce.number().min(0, { message: t.priceNonNegative }),
  });

  const FormSchema = z.object({
    items: z.array(OrderItemSchema).min(1, { message: t.atLeastOneItem }),
    customerId: z.string().min(1, { message: t.customerRequired }),
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
      return data.deliveryDate >= data.orderDate;
    }
    return true;
  }, {
    message: t.deliveryAfterOrder,
    path: ['deliveryDate'],
  }).refine(data => {
    if (data.deliveryDate && data.returnDate) {
      return data.returnDate >= data.deliveryDate;
    }
    return true;
  }, {
    message: t.returnAfterDelivery,
    path: ['returnDate'],
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: editOrderData.order.items || [],
      customerId: editOrderData.order.customerId || '',
      sellerId: editOrderData.order.sellerId || NO_SELLER_VALUE,
      transactionType: editOrderData.order.transactionType,
      orderDate: editOrderData.order.orderDate ? new Date(editOrderData.order.orderDate) : new Date(),
      deliveryDate: editOrderData.order.deliveryDate ? new Date(editOrderData.order.deliveryDate) : new Date(),
      returnDate: editOrderData.order.returnDate ? new Date(editOrderData.order.returnDate) : undefined,
      paidAmount: editOrderData.order.paidAmount || 0,
      branchId: editOrderData.order.branchId || '',
      paymentMethod: editOrderData.order.paymentMethod,
      notes: editOrderData.order.notes || '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      update(index, {
        productId: product.id,
        productName: product.name,
        productCode: product.productCode || '',
        quantity: fields[index]?.quantity || 1,
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

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    setIsSaving(true);

    try {
      const orderDataToUpdate: Partial<Order> = {
        items: formData.items,
        customerId: formData.customerId,
        sellerId: formData.sellerId === NO_SELLER_VALUE ? undefined : formData.sellerId,
        transactionType: formData.transactionType,
        orderDate: formData.orderDate.toISOString(),
        deliveryDate: formData.deliveryDate.toISOString(),
        returnDate: formData.returnDate?.toISOString(),
        paidAmount: formData.paidAmount,
        branchId: formData.branchId || undefined,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        updatedAt: new Date().toISOString(),
      };

      // Clean undefined values
      const cleanOrderData = Object.fromEntries(
        Object.entries(orderDataToUpdate).filter(([, value]) => value !== undefined)
      );

      // Validate order data before saving
      const validationResult = await validateOrder({ 
        ...editOrderData.order, 
        ...cleanOrderData 
      } as Order, effectiveLang);
      
      if (!validationResult.isValid) {
        throw new Error(`${effectiveLang === 'ar' ? 'بيانات الطلب غير صحيحة' : 'Invalid order data'}: ${validationResult.errors.join(', ')}`);
      }

      // Update order in Firebase
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, cleanOrderData);

      toast({
        title: t.orderUpdatedSuccess,
        description: `${effectiveLang === 'ar' ? 'تم تحديث الطلب رقم' : 'Order'} #${orderId} ${effectiveLang === 'ar' ? 'بنجاح.' : 'has been updated successfully.'}`,
      });

      // Navigate back to order details
      router.push(`/${effectiveLang}/orders/${orderId}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t.orderUpdateError,
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageTitle>{t.pageTitle} #{orderId}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/orders/${orderId}`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.backToOrderDetails}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                {t.basicOrderInfo}
              </CardTitle>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.customerLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectCustomer} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {editOrderData.allCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.fullName} - {customer.phoneNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seller */}
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sellerLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectSeller} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_SELLER_VALUE}>{t.noSeller}</SelectItem>
                        {editOrderData.allUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName || user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.transactionTypeLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectTransactionType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rental">{t.rental}</SelectItem>
                        <SelectItem value="Sale">{t.sale}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch */}
              {editOrderData.allBranches.length > 0 && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.branchLabel}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectBranch} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {editOrderData.allBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Order Date */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.orderDateLabel}</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder={t.orderDateLabel}
                        lang={effectiveLang}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Date */}
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.deliveryDateLabel}</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder={t.deliveryDateLabel}
                        lang={effectiveLang}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Return Date */}
              {form.watch('transactionType') === 'Rental' && (
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.returnDateLabel}</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                          placeholder={t.returnDateLabel}
                          lang={effectiveLang}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Paid Amount */}
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.paidAmountLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.paymentMethodLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectPaymentMethod} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodValues.map((method) => (
                          <SelectItem key={method} value={method}>
                            {effectiveLang === 'ar' ?
                              (method === 'Cash' ? 'نقدي' :
                               method === 'Card' ? 'بطاقة' :
                               method === 'Bank Transfer' ? 'تحويل بنكي' : method) :
                              method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.notesLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={effectiveLang === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t.orderItems}</CardTitle>
              <CardDescription>
                {effectiveLang === 'ar' ? 'إدارة المنتجات في هذا الطلب' : 'Manage the products in this order'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  {/* Product Selector */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.productLabel}</FormLabel>
                          <FormControl>
                            <ProductSelector
                              products={editOrderData.allProducts}
                              selectedProductId={field.value}
                              onProductSelect={(product) => handleProductSelect(index, product)}
                              lang={effectiveLang}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quantity */}
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
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.priceAtTimeOfOrder`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.priceLabel}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remove Item Button */}
                  {fields.length > 1 && (
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Item Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ productId: '', productName: '', productCode: '', quantity: 1, priceAtTimeOfOrder: 0 })}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t.addItem}
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t.saveChanges}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
