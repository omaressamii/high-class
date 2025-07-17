'use client';

import React from 'react';
import { Package, PackageSearch, PackageX, PackageCheck } from 'lucide-react';
import type { Product } from '@/types';
import { useRealtimeOrders } from '@/context/RealtimeDataContext';

interface ProductQuantityDetailsProps {
  product: Product;
  lang: 'ar' | 'en';
}

export function ProductQuantityDetails({ product, lang }: ProductQuantityDetailsProps) {
  const { orders } = useRealtimeOrders();

  const t = {
    quantityDetails: lang === 'ar' ? 'تفاصيل الكميات' : 'Quantity Details',
    initialStockLabel: lang === 'ar' ? 'الكمية الأولية' : 'Initial Stock',
    currentStockLabel: lang === 'ar' ? 'الكمية الحالية بالمخزون' : 'Current Quantity In Stock',
    rentedQuantityLabel: lang === 'ar' ? 'الكمية المؤجرة حاليًا' : 'Currently Rented Quantity',
    availableForOperationLabel: lang === 'ar' ? 'الكمية المتاحة للعملية (بيع/إيجار)' : 'Available for Operation (Sale/Rental)',
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
          <span>{t.rentedQuantityLabel}: <span className="font-medium">{actualRentedQuantity}</span></span>
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
  );
}
