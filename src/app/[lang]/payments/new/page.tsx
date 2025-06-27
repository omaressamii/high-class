
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageTitle } from '@/components/shared/PageTitle';
import { DatePicker } from '@/components/shared/DatePicker';
import { ArrowLeft, PlusCircle, Save, Receipt, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';

const paymentMethodValues: PaymentMethod[] = ['Cash', 'Card', 'Bank Transfer', 'Other'];

export default function AddNewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  useEffect(() => {
    if (!authIsLoading && !hasPermission('payments_record')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لتسجيل دفعات.' : 'You do not have permission to record payments.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/financials`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة دفعة جديدة' : 'Add New Payment',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل أدناه لتسجيل دفعة جديدة.' : 'Fill in the details below to record a new payment.',
    backToFinancials: effectiveLang === 'ar' ? 'العودة إلى المالية' : 'Back to Financials',
    savePayment: effectiveLang === 'ar' ? 'حفظ الدفعة' : 'Save Payment',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    paymentSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ الدفعة بنجاح!' : 'Payment saved successfully!',
    paymentSavedError: effectiveLang === 'ar' ? 'فشل حفظ الدفعة. حاول مرة أخرى.' : 'Failed to save payment. Please try again.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',

    orderIdLabel: effectiveLang === 'ar' ? 'معرف الطلب' : 'Order ID',
    orderIdPlaceholder: effectiveLang === 'ar' ? 'مثال: O001' : 'e.g., O001',
    orderIdRequired: effectiveLang === 'ar' ? 'معرف الطلب مطلوب' : 'Order ID is required',

    paymentDateLabel: effectiveLang === 'ar' ? 'تاريخ الدفعة' : 'Payment Date',
    paymentDateRequired: effectiveLang === 'ar' ? 'تاريخ الدفعة مطلوب' : 'Payment date is required',
    
    amountLabel: effectiveLang === 'ar' ? 'المبلغ' : 'Amount',
    amountPlaceholder: effectiveLang === 'ar' ? 'مثال: 100.00' : 'e.g., 100.00',
    amountRequired: effectiveLang === 'ar' ? 'المبلغ مطلوب' : 'Amount is required',
    amountPositive: effectiveLang === 'ar' ? 'يجب أن يكون المبلغ رقمًا موجبًا' : 'Amount must be a positive number',

    paymentMethodLabel: effectiveLang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    paymentMethodPlaceholder: effectiveLang === 'ar' ? 'اختر طريقة الدفع' : 'Select payment method',
    paymentMethodRequired: effectiveLang === 'ar' ? 'طريقة الدفع مطلوبة' : 'Payment method is required',
    cash: effectiveLang === 'ar' ? 'نقداً' : 'Cash',
    card: effectiveLang === 'ar' ? 'بطاقة ائتمانية/خصم' : 'Credit/Debit Card',
    bankTransfer: effectiveLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    other: effectiveLang === 'ar' ? 'أخرى' : 'Other',
    
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية عن الدفعة...' : 'Any additional notes about the payment...',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
  };

  const FormSchema = z.object({
    orderId: z.string().min(1, { message: t.orderIdRequired }),
    date: z.date({ required_error: t.paymentDateRequired }),
    amount: z.coerce.number().positive({ message: t.amountPositive }).min(0.01, { message: t.amountRequired }),
    paymentMethod: z.enum(paymentMethodValues, { required_error: t.paymentMethodRequired }),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderId: '',
      date: new Date(), 
      amount: undefined,
      paymentMethod: undefined,
      notes: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSaving(true);
    
    const submissionData = {
      ...data,
      id: `PAY${Math.floor(Math.random() * 9000 + 1000)}`, 
      date: format(data.date, 'yyyy-MM-dd'),
      processedByUserId: currentUser?.id || 'U_UNKNOWN', 
    };
    console.log('Payment Data:', submissionData);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const success = Math.random() > 0.2;
    if (success) {
      toast({
        title: t.paymentSavedSuccess,
        description: `${effectiveLang === 'ar' ? 'دفعة للطلب' : 'Payment for order'} ${data.orderId} ${effectiveLang === 'ar' ? 'بمبلغ' : 'of'} ${t.currencySymbol} ${data.amount.toFixed(2)} ${effectiveLang === 'ar' ? 'أضيفت بنجاح.' : 'has been added.'}`,
      });
      form.reset({ 
        orderId: '',
        date: new Date(), 
        amount: undefined,
        paymentMethod: undefined,
        notes: '',
      });
    } else {
      toast({
        title: t.paymentSavedError,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };
  
  const getPaymentMethodDisplay = (methodValue: PaymentMethod) => {
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

  if (!hasPermission('payments_record')) {
    return null; 
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/financials`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToFinancials}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Receipt className="h-6 w-6 text-primary" />
                    <CardTitle>{t.pageTitle}</CardTitle>
                </div>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.orderIdLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.orderIdPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.amountLabel} ({t.currencySymbol})</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder={t.amountPlaceholder} {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.paymentDateLabel}</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={(d) => field.onChange(d)} 
                      lang={effectiveLang}
                      placeholder={t.paymentDateLabel}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" disabled={isSaving}>
                 {isSaving ? (
                  <>
                    <Save className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saving}
                  </>
                ) : (
                  <>
                    <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.savePayment}
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
