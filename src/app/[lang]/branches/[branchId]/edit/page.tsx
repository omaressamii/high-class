'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Edit3, Loader } from 'lucide-react';
import Link from 'next/link';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Branch } from '@/types';

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';
  const branchId = params.branchId as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);

  // Check permissions
  useEffect(() => {
    if (!authIsLoading && !hasPermission('branches_manage')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لتعديل الفروع.' : 'You do not have permission to edit branches.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/branches`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);

  // Load branch data
  useEffect(() => {
    const loadBranch = async () => {
      if (!branchId) return;
      
      try {
        const branchRef = ref(database, `branches/${branchId}`);
        const snapshot = await get(branchRef);
        
        if (snapshot.exists()) {
          const branchData = { id: branchId, ...snapshot.val() } as Branch;
          setBranch(branchData);
          
          // Set form values
          form.reset({
            name: branchData.name || '',
            address: branchData.address || '',
            phoneNumber: branchData.phoneNumber || '',
            notes: branchData.notes || '',
          });
        } else {
          toast({
            title: effectiveLang === 'ar' ? 'فرع غير موجود' : 'Branch Not Found',
            description: effectiveLang === 'ar' ? 'الفرع المطلوب غير موجود.' : 'The requested branch does not exist.',
            variant: 'destructive',
          });
          router.push(`/${effectiveLang}/branches`);
        }
      } catch (error) {
        console.error('Error loading branch:', error);
        toast({
          title: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data',
          description: effectiveLang === 'ar' ? 'حدث خطأ أثناء تحميل بيانات الفرع.' : 'An error occurred while loading branch data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBranch(false);
      }
    };

    if (currentUser && hasPermission('branches_manage')) {
      loadBranch();
    }
  }, [branchId, currentUser, hasPermission, effectiveLang, router, toast]);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تعديل الفرع' : 'Edit Branch',
    pageDescription: effectiveLang === 'ar' ? 'تعديل معلومات الفرع' : 'Edit branch information',
    backToBranches: effectiveLang === 'ar' ? 'العودة للفروع' : 'Back to Branches',
    nameLabel: effectiveLang === 'ar' ? 'اسم الفرع' : 'Branch Name',
    namePlaceholder: effectiveLang === 'ar' ? 'أدخل اسم الفرع...' : 'Enter branch name...',
    nameRequired: effectiveLang === 'ar' ? 'اسم الفرع مطلوب.' : 'Branch name is required.',
    addressLabel: effectiveLang === 'ar' ? 'العنوان (اختياري)' : 'Address (Optional)',
    addressPlaceholder: effectiveLang === 'ar' ? 'أدخل عنوان الفرع...' : 'Enter branch address...',
    phoneNumberLabel: effectiveLang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)',
    phoneNumberPlaceholder: effectiveLang === 'ar' ? 'أدخل رقم الهاتف...' : 'Enter phone number...',
    phoneNumberInvalid: effectiveLang === 'ar' ? 'رقم الهاتف يجب أن يحتوي على أرقام فقط.' : 'Phone number must contain only numbers.',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية عن الفرع...' : 'Any additional notes about the branch...',
    updateBranch: effectiveLang === 'ar' ? 'تحديث الفرع' : 'Update Branch',
    updating: effectiveLang === 'ar' ? 'جاري التحديث...' : 'Updating...',
    branchUpdated: effectiveLang === 'ar' ? 'تم تحديث الفرع بنجاح!' : 'Branch updated successfully!',
    branchUpdateError: effectiveLang === 'ar' ? 'حدث خطأ أثناء تحديث الفرع.' : 'An error occurred while updating the branch.',
    loadingPage: effectiveLang === 'ar' ? 'جاري تحميل الصفحة...' : 'Loading page...',
  };

  const FormSchema = z.object({
    name: z.string().min(1, { message: t.nameRequired }),
    address: z.string().optional(),
    phoneNumber: z.string().optional().refine(val => !val || /^[0-9]+$/.test(val), { message: t.phoneNumberInvalid }),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
      notes: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!branch || !currentUser) return;
    setIsSaving(true);

    try {
      const updateData = {
        name: data.name,
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        notes: data.notes || '',
        updatedAt: new Date().toISOString(),
        updatedByUserId: currentUser.id,
      };

      const branchRef = ref(database, `branches/${branchId}`);
      await update(branchRef, updateData);

      toast({
        title: t.branchUpdated,
        variant: 'default',
      });

      router.push(`/${effectiveLang}/branches`);
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: t.branchUpdateError,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authIsLoading || isLoadingBranch) {
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

  if (!branch) {
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
                <Edit3 className="h-6 w-6 text-primary" />
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
                      <Input placeholder={t.addressPlaceholder} {...field} />
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
                    <Save className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.updating}
                  </>
                ) : (
                  <>
                    <Save className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.updateBranch}
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
