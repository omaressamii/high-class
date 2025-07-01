
'use client';

import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Save, Loader, Edit3, UploadCloud, Image as ImageIcon, ScanBarcode, Globe, Settings } from 'lucide-react';
import type { ProductTypeDefinition, ProductCategory, ProductSize, Product, ProductStatus, Branch } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { productCategoryValues, productSizeValues, productStatusValues } from '@/lib/mock-data'; // productTypeValues removed
import { ManageProductTypesDialog } from '@/components/products/ManageProductTypesDialog';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();

  const pageLang = params.lang as 'ar' | 'en';
  const productId = params.productId as string;
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductTypeDefinition[]>([]);
  const [productTypesLoading, setProductTypesLoading] = useState(true);
  const [isManageTypesDialogOpen, setIsManageTypesDialogOpen] = useState(false);

  const fetchAllProductTypes = async () => {
    setProductTypesLoading(true);
    try {
      const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
      const docSnap = await get(typesConfigRef);
      if (docSnap.exists()) {
        setProductTypes(docSnap.val().types || []);
      } else {
        setProductTypes([]);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      toast({ title: t.loadingTypes, variant: 'destructive' });
    } finally {
      setProductTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProductTypes();
    const fetchBranches = async () => {
      if (!hasPermission('products_edit')) return;
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
        toast({ title: t.loadingBranches, description: (error as Error).message, variant: 'destructive' });
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, [hasPermission]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تعديل المنتج' : 'Edit Product',
    pageDescription: effectiveLang === 'ar' ? 'قم بتحديث تفاصيل المنتج أدناه.' : 'Update the product details below.',
    backToProduct: effectiveLang === 'ar' ? 'العودة إلى المنتج' : 'Back to Product',
    saveChanges: effectiveLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    productUpdatedSuccess: effectiveLang === 'ar' ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!',
    productUpdateError: effectiveLang === 'ar' ? 'فشل تحديث المنتج. حاول مرة أخرى.' : 'Failed to update product. Please try again.',
    productNotFoundError: effectiveLang === 'ar' ? 'لم يتم العثور على المنتج.' : 'Product not found.',
    loadingProduct: effectiveLang === 'ar' ? 'جار تحميل المنتج...' : 'Loading product...',
    nameLabel: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    productCodeLabel: effectiveLang === 'ar' ? 'كود الصنف (غير قابل للتعديل)' : 'Product Code (cannot be changed)',
    typeLabel: effectiveLang === 'ar' ? 'نوع المنتج' : 'Product Type',
    manageProductTypesButton: effectiveLang === 'ar' ? 'إدارة الأنواع' : 'Manage Types',
    loadingTypes: effectiveLang === 'ar' ? 'جار تحميل الأنواع...' : 'Loading types...',
    noTypesAvailable: effectiveLang === 'ar' ? 'لا توجد أنواع. أضف نوعًا.' : 'No types. Add new.',
    categoryLabel: effectiveLang === 'ar' ? 'فئة المنتج' : 'Product Category',
    sizeLabel: effectiveLang === 'ar' ? 'المقاس' : 'Size',
    statusLabel: effectiveLang === 'ar' ? 'الحالة' : 'Status',
    initialStockLabel: effectiveLang === 'ar' ? 'الكمية الأولية' : 'Initial Stock',
    priceLabel: effectiveLang === 'ar' ? 'السعر' : 'Price',
    imageLabel: effectiveLang === 'ar' ? 'صورة المنتج' : 'Product Image',
    selectNewImageButton: effectiveLang === 'ar' ? 'اختيار صورة جديدة' : 'Select New Image',
    changeImageButton: effectiveLang === 'ar' ? 'تغيير الصورة' : 'Change Image',
    currentImage: effectiveLang === 'ar' ? 'الصورة الحالية' : 'Current Image',
    imageUploadInProgress: effectiveLang === 'ar' ? 'جار رفع الصورة...' : 'Uploading image...',
    imageUploadError: effectiveLang === 'ar' ? 'فشل رفع الصورة.' : 'Image upload failed.',
    imageUrlRequired: effectiveLang === 'ar' ? 'صورة المنتج مطلوبة.' : 'Product image is required.',
    descriptionLabel: effectiveLang === 'ar' ? 'وصف المنتج' : 'Description',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    aiHintLabel: effectiveLang === 'ar' ? 'تلميح للصور بالذكاء الاصطناعي (اختياري)' : 'AI Image Hint (Optional)',
    nameRequired: effectiveLang === 'ar' ? 'اسم المنتج مطلوب' : 'Product name is required',
    typeRequired: effectiveLang === 'ar' ? 'نوع المنتج مطلوب' : 'Product type is required',
    categoryRequired: effectiveLang === 'ar' ? 'فئة المنتج مطلوبة' : 'Product category is required',
    sizeRequired: effectiveLang === 'ar' ? 'المقاس مطلوب' : 'Size is required',
    statusRequired: effectiveLang === 'ar' ? 'الحالة مطلوبة' : 'Status is required',
    initialStockMin: effectiveLang === 'ar' ? 'يجب أن تكون الكمية الأولية صفرًا أو أكثر' : 'Initial stock must be zero or more',
    priceRequired: effectiveLang === 'ar' ? 'السعر مطلوب' : 'Price is required',
    pricePositive: effectiveLang === 'ar' ? 'يجب أن يكون السعر رقمًا موجبًا' : 'Price must be a positive number',
    descriptionMinLength: effectiveLang === 'ar' ? 'يجب أن يكون الوصف 10 أحرف على الأقل' : 'Description must be at least 10 characters',
    categoryRental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    categorySale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    statusAvailable: effectiveLang === 'ar' ? 'متوفر' : 'Available',
    statusRented: effectiveLang === 'ar' ? 'مستأجر' : 'Rented',
    statusSold: effectiveLang === 'ar' ? 'مباع' : 'Sold',
    branchLabel: effectiveLang === 'ar' ? 'الفرع الأساسي للمنتج' : 'Product Primary Branch',
    branchRequired: effectiveLang === 'ar' ? 'الفرع مطلوب للمنتج إذا لم يكن عامًا.' : 'Branch is required if product is not global.',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',
    selectBranchPlaceholder: effectiveLang === 'ar' ? 'اختر فرع المنتج' : 'Select product branch',
    noBranchesAvailable: effectiveLang === 'ar' ? 'لا توجد فروع متاحة' : 'No branches available',
    isGlobalProductLabel: effectiveLang === 'ar' ? 'عرض المنتج في جميع الفروع؟' : 'Make product visible in all branches?',
    isGlobalProductDescription: effectiveLang === 'ar' ? 'إذا تم تحديده، سيكون المنتج متاحًا للعرض والطلب من أي فرع.' : 'If checked, this product will be visible and orderable from any branch.',
  };

  const currentFormSchema = z.object({
    name: z.string().min(1, { message: t.nameRequired }),
    type: z.string().min(1, {message: t.typeRequired}), // ProductType is now string (ID)
    category: z.enum(productCategoryValues, { required_error: t.categoryRequired }),
    size: z.enum(productSizeValues, { required_error: t.sizeRequired }),
    status: z.enum(productStatusValues, { required_error: t.statusRequired }),
    initialStock: z.coerce.number().int().min(0, { message: t.initialStockMin }),
    price: z.coerce.number().positive({ message: t.pricePositive }).min(0.01, { message: t.priceRequired }),
    imageUrl: z.string().min(1, { message: t.imageUrlRequired }), // Image is optional on creation, but must exist for edit
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

  type FormData = z.infer<typeof currentFormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      name: '', type: undefined, category: undefined, size: undefined, status: undefined,
      initialStock: 0, price: undefined, imageUrl: '', description: '',
      notes: '', dataAiHint: '', branchId: undefined, isGlobalProduct: false,
    },
  });

  useEffect(() => {
    if (!authIsLoading && !hasPermission('products_edit')) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to edit products.",
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}/products/${productId}`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, productId, toast]);

  useEffect(() => {
    if (productId) {
      setIsLoadingData(true);
      const fetchProduct = async () => {
        const productRef = ref(database, `products/${productId}`);
        const docSnap = await get(productRef);
        if (docSnap.exists()) {
          const data = docSnap.val() as Omit<Product, 'id'>;
          const fetchedProduct: Product = { id: productId, productCode: String(data.productCode || ''), ...data };
          setProduct(fetchedProduct);
          setCurrentImageUrl(fetchedProduct.imageUrl);
          setImagePreview(fetchedProduct.imageUrl);
          form.reset({
            name: fetchedProduct.name,
            type: fetchedProduct.type, // This is the type ID
            category: fetchedProduct.category,
            size: fetchedProduct.size,
            status: fetchedProduct.status,
            initialStock: fetchedProduct.initialStock,
            price: fetchedProduct.price,
            imageUrl: fetchedProduct.imageUrl,
            description: fetchedProduct.description,
            notes: fetchedProduct.notes || '',
            dataAiHint: fetchedProduct['data-ai-hint'] || '',
            branchId: fetchedProduct.branchId || undefined,
            isGlobalProduct: fetchedProduct.isGlobalProduct || false,
          });
        } else {
          toast({ title: t.productNotFoundError, variant: 'destructive' });
          router.push(`/${effectiveLang}/products`);
        }
        setIsLoadingData(false);
      };
      fetchProduct();
    }
  }, [productId, effectiveLang, router, toast, form, t.productNotFoundError]);

  const isGlobalProductWatcher = form.watch('isGlobalProduct');

  useEffect(() => {
    if (isGlobalProductWatcher) {
      form.clearErrors('branchId');
    } else if (!form.getValues('branchId') && hasPermission('view_all_branches')) {
      form.trigger('branchId');
    }
  }, [isGlobalProductWatcher, form, hasPermission]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      form.setValue('imageUrl', 'new_file_selected');
      form.clearErrors('imageUrl');
    } else {
      setImageFile(null);
      setImagePreview(currentImageUrl);
      if (currentImageUrl) {
        form.setValue('imageUrl', currentImageUrl);
      } else {
        form.setValue('imageUrl', '');
      }
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

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

  const deleteOldImage = async (imageUrlToDelete: string) => {
    // For GitHub storage, we can delete the old image
    if (imageUrlToDelete && imageUrlToDelete.includes('raw.githubusercontent.com')) {
      try {
        const response = await fetch('/api/delete-image', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: imageUrlToDelete }),
        });

        if (!response.ok) {
          console.warn("Failed to delete old image from GitHub:", imageUrlToDelete);
        }
      } catch (error) {
        console.warn("Error deleting old image:", error);
      }
    } else if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
      console.log("Old local image should be cleaned up:", imageUrlToDelete);
    }
  };


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!product) return;
    setIsSaving(true);
    let finalImageUrl = product.imageUrl;

    if (imageFile) {
      if (currentImageUrl && currentImageUrl !== imagePreview && imagePreview !== null) {
        await deleteOldImage(currentImageUrl);
      }
      try {
        finalImageUrl = await uploadImage(imageFile);
      } catch (error) {
        toast({ title: t.imageUploadError, variant: "destructive" });
        setIsSaving(false);
        return;
      }
    } else if (!data.imageUrl && currentImageUrl) {
        finalImageUrl = product.imageUrl;
    } else if (!data.imageUrl && !currentImageUrl) {
        toast({ title: t.imageUrlRequired, variant: "destructive" });
        setIsSaving(false);
        return;
    }

    let finalBranchId = data.branchId;
    let finalBranchName = product.branchName;

    if (data.isGlobalProduct) {
      if (hasPermission('view_all_branches') && data.branchId) {
          finalBranchId = data.branchId;
          finalBranchName = availableBranches.find(b => b.id === data.branchId)?.name || '';
      } else if (!hasPermission('view_all_branches') && currentUser?.branchId) {
          finalBranchId = currentUser.branchId;
          finalBranchName = currentUser.branchName || '';
      } else {
          finalBranchId = undefined;
          finalBranchName = undefined;
      }
    } else {
        finalBranchId = data.branchId || (currentUser?.branchId && !hasPermission('view_all_branches') ? currentUser.branchId : product.branchId);
        if (!finalBranchId) {
          toast({ title: "Branch Error", description: "Branch ID is missing for a non-global product.", variant: "destructive"});
          setIsSaving(false);
          return;
        }
        finalBranchName = availableBranches.find(b => b.id === finalBranchId)?.name || currentUser?.branchName || product.branchName;
    }

    const productDataToUpdate: Partial<Product> = {
      name: data.name,
      type: data.type, // This is the type ID
      category: data.category,
      size: data.size,
      status: data.status,
      price: data.price,
      imageUrl: finalImageUrl,
      description: data.description,
      initialStock: data.initialStock,
      quantityInStock: data.status === 'Available' ? data.initialStock - (product.quantityRented || 0) : product.quantityInStock,
      notes: data.notes || undefined,
      "data-ai-hint": data.dataAiHint || undefined,
      branchId: finalBranchId,
      branchName: finalBranchName,
      isGlobalProduct: data.isGlobalProduct,
      updatedAt: new Date().toISOString(),
    };

    const cleanProductData = Object.fromEntries(
        Object.entries(productDataToUpdate).filter(([, value]) => value !== undefined)
    ) as Partial<Product>;

    try {
      const productRef = ref(database, `products/${product.id}`);
      await update(productRef, cleanProductData);
      toast({
        title: t.productUpdatedSuccess,
        description: `${data.name} ${effectiveLang === 'ar' ? 'تم تحديثه.' : 'has been updated.'}`,
      });
      setImageFile(null);
      setCurrentImageUrl(finalImageUrl);
      const updatedDocSnap = await get(productRef);
      if (updatedDocSnap.exists()) {
        const updatedProductData = { id: product.id, productCode: String(updatedDocSnap.val().productCode || ''), ...updatedDocSnap.val() } as Product;
        setProduct(updatedProductData);
        form.reset({
            name: updatedProductData.name,
            type: updatedProductData.type,
            category: updatedProductData.category,
            size: updatedProductData.size,
            status: updatedProductData.status,
            initialStock: updatedProductData.initialStock,
            price: updatedProductData.price,
            imageUrl: updatedProductData.imageUrl,
            description: updatedProductData.description,
            notes: updatedProductData.notes || '',
            dataAiHint: updatedProductData['data-ai-hint'] || '',
            branchId: updatedProductData.branchId || undefined,
            isGlobalProduct: updatedProductData.isGlobalProduct || false,
        });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: t.productUpdateError, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getProductCategoryDisplay = (categoryValue: ProductCategory) => {
    if (categoryValue === 'Rental') return t.categoryRental;
    if (categoryValue === 'Sale') return t.categorySale;
    return categoryValue;
  };

  const getProductStatusDisplay = (statusValue?: ProductStatus) => {
    if (!statusValue) return '';
    if (effectiveLang === 'ar') {
      if (statusValue === 'Available') return t.statusAvailable;
      if (statusValue === 'Rented') return t.statusRented;
      if (statusValue === 'Sold') return t.statusSold;
    }
    return statusValue;
  };

  if (authIsLoading || isLoadingData || !hasPermission('products_edit') || productTypesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{authIsLoading ? 'Loading permissions...' : isLoadingData ? t.loadingProduct : t.loadingTypes}</p>
      </div>
    );
  }

  if (!product && !isLoadingData) {
     return <p>{t.productNotFoundError}</p>;
  }

  const selectedProductType = productTypes.find(pt => pt.id === form.getValues('type'));
  const typeDisplayValue = selectedProductType ? (effectiveLang === 'ar' ? selectedProductType.name_ar : selectedProductType.name) : t.typeLabel;


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}: {product?.name}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/products/${productId}`}>
            <ArrowLeft className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.backToProduct}
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
              <FormItem>
                <FormLabel>{t.productCodeLabel}</FormLabel>
                <FormControl>
                  <Input value={product?.productCode || ''} disabled readOnly />
                </FormControl>
                 <FormDescription>
                   {effectiveLang === 'ar' ? 'كود الصنف يتم إنشاؤه تلقائيًا ولا يمكن تعديله.' : 'Product code is auto-generated and cannot be changed.'}
                 </FormDescription>
              </FormItem>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.nameLabel}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} /></FormControl>
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
                      <FormControl><SelectTrigger><SelectValue placeholder={typeDisplayValue} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {productTypes.length === 0 && <SelectItem value="no-types-placeholder" disabled>{t.noTypesAvailable}</SelectItem>}
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
                      <FormControl><SelectTrigger><SelectValue placeholder={field.value ? getProductCategoryDisplay(field.value) : t.categoryLabel} /></SelectTrigger></FormControl>
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
                      <FormControl><SelectTrigger><SelectValue placeholder={field.value} /></SelectTrigger></FormControl>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.statusLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}>
                      <FormControl><SelectTrigger><SelectValue placeholder={field.value ? getProductStatusDisplay(field.value) : t.statusLabel} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {productStatusValues.map(statusVal => (
                          <SelectItem key={statusVal} value={statusVal}>{getProductStatusDisplay(statusVal)}</SelectItem>
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
                    <FormControl><Input type="number" step="1" {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {hasPermission('view_all_branches') && (
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
                )}
               <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className={isGlobalProductWatcher && hasPermission('view_all_branches') ? "md:col-span-2" : ""}>
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
                            !hasPermission('view_all_branches') && currentUser?.branchName
                            ? currentUser.branchName
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
                  </FormItem>
                )}
              />

              <FormItem className="md:col-span-2">
                <FormLabel>{t.imageLabel}</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4 rounded-md border border-dashed border-muted-foreground/50 p-6 hover:border-primary transition-colors">
                    {imagePreview ? (
                      <div className="relative w-40 h-40 group">
                        <Image src={imagePreview} alt={t.currentImage} layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="product preview"/>
                         <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('imageUploadInputEdit')?.click()} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.changeImageButton}
                        </Button>
                      </div>
                    ) : (
                       <div className="flex flex-col items-center text-center">
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('imageUploadInputEdit')?.click()}>
                          <ImageIcon className="mr-2 h-4 w-4" /> {t.selectNewImageButton}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">{effectiveLang === 'ar' ? 'اسحب وأفلت أو انقر للاختيار' : 'Drag & drop or click to select'}</p>
                      </div>
                    )}
                     <Input
                      id="imageUploadInputEdit"
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
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
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
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || isUploading || productTypesLoading}>
                {isSaving || isUploading ? (
                  <><Loader className={`animate-spin ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {isUploading ? t.imageUploadInProgress.split('...')[0] : t.saving}</>
                ) : (
                  <><Save className={`${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t.saveChanges}</>
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
