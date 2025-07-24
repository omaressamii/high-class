
'use client';

import React from 'react'; 
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTitle } from '@/components/shared/PageTitle';
import { ArrowLeft, PlusCircle, Save, Loader } from 'lucide-react';
import { ref, push, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Branch } from '@/types';

export default function AddNewCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = React.useState(true);


  React.useEffect(() => {
    if (!authIsLoading && !hasPermission('customers_manage')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لإضافة عملاء.' : 'You do not have permission to add customers.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/customers`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);

  // Load branches
  React.useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesRef = ref(database, 'branches');
        const branchesSnapshot = await get(branchesRef);

        if (branchesSnapshot.exists()) {
          const branchesData = branchesSnapshot.val();
          const branchList: Branch[] = Object.entries(branchesData).map(([id, data]: [string, any]) => ({
            id,
            ...data
          }));
          setBranches(branchList);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        toast({
          title: effectiveLang === 'ar' ? 'خطأ في تحميل الفروع' : 'Error loading branches',
          variant: 'destructive',
        });
      } finally {
        setBranchesLoading(false);
      }
    };

    loadBranches();
  }, [effectiveLang, toast]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل أدناه لإنشاء ملف تعريف عميل جديد.' : 'Fill in the details below to create a new customer profile.',
    backToCustomers: effectiveLang === 'ar' ? 'العودة إلى العملاء' : 'Back to Customers',
    saveCustomer: effectiveLang === 'ar' ? 'حفظ العميل' : 'Save Customer',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    customerSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ العميل بنجاح!' : 'Customer saved successfully!',
    customerSavedError: effectiveLang === 'ar' ? 'فشل حفظ العميل. حاول مرة أخرى.' : 'Failed to save customer. Please try again.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',

    fullNameLabel: effectiveLang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    fullNamePlaceholder: effectiveLang === 'ar' ? 'مثال: أحمد محمد' : 'e.g., John Doe',
    fullNameRequired: effectiveLang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required',

    phoneNumberLabel: effectiveLang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    phoneNumberPlaceholder: effectiveLang === 'ar' ? 'مثال: 05xxxxxxxx' : 'e.g., 555-123-4567',
    phoneNumberRequired: effectiveLang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required',
    phoneNumberInvalid: effectiveLang === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number',

    addressLabel: effectiveLang === 'ar' ? 'العنوان (اختياري)' : 'Address (Optional)',
    addressPlaceholder: effectiveLang === 'ar' ? 'مثال: شارع الملك فهد، الرياض' : 'e.g., 123 Main St, Anytown',

    idCardNumberLabel: effectiveLang === 'ar' ? 'رقم الهوية/جواز السفر (اختياري)' : 'ID/Passport Number (Optional)',
    idCardNumberPlaceholder: effectiveLang === 'ar' ? 'مثال: 1234567890' : 'e.g., ID1234567',

    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية عن العميل...' : 'Any additional notes about the customer...',
    errorSavingCustomer: effectiveLang === 'ar' ? 'حدث خطأ أثناء محاولة حفظ بيانات العميل.' : 'An error occurred while trying to save the customer data.',

    branchLabel: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    branchPlaceholder: effectiveLang === 'ar' ? 'اختر الفرع' : 'Select Branch',
    branchRequired: effectiveLang === 'ar' ? 'الفرع مطلوب' : 'Branch is required',
  };

  const FormSchema = z.object({
    fullName: z.string().min(1, { message: t.fullNameRequired }),
    phoneNumber: z.string().min(1, { message: t.phoneNumberRequired })
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, {message: t.phoneNumberInvalid}),
    address: z.string().optional(),
    idCardNumber: z.string().optional(),
    notes: z.string().optional(),
    branchId: z.string().optional(),
  }).superRefine((data, ctx) => {
    // If user doesn't have view_all_branches permission, branchId is required
    if (!hasPermission('view_all_branches') && (!data.branchId || data.branchId.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.branchRequired, path: ["branchId"] });
    }
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      idCardNumber: '',
      notes: '',
      branchId: '',
    },
  });

  const [isSaving, setIsSaving] = React.useState(false);

  // Auto-set branch for users with specific branch
  React.useEffect(() => {
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
      form.setValue('branchId', currentUser.branchId);
    }
  }, [currentUser, hasPermission, form]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSaving(true);
    try {
      const selectedBranch = data.branchId ? branches.find(b => b.id === data.branchId) : undefined;

      const customerDataToSave = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        address: data.address || null,
        idCardNumber: data.idCardNumber || null,
        notes: data.notes || null,
        branchId: data.branchId || null,
        branchName: selectedBranch?.name || null,
        createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for Realtime DB
        createdByUserId: currentUser?.id || 'UNKNOWN_USER',
      };

      const customersRef = ref(database, 'customers');
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, customerDataToSave);
      console.log("Customer added with ID: ", newCustomerRef.key);

      toast({
        title: t.customerSavedSuccess,
        description: `${data.fullName} ${effectiveLang === 'ar' ? 'أضيف بنجاح.' : 'has been added.'}`,
      });
      form.reset();
      // Optionally redirect after successful save
      // router.push(`/${effectiveLang}/customers/${docRef.id}`);
    } catch (error: any) { 
      console.error("Error saving customer to Firestore: ", error);
      toast({
        title: t.customerSavedError,
        description: error.message || t.errorSavingCustomer,
        variant: "destructive",
      });
    } finally { 
      setIsSaving(false);
    }
  };
  
  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }

  if (!hasPermission('customers_manage')) {
    return null; 
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/customers`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToCustomers}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.fullNameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.fullNamePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.phoneNumberLabel}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder={t.phoneNumberPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.branchLabel}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                      disabled={branchesLoading || (!hasPermission('view_all_branches') && !!currentUser?.branchId)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            (!hasPermission('view_all_branches') && currentUser?.branchName)
                            ? currentUser.branchName
                            : t.branchPlaceholder
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.addressLabel}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.addressPlaceholder} rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idCardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.idCardNumberLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.idCardNumberPlaceholder} {...field} />
                    </FormControl>
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
              <Button type="submit" disabled={isSaving || authIsLoading}>
                {isSaving ? (
                  <>
                    <Save className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saving}
                  </>
                ) : (
                  <>
                    <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveCustomer}
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

    