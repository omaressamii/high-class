
/**
 * @file src/components/products/ProductCard.tsx
 */
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductTypeDefinition, Order } from '@/types'; // Added ProductTypeDefinition and Order
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Tag, Layers, Ruler, Info, Eye, PackageCheck, ShoppingCart, Loader2, ScanBarcode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeOrders } from '@/context/RealtimeDataContext';

interface ProductCardProps {
  product: Product;
  allProductTypes: ProductTypeDefinition[]; // Added to get display name
  lang: string;
}

const ProductCard = React.memo(function ProductCard({ product, allProductTypes, lang: propLang }: ProductCardProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';
  const { isLoading: authIsLoading, hasPermission, currentUser } = useAuth();
  const { orders }: { orders: Order[] } = useRealtimeOrders();

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'Available':
        return 'default';
      case 'Rented':
        return 'secondary';
      case 'Sold':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const t = {
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    createOrder: lang === 'ar' ? 'إنشاء طلب' : 'Create Order',
    price: lang === 'ar' ? 'السعر' : 'Price',
    size: lang === 'ar' ? 'المقاس' : 'Size',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    availableQuantity: lang === 'ar' ? 'المتاح حاليًا' : 'Currently Available',
    rentedQuantity: lang === 'ar' ? 'الكمية المؤجرة حاليًا' : 'Currently Rented Quantity',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
    statusAvailable: lang === 'ar' ? 'متوفر' : 'Available',
    statusRented: lang === 'ar' ? 'مستأجر' : 'Rented',
    statusSold: lang === 'ar' ? 'مباع' : 'Sold',
    loading: lang === 'ar' ? 'جار التحميل...' : 'Loading...',
    categoryRental: lang === 'ar' ? 'إيجار' : 'Rental',
    categorySale: lang === 'ar' ? 'بيع' : 'Sale',
    productCode: lang === 'ar' ? 'كود الصنف' : 'Product Code',
    unknownType: lang === 'ar' ? 'نوع غير معروف' : 'Unknown Type',
  };

  const getProductTypeDisplayName = (typeId: string) => {
    const typeDef = allProductTypes.find(ptd => ptd.id === typeId);
    if (typeDef) {
      return lang === 'ar' ? typeDef.name_ar : typeDef.name;
    }
    return t.unknownType; // Fallback if type ID not found
  };

  const typeText = getProductTypeDisplayName(product.type);
  const categoryText = product.category === 'Rental' ? t.categoryRental : t.categorySale;

  const statusDisplay = (statusValue: Product['status']) => {
    if (lang === 'ar') {
      if (statusValue === 'Available') return t.statusAvailable;
      if (statusValue === 'Rented') return t.statusRented;
      if (statusValue === 'Sold') return t.statusSold;
    }
    return statusValue;
  };

  // Calculate actual rented quantity from active orders
  const actualRentedQuantity = React.useMemo(() => {
    if (!orders || orders.length === 0) return product.quantityRented || 0;

    const activeStatuses = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Overdue'];

    return orders
      .filter(order =>
        order.transactionType === 'Rental' &&
        activeStatuses.includes(order.status)
      )
      .reduce((total, order) => {
        if (order.items && order.items.length > 0) {
          // New format with items array
          const productItems = order.items.filter(item => item.productId === product.id);
          return total + productItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        } else if (order.productId === product.id) {
          // Legacy format with single productId
          return total + 1;
        }
        return total;
      }, 0);
  }, [orders, product.id, product.quantityRented]);

  const availableForOperation = product.quantityInStock - actualRentedQuantity;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="relative w-full h-40 sm:h-48 md:h-56">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            data-ai-hint={product['data-ai-hint'] || "fashion item"}
          />
           {product.productCode && (
            <Badge variant="secondary" className="absolute top-1 right-1 sm:top-2 sm:right-2 rtl:right-auto rtl:left-1 sm:rtl:left-2 text-xs">
              {t.productCode}: {product.productCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow">
        <CardTitle className="font-headline text-lg sm:text-xl mb-1 line-clamp-2">{product.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mb-2">{typeText} - {categoryText}</CardDescription>

        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm mb-3">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            <span>{t.price}: {t.currencySymbol} {product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center">
            <Ruler className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            <span>{t.size}: {product.size}</span>
          </div>
          <div className="flex items-center">
            <Layers className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            <span>{t.status}: <Badge variant={getStatusVariant(product.status)} className="ml-1 rtl:mr-1 rtl:ml-0">{statusDisplay(product.status)}</Badge></span>
          </div>
          <div className="flex items-center">
            <PackageCheck className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" />
            <span className="font-semibold">{t.rentedQuantity}: <span className="font-bold text-blue-700">{actualRentedQuantity}</span></span>
          </div>
          <div className="flex items-center">
            <PackageCheck className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-600" />
            <span className="font-semibold">{t.availableQuantity}: <span className="font-bold text-green-700">{availableForOperation}</span></span>
          </div>
          {product.notes && (
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">{product.notes}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-3">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        {hasPermission('products_view_details') && (
          <Button asChild variant="outline" className="flex-1 hover:bg-accent hover:text-accent-foreground">
            <Link href={`/${lang}/products/${product.id}`}>
              <Eye className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t.viewDetails}
            </Link>
          </Button>
        )}
        {authIsLoading ? (
          <Button disabled className="flex-1">
            <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
            {t.loading}
          </Button>
        ) : (
          <>
            {hasPermission('orders_add') && (
              <Button asChild variant="default" className="flex-1">
                <Link href={`/${lang}/orders/new?productId=${product.id}`}>
                  <ShoppingCart className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                  {t.createOrder}
                </Link>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
});

export { ProductCard };
