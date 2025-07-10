
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { PageTitle } from '@/components/shared/PageTitle';
import { ArrowLeft, PlusCircle, Save, PackagePlus, Loader, UploadCloud, Image as ImageIcon, Globe, Settings } from 'lucide-react';
import type { ProductTypeDefinition, ProductCategory, ProductSize, Product, ProductStatus, Branch } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, get, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { productCategoryValues, productSizeValues } from '@/lib/mock-data';
import { ManageProductTypesDialog } from '@/components/products/ManageProductTypesDialog';

export default function AddNewProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductTypeDefinition[]>([]);
  const [productTypesLoading, setProductTypesLoading] = useState(true);
  const [isManageTypesDialogOpen, setIsManageTypesDialogOpen] = useState(false);


  useEffect(() => {
    if (!authIsLoading && !hasPermission('products_add')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لإضافة منتجات.' : 'You do not have permission to add products.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/products`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast]);

  const fetchAllProductTypes = async () => {
    setProductTypesLoading(true);
    try {
      const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
      const docSnap = await get(typesConfigRef);
      if (docSnap.exists()) {
        setProductTypes(docSnap.val().types || []);
      } else {
        setProductTypes([]); // Initialize if doesn't exist
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      toast({ title: effectiveLang === 'ar' ? 'خطأ في جلب أنواع المنتجات' : 'Error fetching product types', variant: 'destructive' });
    } finally {
      setProductTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProductTypes();

    const fetchBranches = async () => {
      if (!hasPermission('products_add')) return;
      setBranchesLoading(true);
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
        console.error("Error fetching branches:", error);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, [hasPermission]);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إضافة منتج جديد' : 'Add New Product',
    pageDescription: effectiveLang === 'ar' ? 'املأ التفاصيل أدناه لإنشاء منتج جديد.' : 'Fill in the details below to create a new product.',
    backToProducts: effectiveLang === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products',
    saveProduct: effectiveLang === 'ar' ? 'حفظ المنتج' : 'Save Product',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    productSavedSuccess: effectiveLang === 'ar' ? 'تم حفظ المنتج بنجاح!' : 'Product saved successfully!',
    productSavedError: effectiveLang === 'ar' ? 'فشل حفظ المنتج. حاول مرة أخرى.' : 'Failed to save product. Please try again.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    nameLabel: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    namePlaceholder: effectiveLang === 'ar' ? 'مثال: فستان سهرة أنيق' : 'e.g., Elegant Evening Gown',
    nameRequired: effectiveLang === 'ar' ? 'اسم المنتج مطلوب' : 'Product name is required',
    typeLabel: effectiveLang === 'ar' ? 'نوع المنتج' : 'Product Type',
    typePlaceholder: effectiveLang === 'ar' ? 'اختر النوع' : 'Select type',
    typeRequired: effectiveLang === 'ar' ? 'نوع المنتج مطلوب' : 'Product type is required',
    manageProductTypesButton: effectiveLang === 'ar' ? 'إدارة الأنواع' : 'Manage Types',
    loadingTypes: effectiveLang === 'ar' ? 'جار تحميل الأنواع...' : 'Loading types...',
    noTypesAvailable: effectiveLang === 'ar' ? 'لا توجد أنواع متاحة. أضف نوعًا جديدًا.' : 'No types available. Add a new type.',
    // suit: effectiveLang === 'ar' ? 'بدلة' : 'Suit', (Removed as types are dynamic)
    // dress: effectiveLang === 'ar' ? 'فستان' : 'Dress', (Removed)
    categoryLabel: effectiveLang === 'ar' ? 'فئة المنتج' : 'Product Category',
    categoryPlaceholder: effectiveLang === 'ar' ? 'اختر الفئة' : 'Select category',
    categoryRequired: effectiveLang === 'ar' ? 'فئة المنتج مطلوبة' : 'Product category is required',
    rental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    sale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    sizeLabel: effectiveLang === 'ar' ? 'المقاس' : 'Size',
    sizePlaceholder: effectiveLang === 'ar' ? 'اختر المقاس' : 'Select size',
    sizeRequired: effectiveLang === 'ar' ? 'المقاس مطلوب' : 'Size is required',
    initialStockLabel: effectiveLang === 'ar' ? 'الكمية الأولية' : 'Initial Stock',
    initialStockPlaceholder: effectiveLang === 'ar' ? 'أدخل الكمية الأولية للمنتج' : 'Enter initial stock quantity',
    initialStockRequired: effectiveLang === 'ar' ? 'الكمية الأولية مطلوبة' : 'Initial stock is required',
    initialStockMin: effectiveLang === 'ar' ? 'يجب أن تكون الكمية الأولية صفرًا أو أكثر' : 'Initial stock must be zero or more',
    priceLabel: effectiveLang === 'ar' ? 'السعر' : 'Price',
    pricePlaceholder: effectiveLang === 'ar' ? 'مثال: 250.00' : 'e.g., 250.00',
    priceRequired: effectiveLang === 'ar' ? 'السعر مطلوب' : 'Price is required',
    pricePositive: effectiveLang === 'ar' ? 'يجب أن يكون السعر رقمًا موجبًا' : 'Price must be a positive number',
    imageLabel: effectiveLang === 'ar' ? 'صورة المنتج (اختياري)' : 'Product Image (Optional)',
    selectImageButton: effectiveLang === 'ar' ? 'اختر صورة' : 'Select Image',
    changeImageButton: effectiveLang === 'ar' ? 'تغيير الصورة' : 'Change Image',
    imageUploadInProgress: effectiveLang === 'ar' ? 'جار رفع الصورة...' : 'Uploading image...',
    imageUploadError: effectiveLang === 'ar' ? 'فشل رفع الصورة.' : 'Image upload failed.',
    descriptionLabel: effectiveLang === 'ar' ? 'وصف المنتج' : 'Description',
    descriptionPlaceholder: effectiveLang === 'ar' ? 'أدخل وصفًا تفصيليًا للمنتج...' : 'Enter a detailed description of the product...',
    descriptionRequired: effectiveLang === 'ar' ? 'وصف المنتج مطلوب' : 'Description is required',
    descriptionMinLength: effectiveLang === 'ar' ? 'يجب أن يكون الوصف 10 أحرف على الأقل' : 'Description must be at least 10 characters',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: effectiveLang === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...',
    aiHintLabel: effectiveLang === 'ar' ? 'تلميح للصور بالذكاء الاصطناعي (اختياري)' : 'AI Image Hint (Optional)',
    aiHintPlaceholder: effectiveLang === 'ar' ? 'مثال: فستان أحمر طويل' : 'e.g., long red dress',
    branchLabel: effectiveLang === 'ar' ? 'الفرع الأساسي للمنتج' : 'Product Primary Branch',
    branchRequired: effectiveLang === 'ar' ? 'الفرع مطلوب للمنتج إذا لم يكن عامًا.' : 'Branch is required if product is not global.',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',
    selectBranchPlaceholder: effectiveLang === 'ar' ? 'اختر فرع المنتج' : 'Select product branch',
    noBranchesAvailable: effectiveLang === 'ar' ? 'لا توجد فروع متاحة' : 'No branches available',
    productCodeGenerationError: effectiveLang === 'ar' ? 'خطأ في إنشاء كود المنتج' : 'Error generating product code',
    isGlobalProductLabel: effectiveLang === 'ar' ? 'عرض المنتج في جميع الفروع؟' : 'Make product visible in all branches?',
    isGlobalProductDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيكون المنتج متاحًا للعرض والطلب من أي فرع. يمكن تحديد فرع أساسي لأغراض تنظيمية.' : 'If checked, this product will be visible and orderable from any branch. A primary branch can be set for organizational purposes.',
  };


  const FormSchema = z.object({
    name: z.string().min(1, { message: t.nameRequired }),
    type: z.string().min(1, { message: t.typeRequired }), // Type is now string (ID)
    category: z.enum(productCategoryValues as [ProductCategory, ...ProductCategory[]], { required_error: t.categoryRequired }),
    size: z.enum(productSizeValues as [ProductSize, ...ProductSize[]], { required_error: t.sizeRequired }),
    initialStock: z.coerce.number({invalid_type_error: t.initialStockRequired, required_error: t.initialStockRequired}).int().min(0, { message: t.initialStockMin }),
    price: z.coerce.number().positive({ message: t.pricePositive }).min(0.01, { message: t.priceRequired }),
    imageUrl: z.string().optional(),
    description: z.string().min(10, { message: t.descriptionMinLength }),
    notes: z.string().optional(),
    dataAiHint: z.string().optional(),
    branchId: z.string().optional(),
    isGlobalProduct: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    if (!data.isGlobalProduct && hasPermission('view_all_branches') && (!data.branchId || data.branchId.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.branchRequired,
        path: ["branchId"],
      });
    }
  });


  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      category: undefined,
      size: undefined,
      initialStock: 0,
      price: undefined,
      imageUrl: '',
      description: '',
      notes: '',
      dataAiHint: '',
      branchId: (currentUser?.branchId && !hasPermission('view_all_branches')) ? currentUser.branchId : undefined,
      isGlobalProduct: false,
    },
  });

  React.useEffect(() => {
      if (currentUser?.branchId && !hasPermission('view_all_branches') && !form.getValues('isGlobalProduct')) {
        form.setValue('branchId', currentUser.branchId);
      }
  }, [currentUser, hasPermission, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      form.setValue('imageUrl', 'file_selected');
      form.clearErrors('imageUrl');
    } else {
      setImageFile(null);
      setImagePreview(null);
      form.setValue('imageUrl', '');
    }
  };

  const uploadImageLocally = async (file: File, productIdForPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productIdForPath);

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setIsUploading(false);
        setUploadProgress(null);

        if (data.success) {
          resolve(data.imageUrl);
        } else {
          reject(new Error(data.error || 'Upload failed'));
        }
      })
      .catch(error => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(null);
        reject(error);
      });
    });
  };


  const [isSaving, setIsSaving] = React.useState(false);
  const isGlobalProductWatcher = form.watch('isGlobalProduct');

  React.useEffect(() => {
    if (isGlobalProductWatcher) {
      if (hasPermission('view_all_branches')) {
        form.clearErrors('branchId');
      } else {
        form.setValue('branchId', undefined);
        form.clearErrors('branchId');
      }
    } else {
      if (hasPermission('view_all_branches')) {
        if (!form.getValues('branchId')) {
            form.trigger('branchId');
        }
      } else if (currentUser?.branchId) {
        form.setValue('branchId', currentUser.branchId);
        form.clearErrors('branchId');
      } else {
        form.setError('branchId', { type: 'manual', message: t.branchRequired + " (User branch not found)" });
      }
    }
  }, [isGlobalProductWatcher, form, hasPermission, currentUser, t.branchRequired]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSaving(true);
    let finalImageUrl = 'https://placehold.co/600x400.png';

    // Generate new product ID using push
    const productsRef = ref(database, "products");
    const newProductRef = push(productsRef);
    const newProductIdForPath = newProductRef.key!;

    if (imageFile) {
      try {
        finalImageUrl = await uploadImageLocally(imageFile, newProductIdForPath);
      } catch (error) {
        toast({ title: t.imageUploadError, variant: "destructive" });
        setIsSaving(false);
        return;
      }
    }

    let productDataToSave: Omit<Product, 'id'>;

    try {
      // Get and update product code counter
      const counterRef = ref(database, "system_settings/productCodeConfig");
      const counterSnap = await get(counterRef);
      let nextCode: number;

      if (!counterSnap.exists() || !counterSnap.val() || typeof counterSnap.val()?.nextProductCode !== 'number') {
        console.warn("Product code config missing or invalid. Initializing to 90000001.");
        nextCode = 90000001;
        await set(counterRef, { nextProductCode: nextCode + 1 });
      } else {
        nextCode = counterSnap.val().nextProductCode;
        await update(counterRef, { nextProductCode: nextCode + 1 });
      }
      const productCodeString = String(nextCode);

      const productStatus: ProductStatus = 'Available';

      let finalBranchId: string | undefined = undefined;
      let finalBranchName: string | undefined = undefined;

      if (data.isGlobalProduct) {
        if (hasPermission('view_all_branches') && data.branchId) {
            finalBranchId = data.branchId;
            finalBranchName = availableBranches.find(b => b.id === data.branchId)?.name;
        }
      } else {
        if (hasPermission('view_all_branches')) {
            finalBranchId = data.branchId;
            finalBranchName = availableBranches.find(b => b.id === data.branchId)?.name;
        } else if (currentUser?.branchId) {
            finalBranchId = currentUser.branchId;
            finalBranchName = currentUser.branchName;
        }
        if (!finalBranchId) {
            throw new Error(t.branchRequired + (effectiveLang === 'ar' ? " (خطأ في تحديد الفرع)" : " (Branch assignment error)"));
        }
         if (!finalBranchName && finalBranchId) {
            const branchRef = ref(database, `branches/${finalBranchId}`);
            const branchDoc = await get(branchRef);
            if (branchDoc.exists()) finalBranchName = branchDoc.val()?.name;
        }
      }

      productDataToSave = {
        productCode: productCodeString,
        name: data.name,
        type: data.type, // Store the type ID
        category: data.category,
        size: data.size,
        price: data.price,
        imageUrl: finalImageUrl,
        description: data.description,
        initialStock: data.initialStock,
        quantityInStock: data.initialStock,
        quantityRented: 0,
        quantitySold: 0,
        status: productStatus,
        notes: data.notes?.trim() ? data.notes.trim() : undefined,
        "data-ai-hint": data.dataAiHint?.trim() ? data.dataAiHint.trim() : undefined,
        branchId: finalBranchId,
        branchName: finalBranchName,
        isGlobalProduct: data.isGlobalProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const cleanProductData = Object.fromEntries(
        Object.entries(productDataToSave).filter(([, value]) => value !== undefined)
      ) as Omit<Product, 'id'>;

      // Save the product to Realtime Database
      await set(newProductRef, cleanProductData);

      toast({
        title: t.productSavedSuccess,
        description: `${(cleanProductData.name || 'Product')} ${effectiveLang === 'ar' ? 'أضيف بنجاح برقم كود' : 'has been added with code'}: ${productCodeString}.`,
      });

      // Reset form with proper default values
      const defaultValues = {
        name: '',
        type: undefined,
        category: undefined,
        size: undefined,
        initialStock: 0,
        price: undefined,
        imageUrl: '',
        description: '',
        notes: '',
        dataAiHint: '',
        branchId: (currentUser?.branchId && !hasPermission('view_all_branches')) ? currentUser.branchId : undefined,
        isGlobalProduct: false,
      };

      form.reset(defaultValues);

      // Reset image state
      setImageFile(null);
      setImagePreview(null);
      setIsUploading(false);
      setUploadProgress(null);

      // Reset file input element with a small delay to ensure DOM is updated
      setTimeout(() => {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        // Force re-trigger validation for required fields if needed
        if (currentUser?.branchId && !hasPermission('view_all_branches')) {
          form.setValue('branchId', currentUser.branchId);
        }
      }, 100);
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: t.productSavedError,
        description: error.message || t.productSavedError,
        variant: "destructive",
      });

      // Reset upload states in case of error
      setIsUploading(false);
      setUploadProgress(null);
    } finally {
      setIsSaving(false);
    }
  };


  const getProductCategoryDisplay = (categoryValue: ProductCategory) => {
    if (categoryValue === 'Rental') return t.rental;
    if (categoryValue === 'Sale') return t.sale;
    return categoryValue;
  };

  if (authIsLoading || !hasPermission('products_add')) {
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
          <Link href={`/${effectiveLang}/products`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToProducts}
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <PackagePlus className="h-6 w-6 text-primary" />
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.priceLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder={t.pricePlaceholder} {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t.typeLabel}</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsManageTypesDialogOpen(true)}>
                        <Settings className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" /> {t.manageProductTypesButton}
                      </Button>
                    </div>
                     {productTypesLoading ? (
                         <div className="flex items-center text-sm text-muted-foreground">
                            <Loader className="mr-2 h-4 w-4 animate-spin" /> {t.loadingTypes}
                        </div>
                    ) : (
                    <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'} disabled={productTypes.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={productTypes.length === 0 ? t.noTypesAvailable : t.typePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map(typeDef => (
                          <SelectItem key={typeDef.id} value={typeDef.id}>
                            {effectiveLang === 'ar' ? typeDef.name_ar : typeDef.name}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.categoryLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.categoryPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategoryValues.map(catVal => (
                          <SelectItem key={catVal} value={catVal}>{getProductCategoryDisplay(catVal)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sizeLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.sizePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productSizeValues.map(sizeVal => (
                          <SelectItem key={sizeVal} value={sizeVal}>{sizeVal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.initialStockLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder={t.initialStockPlaceholder} {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                  control={form.control}
                  name="isGlobalProduct"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 rtl:space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                          {t.isGlobalProductLabel}
                        </FormLabel>
                        <FormDescription>{t.isGlobalProductDescription}</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

               <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.branchLabel}</FormLabel>
                     <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                        disabled={branchesLoading || (!hasPermission('view_all_branches') && !!currentUser?.branchId && !isGlobalProductWatcher) }
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            (!hasPermission('view_all_branches') && currentUser?.branchName && !isGlobalProductWatcher)
                            ? currentUser.branchName
                            : (isGlobalProductWatcher && !hasPermission('view_all_branches'))
                              ? (effectiveLang === 'ar' ? 'سيتم تجاهل الفرع للمنتج العالمي' : 'Branch ignored for global product')
                              : branchesLoading ? t.loadingBranches : t.selectBranchPlaceholder
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branchesLoading ? (
                            <SelectItem value="loading" disabled>{t.loadingBranches}</SelectItem>
                        ) : availableBranches.length === 0 ? (
                            <SelectItem value="no-branches" disabled>{t.noBranchesAvailable}</SelectItem>
                        ) : (
                          availableBranches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {isGlobalProductWatcher && !hasPermission('view_all_branches') && (
                        <FormDescription className="text-xs text-muted-foreground">
                            {effectiveLang === 'ar' ? 'سيتم تطبيق المنتج كـ "عالمي" بغض النظر عن هذا الاختيار.' : 'Product will be global regardless of this selection.'}
                        </FormDescription>
                    )}
                  </FormItem>
                )}
              />

              <FormItem className="md:col-span-2">
                <FormLabel>{t.imageLabel}</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4 rounded-md border border-dashed border-muted-foreground/50 p-6 hover:border-primary transition-colors">
                    {imagePreview ? (
                      <div className="relative w-40 h-40 group">
                        <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="product preview" />
                        <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('imageUploadInput')?.click()} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.changeImageButton}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('imageUploadInput')?.click()}>
                          <ImageIcon className="mr-2 h-4 w-4" /> {t.selectImageButton}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">{effectiveLang === 'ar' ? 'اسحب وأفلت أو انقر للاختيار' : 'Drag & drop or click to select'}</p>
                      </div>
                    )}
                    <Input
                      id="imageUploadInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </FormControl>
                {uploadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{t.imageUploadInProgress} {uploadProgress.toFixed(0)}%</p>
                  </div>
                )}
                 <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => ( <Input type="hidden" {...field} /> )}
                  />
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.descriptionLabel}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.descriptionPlaceholder} rows={4} {...field} />
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
                      <Textarea placeholder={t.notesPlaceholder} rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t.aiHintLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.aiHintPlaceholder} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || isUploading || productTypesLoading}>
                {isSaving || isUploading ? (
                  <>
                    <Loader className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {isUploading ? t.imageUploadInProgress.split('...')[0] : t.saving}
                  </>
                ) : (
                  <>
                    <PlusCircle className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveProduct}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      <ManageProductTypesDialog
        isOpen={isManageTypesDialogOpen}
        setIsOpen={setIsManageTypesDialogOpen}
        onTypeAdded={fetchAllProductTypes}
        lang={effectiveLang}
      />
    </div>
  );
}
