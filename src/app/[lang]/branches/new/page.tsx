
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
// Select components are removed as theme selection is removed
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageTitle } from '@/components/shared/PageTitle';
import { ArrowLeft, PlusCircle, Save, Store, Loader } from 'lucide-react'; // Palette icon removed
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Branch } from '@/types';
// Removed import for themes and defaultThemeName

export default function AddNewBranchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  React.useEffect(() => {
    if (!authIsLoading && !hasPermission('branches_manage')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لإضافة فروع.' : 'You do not have permission to add branches.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل أدناه لإنشاء فرع جديد.' : 'Fill in the details below to create a new branch.',
    backToBranches: effectiveLang === 'ar' ? 'العودة إلى الفروع' : 'Back to Branches',
    saveBranch: effectiveLang === 'ar' ? 'حفظ الفرع' : 'Save Branch',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    branchSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ الفرع بنجاح!' : 'Branch saved successfully!',
    branchSavedError: effectiveLang === 'ar' ? 'فشل حفظ الفرع. حاول مرة أخرى.' : 'Failed to save branch. Please try again.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',

    nameLabel: effectiveLang === 'ar' ? 'اسم الفرع' : 'Branch Name',
    namePlaceholder: effectiveLang === 'ar' ? 'مثال: فرع الرياض الرئيسي' : 'e.g., Riyadh Main Branch',
    nameRequired: effectiveLang === 'ar' ? 'اسم الفرع مطلوب' : 'Branch name is required',

    addressLabel: effectiveLang === 'ar' ? 'العنوان (اختياري)' : 'Address (Optional)',
    addressPlaceholder: effectiveLang === 'ar' ? 'مثال: شارع العليا، الرياض' : 'e.g., Olaya St, Riyadh',

    phoneNumberLabel: effectiveLang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)',
    phoneNumberPlaceholder: effectiveLang === 'ar' ? 'مثال: 0112345678' : 'e.g., 0112345678',
    phoneNumberInvalid: effectiveLang === 'ar' ? 'رقم الهاتف غير صالح (يجب أن يكون أرقامًا فقط)' : 'Invalid phone number (must be digits only)',

    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية عن الفرع...' : 'Any additional notes about the branch...',
    // Removed theme related translations
  };

  // Removed availableThemes array

  const FormSchema = z.object({
    name: z.string().min(1, { message: t.nameRequired }),
    address: z.string().optional(),
    phoneNumber: z.string().optional().refine(val => !val || /^[0-9]+$/.test(val), { message: t.phoneNumberInvalid }),
    // Removed themeName from schema
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
      // Removed themeName from defaultValues
      notes: '',
    },
  });

  const [isSaving, setIsSaving] = React.useState(false);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSaving(true);
    try {
      // Ensure optional fields are null if empty/undefined, not undefined.
      const branchDataToSave = {
        name: data.name,
        address: data.address || null, // Store null if address is empty or undefined
        phoneNumber: data.phoneNumber || null, // Store null if phoneNumber is empty or undefined
        notes: data.notes || null, // Store null if notes are empty or undefined
        createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for Realtime DB
        createdByUserId: currentUser?.id || 'UNKNOWN_USER',
      };

      const branchesRef = ref(database, 'branches');
      const newBranchRef = push(branchesRef);
      await set(newBranchRef, branchDataToSave);
      console.log("Branch added with ID: ", newBranchRef.key);

      toast({
        title: t.branchSavedSuccess,
        description: `${data.name} ${effectiveLang === 'ar' ? 'أضيف بنجاح.' : 'has been added.'}`,
      });
      form.reset();
      // router.push(`/${effectiveLang}/branches`);
    } catch (error: any) {
      console.error("Error saving branch to Firestore: ", error);
      toast({
        title: t.branchSavedError,
        description: error.message || t.branchSavedError,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }

  if (!hasPermission('branches_manage')) {
    return null; // Redirect is handled by useEffect
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/branches`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToBranches}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
               <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Store className="h-6 w-6 text-primary" />
                  <CardTitle>{t.pageTitle}</CardTitle>
              </div>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.nameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.namePlaceholder} {...field} />
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
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.addressLabel}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.addressPlaceholder} rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Removed FormField for themeName */}
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
                    <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveBranch}
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
