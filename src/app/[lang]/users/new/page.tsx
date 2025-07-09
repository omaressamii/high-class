
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageTitle } from '@/components/shared/PageTitle';
import { ArrowLeft, PlusCircle, Save, UserPlus, ShieldQuestion, Loader, Store, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PermissionString, User, Branch } from '@/types';
import { PERMISSION_STRINGS_FOR_CHECKBOXES, PERMISSION_GROUPS } from '@/types'; 
import { useAuth } from '@/context/AuthContext';
import { ref, push, set, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";


export default function AddNewUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, hasPermission: currentHasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    if (!authIsLoading && !currentHasPermission('users_manage')) {
      router.push(`/${effectiveLang}`);
    }
  }, [authIsLoading, currentHasPermission, effectiveLang, router]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (currentHasPermission('users_manage')) {
        setBranchesLoading(true);
        try {
          const branchesRef = ref(database, 'branches');
          const branchSnapshot = await get(branchesRef);

          if (branchSnapshot.exists()) {
            const branchesData = branchSnapshot.val();
            const branchList = Object.entries(branchesData).map(([id, data]: [string, any]) => ({
              id,
              ...data
            } as Branch));

            // Sort by name since Realtime DB doesn't have built-in orderBy like Firestore
            branchList.sort((a, b) => a.name.localeCompare(b.name));
            setBranches(branchList);
          } else {
            setBranches([]);
          }
        } catch (error) {
          console.error("Error fetching branches:", error);
          toast({ title: effectiveLang === 'ar' ? 'خطأ في جلب الفروع' : 'Error fetching branches', variant: 'destructive' });
        } finally {
          setBranchesLoading(false);
        }
      }
    };
    fetchBranches();
  }, [currentHasPermission, effectiveLang, toast]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل لإنشاء حساب مستخدم جديد وتحديد صلاحياته وفرعه.' : 'Fill in the details to create a new user account, set their permissions, and assign a branch.',
    backToUsers: effectiveLang === 'ar' ? 'العودة إلى المستخدمين' : 'Back to Users',
    saveUser: effectiveLang === 'ar' ? 'حفظ المستخدم' : 'Save User',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    userSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ المستخدم بنجاح!' : 'User saved successfully!',
    userSavedError: effectiveLang === 'ar' ? 'فشل حفظ المستخدم. حاول مرة أخرى.' : 'Failed to save user. Please try again.',
    usernameExistsError: effectiveLang === 'ar' ? 'اسم المستخدم موجود بالفعل. الرجاء اختيار اسم آخر.' : 'Username already exists. Please choose another.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',

    fullNameLabel: effectiveLang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    fullNamePlaceholder: effectiveLang === 'ar' ? 'مثال: أحمد محمد' : 'e.g., John Doe',
    fullNameRequired: effectiveLang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required',

    usernameLabel: effectiveLang === 'ar' ? 'اسم المستخدم (للدخول)' : 'Username (for login)',
    usernamePlaceholder: effectiveLang === 'ar' ? 'مثال: ahmed_mo' : 'e.g., johndoe',
    usernameRequired: effectiveLang === 'ar' ? 'اسم المستخدم مطلوب (إذا لم يكن بائعًا فقط أو لديه وصول لجميع الفروع)' : 'Username is required (if not a seller only or has all branches access)',
    usernameMinLength: effectiveLang === 'ar' ? 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل' : 'Username must be at least 3 characters',

    passwordLabel: effectiveLang === 'ar' ? 'كلمة المرور' : 'Password',
    passwordPlaceholder: effectiveLang === 'ar' ? '••••••••' : '••••••••',
    passwordRequired: effectiveLang === 'ar' ? 'كلمة المرور مطلوبة (إذا لم يكن بائعًا فقط أو لديه وصول لجميع الفروع)' : 'Password is required (if not a seller only or has all branches access)',
    passwordMinLength: effectiveLang === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters',

    branchLabel: effectiveLang === 'ar' ? 'الفرع الأساسي' : 'Primary Branch',
    branchPlaceholder: effectiveLang === 'ar' ? 'اختر الفرع الأساسي' : 'Select Primary Branch',
    branchRequired: effectiveLang === 'ar' ? 'الفرع مطلوب (إذا لم يكن بائعًا فقط ولم يتم تحديد الوصول لجميع الفروع)' : 'Branch is required (if not a seller and not all branches access)',
    noBranchesAvailable: effectiveLang === 'ar' ? 'لا توجد فروع متاحة حاليًا.' : 'No branches available currently.',

    isSellerLabel: effectiveLang === 'ar' ? 'هل هذا المستخدم بائع؟' : 'Is this user a salesperson?',
    isSellerDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيتم تصنيف هذا المستخدم كبائع ويمكن اختياره في الطلبات. يمكن للبائعين تسجيل الدخول والحصول على صلاحيات مثل المستخدمين العاديين.' : 'If checked, this user will be classified as a salesperson and can be selected in orders. Sellers can log in and have permissions like regular users.',
    
    accessAllBranchesLabel: effectiveLang === 'ar' ? 'منح صلاحية الوصول لجميع الفروع؟' : 'Grant access to all branches?',
    accessAllBranchesDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيتمكن هذا المستخدم من رؤية بيانات جميع الفروع والتصرف نيابة عنها. سيتم تجاهل اختيار الفرع المحدد إذا كان هذا الخيار مفعلًا.' : 'If checked, this user can view data from all branches and act on their behalf. Specific branch selection will be ignored if this is active.',

    permissionsTitle: effectiveLang === 'ar' ? 'صلاحيات المستخدم' : 'User Permissions',
    permissionsDescription: effectiveLang === 'ar' ? 'حدد الصلاحيات التي سيتمتع بها هذا المستخدم في النظام (لا تنطبق إذا كان بائعًا فقط).' : 'Select the permissions this user will have in the system (not applicable if salesperson only).',
    
    perm_dashboard_view: effectiveLang === 'ar' ? 'عرض لوحة التحكم' : 'View Dashboard',
    perm_products_view: effectiveLang === 'ar' ? 'عرض المنتجات' : 'View Products',
    perm_products_view_details: effectiveLang === 'ar' ? 'عرض تفاصيل المنتجات' : 'View Product Details',
    perm_products_add: effectiveLang === 'ar' ? 'إضافة منتجات' : 'Add Products',
    perm_products_edit: effectiveLang === 'ar' ? 'تعديل منتجات' : 'Edit Products',
    perm_products_delete: effectiveLang === 'ar' ? 'حذف منتجات' : 'Delete Products',
    perm_products_availability_view: effectiveLang === 'ar' ? 'عرض توفر المنتج' : 'View Product Availability',
    perm_customers_view: effectiveLang === 'ar' ? 'عرض العملاء' : 'View Customers',
    perm_customers_manage: effectiveLang === 'ar' ? 'إدارة العملاء' : 'Manage Customers',
    perm_orders_view: effectiveLang === 'ar' ? 'عرض الطلبات' : 'View Orders',
    perm_orders_add: effectiveLang === 'ar' ? 'إضافة طلبات' : 'Add Orders',
    perm_orders_edit_price: effectiveLang === 'ar' ? 'تعديل سعر الطلب' : 'Edit Order Price',
    perm_orders_apply_discount: effectiveLang === 'ar' ? 'تطبيق خصم على الطلب' : 'Apply Order Discount',
    perm_orders_delete: effectiveLang === 'ar' ? 'حذف طلبات' : 'Delete Orders',
    perm_orders_prepare: effectiveLang === 'ar' ? 'تجهيز الطلبات' : 'Prepare Orders',
    perm_returns_receive: effectiveLang === 'ar' ? 'استلام المرتجعات' : 'Receive Returns',
    perm_financials_view: effectiveLang === 'ar' ? 'عرض السجلات المالية' : 'View Financials',
    perm_payments_record: effectiveLang === 'ar' ? 'تسجيل الدفعات' : 'Record Payments',
    perm_reports_view: effectiveLang === 'ar' ? 'عرض التقارير' : 'View Reports',
    perm_users_view: effectiveLang === 'ar' ? 'عرض المستخدمين' : 'View Users',
    perm_users_manage: effectiveLang === 'ar' ? 'إدارة المستخدمين' : 'Manage Users',
    perm_branches_manage: effectiveLang === 'ar' ? 'إدارة الفروع' : 'Manage Branches',

    group_dashboard_access: effectiveLang === 'ar' ? 'الوصول إلى لوحة التحكم' : 'Dashboard Access',
    group_products_management: effectiveLang === 'ar' ? 'إدارة المنتجات' : 'Products Management',
    group_customers_management: effectiveLang === 'ar' ? 'إدارة العملاء' : 'Customers Management',
    group_orders_management: effectiveLang === 'ar' ? 'إدارة الطلبات' : 'Orders Management',
    group_returns_management: effectiveLang === 'ar' ? 'إدارة المرتجعات' : 'Returns Management',
    group_financials_payments: effectiveLang === 'ar' ? 'المالية والدفعات' : 'Financials & Payments',
    group_reports: effectiveLang === 'ar' ? 'التقارير' : 'Reports',
    group_user_management: effectiveLang === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    group_branch_management: effectiveLang === 'ar' ? 'إدارة الفروع (محدد)' : 'Specific Branch Management',
  };

  const FormSchema = z.object({
    fullName: z.string().min(1, { message: t.fullNameRequired }),
    username: z.string().min(3, { message: t.usernameMinLength }),
    password: z.string().min(6, { message: t.passwordMinLength }),
    branchId: z.string().optional(),
    isSeller: z.boolean().default(false),
    accessAllBranches: z.boolean().default(false),
    permissions: z.array(z.string()).default([]),
  }).superRefine((data, ctx) => {
    if (!data.accessAllBranches) {
      if (!data.branchId || data.branchId.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.branchRequired, path: ["branchId"] });
      }
    }
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      password: '',
      branchId: undefined,
      isSeller: false,
      accessAllBranches: false,
      permissions: [],
    },
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const isSellerWatcher = form.watch('isSeller');
  const accessAllBranchesWatcher = form.watch('accessAllBranches');

  React.useEffect(() => {
    if (accessAllBranchesWatcher) {
      form.setValue('branchId', undefined);
      form.clearErrors('branchId');
    }
  }, [accessAllBranchesWatcher, form]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSaving(true);

    const finalUsername = data.username?.trim() || '';

    // Check if username already exists
    if (finalUsername) {
        const usersRef = ref(database, "users");
        const usersQuery = query(usersRef, orderByChild("username"), equalTo(finalUsername));
        const querySnapshot = await get(usersQuery);
        if (querySnapshot.exists()) {
            toast({ title: t.userSavedError, description: t.usernameExistsError, variant: "destructive" });
            setIsSaving(false);
            form.setError("username", { type: "manual", message: t.usernameExistsError });
            return;
        }
    }

    const finalPermissions = [...data.permissions];
    if (data.accessAllBranches) {
      if (!finalPermissions.includes('view_all_branches')) {
        finalPermissions.push('view_all_branches');
      }
    } else {
      const index = finalPermissions.indexOf('view_all_branches');
      if (index > -1) {
        finalPermissions.splice(index, 1);
      }
    }
    
    const selectedBranch = (!data.accessAllBranches && data.branchId)
                            ? branches.find(b => b.id === data.branchId)
                            : undefined;

    const userDataToSave: Partial<User> & {createdAt: any, username: string} = {
      fullName: data.fullName.trim(),
      username: finalUsername,
      password: data.password,
      isSeller: data.isSeller,
      branchId: data.accessAllBranches ? null : (data.branchId || null),
      branchName: data.accessAllBranches ? null : (selectedBranch?.name || null),
      permissions: finalPermissions,
      createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for Realtime DB
    };


    try {
      // Clean undefined values before saving
      const cleanUserData = Object.fromEntries(
        Object.entries(userDataToSave).filter(([, value]) => value !== undefined)
      );

      const usersRef = ref(database, "users");
      const newUserRef = push(usersRef);
      await set(newUserRef, cleanUserData);

      toast({
        title: t.userSavedSuccess,
        description: `${userDataToSave.fullName} (${userDataToSave.username}) ${effectiveLang === 'ar' ? 'أضيف بنجاح.' : 'has been added.'}`,
      });
      form.reset({
        fullName: '',
        username: '',
        password: '',
        branchId: undefined,
        isSeller: false,
        accessAllBranches: false,
        permissions: [],
      });
    } catch (error) {
      console.error("Error adding user: ", error);
      toast({ title: t.userSavedError, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getPermissionLabel = (permissionId: PermissionString) => {
    const key = `perm_${permissionId}` as keyof typeof t;
    return t[key] || permissionId.replace(/_/g, ' ');
  };


  if (authIsLoading || !currentHasPermission('users_manage')) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/users`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToUsers}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <UserPlus className="h-6 w-6 text-primary" />
                <CardTitle>{t.pageTitle}</CardTitle>
              </div>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                name="isSeller"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t.isSellerLabel}</FormLabel>
                      <FormDescription>
                        {t.isSellerDescription}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="accessAllBranches"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center">
                         <Globe className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                         {t.accessAllBranchesLabel}
                      </FormLabel>
                      <FormDescription>
                        {t.accessAllBranchesDescription}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.usernameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.usernamePlaceholder} {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.passwordLabel}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t.passwordPlaceholder} {...field} autoComplete="new-password"/>
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
                        value={field.value}
                        dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                        disabled={branchesLoading || accessAllBranchesWatcher}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={branchesLoading ? t.loadingBranches : t.branchPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branchesLoading ? (
                            <SelectItem value="loading" disabled>{t.loadingBranches}</SelectItem>
                          ) : branches.length === 0 ? (
                            <SelectItem value="no-branches" disabled>{t.noBranchesAvailable}</SelectItem>
                          ) : (
                            branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShieldQuestion className="h-6 w-6 text-primary" />
                <CardTitle>{t.permissionsTitle}</CardTitle>
              </div>
              <CardDescription>{t.permissionsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.id} className="space-y-3">
                  <h3 className="text-md font-semibold text-foreground border-b pb-2 mb-3">
                    {t[group.nameKey as keyof typeof t] || group.nameKey}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    {group.permissions.map((permissionId) => (
                      <FormField
                        key={permissionId}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 rtl:space-x-reverse">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permissionId)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), permissionId])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== permissionId
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {getPermissionLabel(permissionId as PermissionString)}
                            </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saving}
                </>
              ) : (
                <>
                  <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveUser}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
