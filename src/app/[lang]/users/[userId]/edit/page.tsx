
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageTitle } from '@/components/shared/PageTitle';
import { ArrowLeft, Save, UserCog, ShieldQuestion, Loader, Store, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, PermissionString, Branch } from '@/types';
import { PERMISSION_STRINGS_FOR_CHECKBOXES, PERMISSION_GROUPS } from '@/types'; 
import { useAuth } from '@/context/AuthContext';
import { ref, get, update, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { permissions: loggedInUserPermissions, isLoading: authIsLoading, hasPermission: currentHasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const userId = params.userId as string;
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    if (!authIsLoading && !currentHasPermission('users_manage')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية للوصول لهذه الصفحة.' : 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}`);
    }
  }, [authIsLoading, currentHasPermission, effectiveLang, router, toast]);

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
    pageTitle: effectiveLang === 'ar' ? 'تعديل المستخدم' : 'Edit User',
    pageDescription: effectiveLang === 'ar' ? 'قم بتحديث تفاصيل المستخدم وصلاحياته وفرعه.' : 'Update the user details, permissions, and branch.',
    backToUsers: effectiveLang === 'ar' ? 'العودة إلى المستخدمين' : 'Back to Users',
    saveChanges: effectiveLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    userUpdatedSuccess: effectiveLang === 'ar' ? 'تم تحديث المستخدم بنجاح!' : 'User updated successfully!',
    userUpdatedError: effectiveLang === 'ar' ? 'فشل تحديث المستخدم. حاول مرة أخرى.' : 'Failed to update user. Please try again.',
    userNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على المستخدم.' : 'User not found.',
    loadingUser: effectiveLang === 'ar' ? 'جار تحميل بيانات المستخدم...' : 'Loading user data...',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',

    fullNameLabel: effectiveLang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    usernameLabel: effectiveLang === 'ar' ? 'اسم المستخدم (للدخول)' : 'Username (for login)',
    passwordLabel: effectiveLang === 'ar' ? 'كلمة المرور (اتركها فارغة لعدم التغيير)' : 'Password (leave blank to keep unchanged)',
    passwordMinLength: effectiveLang === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل إذا تم تغييرها' : 'Password must be at least 6 characters if changed',

    branchLabel: effectiveLang === 'ar' ? 'الفرع الأساسي' : 'Primary Branch',
    branchPlaceholder: effectiveLang === 'ar' ? 'اختر الفرع الأساسي' : 'Select Primary Branch',
    branchRequired: effectiveLang === 'ar' ? 'الفرع مطلوب (إذا لم يكن بائعًا فقط ولم يتم تحديد الوصول لجميع الفروع)' : 'Branch is required (if not a seller and not all branches access)',
    noBranchesAvailable: effectiveLang === 'ar' ? 'لا توجد فروع متاحة حاليًا.' : 'No branches available currently.',

    isSellerLabel: effectiveLang === 'ar' ? 'هل هذا المستخدم بائع؟' : 'Is this user a salesperson?',
    isSellerDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيتم تصنيف هذا المستخدم كبائع ويمكن اختياره في الطلبات. يمكن للبائعين تسجيل الدخول والحصول على صلاحيات مثل المستخدمين العاديين.' : 'If checked, this user will be classified as a salesperson and can be selected in orders. Sellers can log in and have permissions like regular users.',
    
    accessAllBranchesLabel: effectiveLang === 'ar' ? 'منح صلاحية الوصول لجميع الفروع؟' : 'Grant access to all branches?',
    accessAllBranchesDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيتمكن هذا المستخدم من رؤية بيانات جميع الفروع والتصرف نيابة عنها. سيتم تجاهل اختيار الفرع المحدد إذا كان هذا الخيار مفعلًا.' : 'If checked, user can view data from all branches and act on their behalf. Specific branch selection will be ignored if this is active.',

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
    fullNameRequired: 'Full name is required',

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
    username: z.string().optional(),
    password: z.string().optional().refine(val => !val || val.length >= 6, { message: t.passwordMinLength }),
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

  useEffect(() => {
    if (userId) {
      setUserLoading(true);
      const fetchUser = async () => {
        const userRef = ref(database, `users/${userId}`);
        const docSnap = await get(userRef);
        if (docSnap.exists()) {
          const userData = { id: userId, ...docSnap.val() } as User;
          setExistingUser(userData);
          form.reset({
            fullName: userData.fullName,
            username: userData.username,
            password: '',
            branchId: userData.branchId || undefined,
            isSeller: userData.isSeller || false,
            accessAllBranches: userData.permissions?.includes('view_all_branches') || false,
            permissions: userData.permissions || [],
          });
        } else {
          toast({ title: t.userNotFound, variant: "destructive" });
          router.push(`/${effectiveLang}/users`);
        }
        setUserLoading(false);
      };
      fetchUser();
    }
  }, [userId, form, effectiveLang, router, t.userNotFound, toast]);


  const [isSaving, setIsSaving] = React.useState(false);
  const isSellerWatcher = form.watch('isSeller');
  const accessAllBranchesWatcher = form.watch('accessAllBranches');

  useEffect(() => {
    if (accessAllBranchesWatcher) {
      form.setValue('branchId', undefined);
      form.clearErrors('branchId');
    }
  }, [accessAllBranchesWatcher, form]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!existingUser) return;
    setIsSaving(true);

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
    const uniqueFinalPermissions = Array.from(new Set(finalPermissions));

    const selectedBranch = (!data.accessAllBranches && data.branchId)
                            ? branches.find(b => b.id === data.branchId)
                            : undefined;

    const userDataToUpdate: Partial<User> & { updatedAt?: any } = {
      fullName: data.fullName.trim(),
      isSeller: data.isSeller,
      branchId: data.accessAllBranches ? null : (data.branchId || null),
      branchName: data.accessAllBranches ? null : (selectedBranch?.name || null),
      permissions: uniqueFinalPermissions,
      updatedAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for Realtime DB
    };

    if (data.password && data.password.trim() !== "") {
      userDataToUpdate.password = data.password;
    }

    try {
      // Clean undefined values before updating
      const cleanUserData = Object.fromEntries(
        Object.entries(userDataToUpdate).filter(([, value]) => value !== undefined)
      );

      const userRef = ref(database, `users/${existingUser.id}`);
      await update(userRef, cleanUserData);
      toast({
        title: t.userUpdatedSuccess,
        description: `${data.fullName} ${effectiveLang === 'ar' ? 'تم تحديث بياناته بنجاح.' : 'details have been updated.'}`,
      });
      const updatedDocSnap = await get(userRef);
      if (updatedDocSnap.exists()) {
        const updatedUserData = { id: existingUser.id, ...updatedDocSnap.val() } as User;
        setExistingUser(updatedUserData);
        form.reset({
            fullName: updatedUserData.fullName,
            username: updatedUserData.username,
            password: '',
            branchId: updatedUserData.branchId || undefined,
            isSeller: updatedUserData.isSeller || false,
            accessAllBranches: updatedUserData.permissions?.includes('view_all_branches') || false,
            permissions: updatedUserData.permissions || [],
        });
      }
    } catch (error) {
      console.error("Error updating user: ", error);
      toast({ title: t.userUpdatedError, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getPermissionLabel = (permissionId: PermissionString) => {
    const key = `perm_${permissionId}` as keyof typeof t;
    return t[key] || permissionId.replace(/_/g, ' ');
  };


  if (authIsLoading || !loggedInUserPermissions || userLoading || branchesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">
          {authIsLoading ? t.loadingPage : userLoading ? t.loadingUser : t.loadingBranches}
        </p>
      </div>
    );
  }

  if (!currentHasPermission('users_manage')) {
    return <p>{effectiveLang === 'ar' ? 'ليس لديك الصلاحية لهذه الصفحة.' : 'You do not have permission for this page.'}</p>;
  }

  if (!existingUser && !userLoading) {
    return (
      <div className="space-y-8 text-center py-12">
        <PageTitle>{t.pageTitle}</PageTitle>
        <p className="text-xl text-muted-foreground">{t.userNotFound}</p>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/users`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToUsers}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}: {existingUser?.fullName}</PageTitle>
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
                <UserCog className="h-6 w-6 text-primary" />
                <CardTitle>{effectiveLang === 'ar' ? 'البيانات الأساسية والفرع' : 'Basic Information & Branch'}</CardTitle>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>{t.usernameLabel}</FormLabel>
                <FormControl>
                  <Input value={existingUser?.username || ''} disabled readOnly />
                </FormControl>
                <FormDescription>{effectiveLang === 'ar' ? 'اسم المستخدم لا يمكن تغييره.' : 'Username cannot be changed.'}</FormDescription>
              </FormItem>
              <FormField
                control={form.control}
                name="isSeller"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={existingUser?.isSeller}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t.isSellerLabel}</FormLabel>
                      <FormDescription>
                        {t.isSellerDescription}
                        {existingUser?.isSeller && <span className="block text-destructive text-xs">{effectiveLang === 'ar' ? 'لا يمكن تغيير هذا الحقل لمستخدم بائع حالي.' : 'This field cannot be changed for an existing seller user.'}</span>}
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.passwordLabel}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} autoComplete="new-password" />
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
                                  const currentPermissions = field.value || [];
                                  return checked
                                    ? field.onChange([...currentPermissions, permissionId])
                                    : field.onChange(
                                        currentPermissions.filter(
                                          (value) => value !== permissionId
                                        )
                                      );
                                }}
                                  disabled={isSellerWatcher}
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
                  <Save className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saving}
                </>
              ) : (
                <>
                  <Save className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveChanges}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
