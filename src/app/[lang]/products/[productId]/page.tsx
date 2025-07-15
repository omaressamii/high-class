
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product, Order, ProductStatus, ProductCategory, TransactionType, OrderStatus, ProductTypeDefinition } from '@/types';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, DollarSign, Tag, Layers, Ruler, Info, Package, PackageCheck, PackageSearch, PackageX, History, Activity, TrendingUp, Repeat, Barcode, Store, Globe } from 'lucide-react';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/lib/firebase';
import { EditProductButton } from '@/components/products/EditProductButton';
import { ProductOrderHistoryTable } from '@/components/products/ProductOrderHistoryTable';
import { PrintBarcodeButton } from '@/components/products/PrintBarcodeButton';
import { ProductDetailsAuthWrapper } from '@/components/products/ProductDetailsAuthWrapper';

interface ProductDetailsPageProps {
  params: { lang: string; productId: string };
}

async function getProductFromRealtimeDB(productId: string): Promise<Product | null> {
  const productRef = ref(database, `products/${productId}`);
  const productSnap = await get(productRef);

  if (productSnap.exists()) {
    const data = productSnap.val();
    return {
        id: productId,
        ...data,
        productCode: String(data.productCode || 'N/A'),
        type: String(data.type || 'unknown'), // type is now string ID
        price: Number(data.price) || 0,
        initialStock: Number(data.initialStock) || 0,
        quantityInStock: Number(data.quantityInStock) || 0,
        quantityRented: Number(data.quantityRented) || 0,
        name: String(data.name || ''),
        category: data.category as ProductCategory || 'Rental',
        size: data.size as Product['size'] || '42',
        status: data.status as ProductStatus || 'Available',
        imageUrl: String(data.imageUrl || 'https://placehold.co/600x400.png'),
        description: String(data.description || ''),
        notes: data.notes ? String(data.notes) : undefined,
        "data-ai-hint": data["data-ai-hint"] ? String(data["data-ai-hint"]) : undefined,
        branchId: data.branchId || undefined,
        branchName: data.branchName || undefined,
        isGlobalProduct: data.isGlobalProduct || false,
    } as Product;
  } else {
    return null;
  }
}

async function getProductTypesFromRealtimeDB(): Promise<ProductTypeDefinition[]> {
  try {
    const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
    const docSnap = await get(typesConfigRef);
    if (docSnap.exists()) {
      const configData = docSnap.val();
      return (configData.types || []) as ProductTypeDefinition[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching product types for ProductDetailsPage:", error);
    return [];
  }
}


async function getRelatedOrdersFromRealtimeDB(productId: string): Promise<Order[]> {
  const ordersRef = ref(database, 'orders');
  const querySnapshot = await get(ordersRef);

  if (!querySnapshot.exists()) {
    return [];
  }

  const ordersData = querySnapshot.val();
  const orders: Order[] = [];

  // Filter orders that contain the productId and sort by orderDate desc
  Object.entries(ordersData).forEach(([id, data]: [string, any]) => {
    // Check if this order contains the product (either in items array or legacy productId field)
    const hasProduct = (data.items && data.items.some((item: any) => item.productId === productId)) ||
                      data.productId === productId;

    if (hasProduct) {
      orders.push({
        id: id,
        items: data.items || [{ productId: data.productId, productName: data.productName, quantity: 1, priceAtTimeOfOrder: data.totalPrice }], // Fallback for old structure
        customerName: data.customerName,
        customerId: data.customerId,
        sellerId: data.sellerId,
        sellerName: data.sellerName,
        processedByUserId: data.processedByUserId,
        processedByUserName: data.processedByUserName,
        transactionType: data.transactionType as TransactionType,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        returnDate: data.returnDate,
        totalPrice: Number(data.totalPrice) || 0,
        paidAmount: Number(data.paidAmount) || 0,
        remainingAmount: Number(data.remainingAmount) || 0,
        status: data.status as OrderStatus,
        notes: data.notes,
        returnCondition: data.returnCondition,
        returnNotes: data.returnNotes,
        createdAt: data.createdAt || undefined,
        updatedAt: data.updatedAt || undefined,
      } as Order);
    }
  });

  // Sort by orderDate descending (since Realtime DB doesn't have built-in orderBy like Firestore)
  orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  return orders;
}


export default async function ProductDetailsPage({ params: routeParams }: { params: Promise<{ lang: string; productId: string }> }) {
  const { lang, productId } = await routeParams;
  const langTyped = lang as 'ar' | 'en';
  const effectiveLang = langTyped;

  const product = await getProductFromRealtimeDB(productId);
  const allProductTypes = await getProductTypesFromRealtimeDB(); // Fetch all types
  const relatedOrders: Order[] = product ? await getRelatedOrdersFromRealtimeDB(product.id) : []; // Use product.id

  const timesSold = relatedOrders.filter(order => order.transactionType === 'Sale').length;
  const timesRented = relatedOrders.filter(order => order.transactionType === 'Rental').length;

  const t = {
    productDetailsTitle: effectiveLang === 'ar' ? `تفاصيل المنتج` : `Product Details`,
    productNameTitle: (name?: string) => effectiveLang === 'ar' ? `تفاصيل: ${name || productId}` : `Details: ${name || productId}`,
    productNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على المنتج.' : 'Product not found.',
    backToProducts: effectiveLang === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products',
    actions: effectiveLang === 'ar' ? 'الإجراءات' : 'Actions',
    printBarcode: effectiveLang === 'ar' ? 'طباعة الباركود' : 'Print Barcode',
    printBarcodeAlertTemplate: effectiveLang === 'ar' ? `ميزة طباعة الباركود للكود {CODE} قيد التطوير.` : `Print Barcode feature for {CODE} is under development.`,
    typeLabel: effectiveLang === 'ar' ? 'النوع' : 'Type',
    categoryLabel: effectiveLang === 'ar' ? 'الفئة' : 'Category',
    priceLabel: effectiveLang === 'ar' ? 'السعر الحالي' : 'Current Price',
    sizeLabel: effectiveLang === 'ar' ? 'المقاس' : 'Size',
    statusLabel: effectiveLang === 'ar' ? 'الحالة' : 'Status',
    descriptionLabel: effectiveLang === 'ar' ? 'الوصف' : 'Description',
    notesLabel: effectiveLang === 'ar' ? 'ملاحظات' : 'Notes',
    productCodeLabel: effectiveLang === 'ar' ? 'كود الصنف' : 'Product Code',
    branchLabel: effectiveLang === 'ar' ? 'الفرع' : 'Branch',
    globalProduct: effectiveLang === 'ar' ? 'منتج عالمي (متوفر في جميع الفروع)' : 'Global Product (Available in all branches)',
    primaryBranch: effectiveLang === 'ar' ? 'الفرع الأساسي' : 'Primary Branch',
    unknownBranch: effectiveLang === 'ar' ? 'لم يتم تحديد فرع' : 'Branch not assigned',
    initialStockLabel: effectiveLang === 'ar' ? 'الكمية الأولية' : 'Initial Stock',
    currentStockLabel: effectiveLang === 'ar' ? 'الكمية الحالية بالمخزون' : 'Current Quantity In Stock',
    rentedQuantityLabel: effectiveLang === 'ar' ? 'الكمية المؤجرة حالياً' : 'Currently Rented Quantity',
    availableForOperationLabel: effectiveLang === 'ar' ? 'الكمية المتاحة للعملية (بيع/إيجار)' : 'Available for Operation (Sale/Rental)',
    quantityDetails: effectiveLang === 'ar' ? 'تفاصيل الكميات' : 'Quantity Details',
    usageSummaryTitle: effectiveLang === 'ar' ? 'ملخص الاستخدام' : 'Usage Summary',
    timesSoldLabel: effectiveLang === 'ar' ? 'مرات البيع' : 'Times Sold',
    timesRentedLabel: effectiveLang === 'ar' ? 'مرات الإيجار' : 'Times Rented',
    productOrderHistoryTitle: effectiveLang === 'ar' ? 'سجل طلبات المنتج' : 'Product Order History',
    noOrderHistoryForProduct: effectiveLang === 'ar' ? 'لا يوجد سجل طلبات لهذا المنتج.' : 'No order history for this product.',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    rental: effectiveLang === 'ar' ? 'إيجار' : 'Rental',
    sale: effectiveLang === 'ar' ? 'بيع' : 'Sale',
    available: effectiveLang === 'ar' ? 'متوفر' : 'Available',
    rentedStatus: effectiveLang === 'ar' ? 'مستأجر' : 'Rented',
    soldStatus: effectiveLang === 'ar' ? 'مباع' : 'Sold',
    unknownType: effectiveLang === 'ar' ? 'نوع غير معروف' : 'Unknown Type',
  };

  const getStatusVariant = (statusValue?: ProductStatus) => {
    if (!statusValue) return 'outline';
    switch (statusValue) {
      case 'Available': return 'default';
      case 'Rented': return 'secondary';
      case 'Sold': return 'destructive';
      default: return 'outline';
    }
  };

  const displayProductStatus = (statusValue?: ProductStatus) => {
    if (!statusValue) return '';
    if (effectiveLang === 'ar') {
      if (statusValue === 'Available') return t.available;
      if (statusValue === 'Rented') return t.rentedStatus;
      if (statusValue === 'Sold') return t.soldStatus;
    }
    return statusValue;
  };

  const displayProductType = (typeId?: string) => {
    if (!typeId) return t.unknownType;
    const typeDef = allProductTypes.find(ptd => ptd.id === typeId);
    if (typeDef) {
      return effectiveLang === 'ar' ? typeDef.name_ar : typeDef.name;
    }
    return t.unknownType;
  };

  const displayProductCategory = (categoryValue?: ProductCategory) => {
    if(!categoryValue) return '';
    return categoryValue === 'Rental' ? t.rental : t.sale;
  };

  if (!product) {
    return (
      <div className="space-y-8 text-center py-12">
        <PageTitle>{t.productDetailsTitle}</PageTitle>
        <p className="text-xl text-muted-foreground">{t.productNotFound}</p>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/products`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToProducts}
          </Link>
        </Button>
      </div>
    );
  }

  const stock = product.quantityInStock ?? 0;
  const rented = product.quantityRented ?? 0;
  const availableForOperation = stock - rented;

  return (
    <ProductDetailsAuthWrapper lang={effectiveLang}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <PageTitle className="mb-4 sm:mb-0">{t.productNameTitle(product.name)}</PageTitle>
          <div className="flex flex-col items-stretch gap-2 mt-4 w-full sm:flex-row sm:items-center sm:mt-0 sm:w-auto">
              <PrintBarcodeButton
              productId={product.id}
              productCode={product.productCode}
              productName={product.name}
              productPrice={product.price}
              lang={effectiveLang}
              buttonText={t.printBarcode}
              alertTextTemplate={t.printBarcodeAlertTemplate}
              className="w-full sm:w-auto"
            />
            <EditProductButton productId={productId} lang={effectiveLang} className="w-full sm:w-auto" />
            <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/${effectiveLang}/products`}>
                <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t.backToProducts}
            </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-2xl">{product.name}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{displayProductType(product.type)}</Badge>
              <Badge variant="outline">{displayProductCategory(product.category)}</Badge>
            </div>
          </div>
           <CardDescription className="text-sm text-muted-foreground pt-1">
            {t.productCodeLabel}: {product.productCode}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden border">
            <Image
              src={product.imageUrl || 'https://placehold.co/600x400.png'}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={product['data-ai-hint'] || "fashion item"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary flex items-center">
              <Info className="mr-2 h-5 w-5" />
              {t.descriptionLabel}
            </h3>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>
          <hr/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              <div>
                <p className="text-sm font-medium">{t.priceLabel}</p>
                <p className="text-base text-foreground">{t.currencySymbol} {product.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Ruler className="h-5 w-5 mr-2 text-primary" />
              <div>
                <p className="text-sm font-medium">{t.sizeLabel}</p>
                <p className="text-base text-foreground">{product.size}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Layers className="h-5 w-5 mr-2 text-primary" />
              <div>
                <p className="text-sm font-medium">{t.statusLabel}</p>
                <Badge variant={getStatusVariant(product.status)} className="text-base">{displayProductStatus(product.status)}</Badge>
              </div>
            </div>
            <div className="flex items-center md:col-span-2">
              {product.isGlobalProduct ? <Globe className="h-5 w-5 mr-2 text-primary" /> : <Store className="h-5 w-5 mr-2 text-primary" />}
              <div>
                <p className="text-sm font-medium">{t.branchLabel}</p>
                <p className="text-base text-foreground">
                  {product.isGlobalProduct ? t.globalProduct : (product.branchName || t.unknownBranch)}
                  {product.isGlobalProduct && product.branchName && ` (${t.primaryBranch}: ${product.branchName})`}
                </p>
              </div>
            </div>
          </div>

          <hr/>
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              {t.usageSummaryTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                    <span>{t.timesSoldLabel}: <span className="font-medium">{timesSold}</span></span>
                </div>
                <div className="flex items-center">
                    <Repeat className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                    <span>{t.timesRentedLabel}: <span className="font-medium">{timesRented}</span></span>
                </div>
            </div>
          </div>

          <hr/>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-primary flex items-center">
              <Package className="mr-2 h-5 w-5" />
              {t.quantityDetails}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center">
                <PackageSearch className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t.initialStockLabel}: <span className="font-medium">{product.initialStock}</span></span>
              </div>
              <div className="flex items-center">
                <PackageX className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t.rentedQuantityLabel}: <span className="font-medium">{product.quantityRented}</span></span>
              </div>
              <div className="flex items-center">
                <PackageCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t.currentStockLabel}: <span className="font-medium">{product.quantityInStock}</span></span>
              </div>
              <div className="flex items-center">
                <PackageCheck className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-semibold">{t.availableForOperationLabel}: <span className="font-bold text-green-600">{availableForOperation}</span></span>
              </div>
            </div>
          </div>

          {product.notes && (
            <>
              <hr/>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-primary flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  {t.notesLabel}
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
              <History className="mr-2 h-5 w-5 text-primary" />
              {t.productOrderHistoryTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatedOrders.length > 0 ? (
            <ProductOrderHistoryTable orders={relatedOrders} lang={effectiveLang as 'ar' | 'en'} />
          ) : (
            <p className="text-sm text-muted-foreground">{t.noOrderHistoryForProduct}</p>
          )}
        </CardContent>
      </Card>
      </div>
    </ProductDetailsAuthWrapper>
  );
}
