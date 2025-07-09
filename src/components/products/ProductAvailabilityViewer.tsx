
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, Search, AlertCircle, CalendarCheck, CalendarX, Info, Package, Eye } from 'lucide-react';
import type { Product, Order, OrderStatus } from '@/types';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ProductAvailabilityViewerProps {
  lang: 'ar' | 'en';
}

interface RentalScheduleEntry {
  orderId: string;
  orderCode?: string;
  customerName?: string;
  deliveryDate: string;
  returnDate?: string;
  status: OrderStatus;
  quantity: number;
}

export function ProductAvailabilityViewer({ lang }: ProductAvailabilityViewerProps) {
  const [productIdInput, setProductIdInput] = useState('');
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [rentalSchedule, setRentalSchedule] = useState<RentalScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Get current user and permissions for branch filtering
  const { currentUser, hasPermission } = useAuth();

  const locale = lang === 'ar' ? arSA : enUS;

  const t = {
    searchByProductCode: lang === 'ar' ? 'البحث بكود المنتج' : 'Search by Product Code',
    enterProductCodePlaceholder: lang === 'ar' ? 'أدخل كود المنتج (مثل 90000003)' : 'Enter Product Code (e.g., 90000003)',
    searchButton: lang === 'ar' ? 'بحث' : 'Search',
    searching: lang === 'ar' ? 'جاري البحث...' : 'Searching...',
    productNotFound: lang === 'ar' ? 'المنتج غير موجود بالكود المدخل.' : 'Product not found with the entered code.',
    productNotRental: lang === 'ar' ? 'هذا المنتج ليس مخصصًا للإيجار أو لا يمكن التحقق من نوعه حاليًا.' : 'This product is not for rental or its category cannot be currently verified.',
    noRentalsFound: lang === 'ar' ? 'لا توجد حجوزات (إيجارات نشطة أو قادمة) لهذا المنتج.' : 'No active or upcoming rentals found for this product.',
    rentalScheduleFor: (name: string) => lang === 'ar' ? `جدول حجوزات المنتج: ${name}` : `Rental Schedule for: ${name}`,
    orderId: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    orderCode: lang === 'ar' ? 'كود الطلب' : 'Order Code',
    customerName: lang === 'ar' ? 'اسم العميل' : 'Customer Name',
    deliveryDate: lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    returnDate: lang === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    quantity: lang === 'ar' ? 'الكمية' : 'Quantity',
    statusOngoing: lang === 'ar' ? 'جاري التنفيذ' : 'Ongoing',
    statusPendingPreparation: lang === 'ar' ? 'قيد التجهيز' : 'Pending Preparation',
    statusPrepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared',
    statusDeliveredToCustomer: lang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    statusCompleted: lang === 'ar' ? 'مكتمل' : 'Completed',
    statusOverdue: lang === 'ar' ? 'متأخر' : 'Overdue',
    statusCancelled: lang === 'ar' ? 'ملغى' : 'Cancelled',
    viewOrder: lang === 'ar' ? 'عرض الطلب' : 'View Order',
  };

  const displayStatus = (status: OrderStatus) => {
    switch (status) {
      case 'Ongoing': return t.statusOngoing;
      case 'Pending Preparation': return t.statusPendingPreparation;
      case 'Prepared': return t.statusPrepared;
      case 'Delivered to Customer': return t.statusDeliveredToCustomer;
      case 'Completed': return t.statusCompleted;
      case 'Overdue': return t.statusOverdue;
      case 'Cancelled': return t.statusCancelled;
      default: return status;
    }
  };
  
  const getStatusVariant = (status: OrderStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (status) {
      case 'Ongoing': return 'default';
      case 'Pending Preparation': return 'secondary';
      case 'Prepared': return 'outline';
      case 'Delivered to Customer': return 'default';
      case 'Completed': return 'outline';
      case 'Overdue': return 'destructive';
      case 'Cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return lang === 'ar' ? 'غير متاح' : 'N/A';
    try {
      const date = new Date(dateString.replace(/-/g, '/')); 
      if (isNaN(date.getTime())) return dateString;
      return format(date, 'PPP', { locale });
    } catch (e) {
      return dateString;
    }
  };

  const handleSearch = async () => {
    const trimmedInput = productIdInput.trim();
    if (!trimmedInput) {
      setError(lang === 'ar' ? 'الرجاء إدخال كود المنتج.' : 'Please enter a product code.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setProductDetails(null);
    setRentalSchedule([]);
    setSearched(true);

    let codeToSearch = trimmedInput;
    // If input is shorter than 8 chars and consists only of digits (or starts with 9 and is short)
    // Pad it to 8 digits, assuming it's a suffix for a code starting with '9'
    // and product codes are 8 digits long.
    if (codeToSearch.length > 0 && codeToSearch.length < 8 && /^\d+$/.test(codeToSearch)) {
        const targetLength = 8;
        const leadingNine = '9';
        const numZerosToPad = targetLength - 1 - codeToSearch.length; // Number of '0's after the leading '9'
        
        if (numZerosToPad >= 0) { // Ensure we don't have a negative number of zeros
            let prefix = leadingNine;
            for (let i = 0; i < numZerosToPad; i++) {
                prefix += '0';
            }
            codeToSearch = prefix + codeToSearch;
        }
        // If input was '005', numZerosToPad = 4. prefix = '90000'. codeToSearch = '90000005' (if '005' is treated as a number 5)
        // To correctly handle leading zeros in suffix like '005', the suffix itself determines the padding of '9' and '0's
        // Example: input '5' -> '90000005'
        // Example: input '45' -> '90000045'
        // Example: input '005' -> '90000005' (parsed as '5' effectively if not careful)
        // Let's assume the input is the exact suffix.
        if (trimmedInput.length < targetLength) {
            let prefix = leadingNine;
            const zerosNeeded = targetLength - 1 - trimmedInput.length; // Zeros between '9' and suffix
            if (zerosNeeded >= 0) {
                prefix += '0'.repeat(zerosNeeded);
                codeToSearch = prefix + trimmedInput;
            } else {
                // This case implies trimmedInput is 7 chars and starts with '9' or is 8 chars.
                // If 7 chars, it should be like '9xxxxxx'. If '9'+6chars, this logic works
                // If it's 'xxxxxxx' (7 chars not starting with 9), it's ambiguous.
                // For simplicity, if length is < 8, we apply the '9' + zeros padding.
                // If the user types "1234567", it becomes "91234567".
            }
        }


    }


    try {
      // Search for product by productCode in Realtime Database
      const productsRef = ref(database, 'products');
      const productsSnapshot = await get(productsRef);

      let productData: Product | null = null;
      if (productsSnapshot.exists()) {
        const productsData = productsSnapshot.val();
        // Find product with matching productCode
        for (const [id, data] of Object.entries(productsData)) {
          const product = data as any;
          if (product.productCode === codeToSearch) {
            productData = { id, ...product } as Product;
            break;
          }
        }
      }

      if (!productData) {
        setError(t.productNotFound);
        setIsLoading(false);
        return;
      }

      // Check if user has permission to view this product based on branch
      if (!hasPermission('view_all_branches')) {
        if (currentUser?.branchId) {
          // User has a specific branch - only allow products from their branch or global products
          if (!productData.isGlobalProduct && productData.branchId !== currentUser.branchId) {
            setError(lang === 'ar' ? 'ليس لديك صلاحية للتحقق من توفر هذا المنتج.' : 'You do not have permission to check availability for this product.');
            setIsLoading(false);
            return;
          }
        } else {
          // User has no branch - only allow global products
          if (!productData.isGlobalProduct) {
            setError(lang === 'ar' ? 'ليس لديك صلاحية للتحقق من توفر هذا المنتج.' : 'You do not have permission to check availability for this product.');
            setIsLoading(false);
            return;
          }
        }
      }
      // If user has view_all_branches permission, allow access to all products

      setProductDetails(productData);

      if (productData.category !== 'Rental') {
        setError(t.productNotRental);
        setIsLoading(false);
        return;
      }

      // Fetch orders from Realtime Database
      const ordersRef = ref(database, 'orders');
      const ordersSnapshot = await get(ordersRef);
      const schedule: RentalScheduleEntry[] = [];

      if (ordersSnapshot.exists()) {
        const ordersData = ordersSnapshot.val();
        const relevantStatuses = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Overdue'];

        Object.entries(ordersData).forEach(([orderId, orderData]: [string, any]) => {
          const order = orderData as Order;

          // Filter by transaction type and status
          if (order.transactionType === 'Rental' && relevantStatuses.includes(order.status)) {
            // Apply branch filtering based on user permissions
            let shouldIncludeOrder = true;

            if (!hasPermission('view_all_branches')) {
              if (currentUser?.branchId) {
                // User has a specific branch - only show orders from their branch
                shouldIncludeOrder = order.branchId === currentUser.branchId;
              } else {
                // User has no branch - don't show any orders
                shouldIncludeOrder = false;
              }
            }
            // If user has view_all_branches permission, show all orders (shouldIncludeOrder remains true)

            if (shouldIncludeOrder && order.items && Array.isArray(order.items)) {
              const relevantItem = order.items.find(item => item.productId === productData!.id);
              if (relevantItem) {
                schedule.push({
                  orderId,
                  orderCode: order.orderCode,
                  customerName: order.customerName || (lang === 'ar' ? 'عميل غير معروف' : 'Unknown Customer'),
                  deliveryDate: order.deliveryDate,
                  returnDate: order.returnDate,
                  status: order.status,
                  quantity: relevantItem.quantity,
                });
              }
            }
          }
        });
      }
      
      schedule.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
      setRentalSchedule(schedule);

      if (schedule.length === 0) {
        // No rentals for this product, but product itself was found.
        // This is not an error, but an informational state.
      }

    } catch (e: any) {
      console.error("Error fetching product availability:", e);
      setError(e.message || (lang === 'ar' ? 'حدث خطأ أثناء البحث.' : 'An error occurred during search.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <CalendarCheck className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
          {t.searchByProductCode}
        </CardTitle>
        <CardDescription>{lang === 'ar' ? 'أدخل كود المنتج (مثل 90000003) للتحقق من جدول حجوزاته.' : 'Enter Product Code (e.g., 90000003) to check its rental schedule.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-2">
          <div className="flex-grow space-y-1.5">
            <label htmlFor="productIdInput" className="text-sm font-medium sr-only">{t.enterProductCodePlaceholder}</label>
            <Input
              id="productIdInput"
              type="text"
              placeholder={t.enterProductCodePlaceholder}
              value={productIdInput}
              onChange={(e) => setProductIdInput(e.target.value)}
              className="bg-card"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" /> {t.searching}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.searchButton}
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {productDetails && !error && (
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0"/>
              {t.rentalScheduleFor(productDetails.name)}
            </h3>
            {rentalSchedule.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.orderCode}</TableHead>
                      <TableHead>{t.customerName}</TableHead>
                      <TableHead>{t.deliveryDate}</TableHead>
                      <TableHead>{t.returnDate}</TableHead>
                      <TableHead className="text-center">{t.quantity}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-center">{t.viewOrder}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentalSchedule.map((entry) => (
                      <TableRow key={entry.orderId}>
                        <TableCell className="font-medium">{entry.orderCode || entry.orderId}</TableCell>
                        <TableCell>{entry.customerName}</TableCell>
                        <TableCell>{formatDate(entry.deliveryDate)}</TableCell>
                        <TableCell>{formatDate(entry.returnDate)}</TableCell>
                        <TableCell className="text-center">{entry.quantity}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            entry.status === 'Ongoing' || entry.status === 'Delivered to Customer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
                            entry.status === 'Prepared' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                            entry.status === 'Pending Preparation' ? 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100' :
                            entry.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
                          }`}>
                            {displayStatus(entry.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${lang}/orders/${entry.orderId}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
               <div className="p-4 bg-secondary/30 border border-border rounded-md flex items-center justify-center text-muted-foreground">
                <CalendarX className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                <p className="text-sm">{t.noRentalsFound}</p>
              </div>
            )}
          </div>
        )}
        {searched && !productDetails && !error && !isLoading && (
          <div className="p-4 bg-secondary/30 border border-border rounded-md flex items-center justify-center text-muted-foreground">
            <Info className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            <p className="text-sm">{lang === 'ar' ? 'الرجاء إدخال كود منتج صالح والبحث.' : 'Please enter a valid product code and search.'}</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

