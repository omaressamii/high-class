
// Server Component for fetching order data
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Order, Product, Customer, User as AppUser, OrderItem } from '@/types';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader, Fingerprint } from 'lucide-react';
import { OrderDetailClientPage, type OrderDetailsData } from '@/components/orders/OrderDetailClientPage';
import { startOfDay } from 'date-fns';

// Helper function to parse 'yyyy-MM-dd' string to Date
function parseSimpleDate(dateString: string): Date | null {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj;
  } catch (e) {
    console.error("Error parsing date string in parseSimpleDate (Server):", dateString, e);
    return null;
  }
}

// Helper to handle timestamp serialization for Realtime Database
function serializeTimestamp(ts: any): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === 'string') {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(ts)) {
        return ts;
    }
  }
  if (typeof ts === 'number') {
    return new Date(ts).toISOString();
  }
  console.warn("serializeTimestamp: Unrecognized timestamp format encountered:", ts);
  return undefined;
}


async function getOrderDetailsFromRealtimeDB(orderId: string): Promise<OrderDetailsData | null> {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnap = await get(orderRef);

    if (!orderSnap.exists()) {
      console.warn(`Order with ID ${orderId} not found in Realtime Database.`);
      return null;
    }

    const rawOrderData = orderSnap.val();
    let orderData: Order = {
      id: orderId,
      orderCode: rawOrderData.orderCode,
      items: (rawOrderData.items || []).map((item: any) => ({ // Map items
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: Number(item.quantity) || 1,
        priceAtTimeOfOrder: Number(item.priceAtTimeOfOrder) || 0,
      })),
      customerId: rawOrderData.customerId,
      customerName: rawOrderData.customerName,
      sellerId: rawOrderData.sellerId,
      sellerName: rawOrderData.sellerName,
      processedByUserId: rawOrderData.processedByUserId,
      processedByUserName: rawOrderData.processedByUserName,
      branchId: rawOrderData.branchId,
      branchName: rawOrderData.branchName,
      transactionType: rawOrderData.transactionType,
      orderDate: rawOrderData.orderDate,
      deliveryDate: rawOrderData.deliveryDate,
      returnDate: rawOrderData.returnDate,
      totalPrice: Number(rawOrderData.totalPrice) || 0,
      paidAmount: Number(rawOrderData.paidAmount) || 0,
      remainingAmount: Number(rawOrderData.remainingAmount) || 0,
      status: rawOrderData.status,
      notes: rawOrderData.notes,
      returnCondition: rawOrderData.returnCondition,
      returnNotes: rawOrderData.returnNotes,
      createdAt: serializeTimestamp(rawOrderData.createdAt),
      updatedAt: serializeTimestamp(rawOrderData.updatedAt),
    };
    
    // Keep product, customer, seller, processor fetching logic if still needed for enrichment
    // For multi-item orders, direct product details on the page might be less relevant than item list
    // Or you might want to fetch details for the *first* item for a quick summary
    let primaryProductData: Product | undefined;
    if (orderData.items.length > 0) {
      const primaryProductId = orderData.items[0].productId;
      const productRef = ref(database, `products/${primaryProductId}`);
      const productSnap = await get(productRef);
      if (productSnap.exists()) {
        const rawProduct = productSnap.val();
        primaryProductData = {
            id: primaryProductId,
            name: rawProduct.name,
            productCode: rawProduct.productCode,
            type: rawProduct.type,
            category: rawProduct.category,
            size: rawProduct.size,
            price: Number(rawProduct.price) || 0,
            status: rawProduct.status,
            imageUrl: rawProduct.imageUrl,
            description: rawProduct.description,
            notes: rawProduct.notes,
            "data-ai-hint": rawProduct["data-ai-hint"],
            initialStock: Number(rawProduct.initialStock) || 0,
            quantityInStock: Number(rawProduct.quantityInStock) || 0,
            quantityRented: Number(rawProduct.quantityRented) || 0,
            quantitySold: Number(rawProduct.quantitySold) || 0,
            branchId: rawProduct.branchId,
            branchName: rawProduct.branchName,
            isGlobalProduct: rawProduct.isGlobalProduct,
            createdAt: serializeTimestamp(rawProduct.createdAt),
            updatedAt: serializeTimestamp(rawProduct.updatedAt),
        } as Product;
      }
    }


    let customerData: Customer | undefined;
    let sellerData: AppUser | undefined;
    let processorData: AppUser | undefined;

    if (orderData.customerId) {
      const customerRef = ref(database, `customers/${orderData.customerId}`);
      const customerSnap = await get(customerRef);
      if (customerSnap.exists()) {
        const rawCustomer = customerSnap.val();
        customerData = {
            id: orderData.customerId,
            fullName: rawCustomer.fullName,
            phoneNumber: rawCustomer.phoneNumber,
            address: rawCustomer.address,
            idCardNumber: rawCustomer.idCardNumber,
            notes: rawCustomer.notes,
            createdByUserId: rawCustomer.createdByUserId,
            createdAt: serializeTimestamp(rawCustomer.createdAt),
        } as Customer;
      }
    }

    if (orderData.sellerId) {
      const sellerRef = ref(database, `users/${orderData.sellerId}`);
      const sellerSnap = await get(sellerRef);
      if (sellerSnap.exists()) {
        const rawSeller = sellerSnap.val();
        sellerData = {
            id: orderData.sellerId,
            username: rawSeller.username,
            fullName: rawSeller.fullName,
            isSeller: rawSeller.isSeller,
            permissions: rawSeller.permissions,
            branchId: rawSeller.branchId,
            branchName: rawSeller.branchName,
            createdAt: serializeTimestamp(rawSeller.createdAt),
            updatedAt: serializeTimestamp(rawSeller.updatedAt),
        } as AppUser;
      }
    }
    
    if (orderData.processedByUserId) {
      const processorRef = ref(database, `users/${orderData.processedByUserId}`);
      const processorSnap = await get(processorRef);
      if (processorSnap.exists()) {
         const rawProcessor = processorSnap.val();
         processorData = {
            id: orderData.processedByUserId,
            username: rawProcessor.username,
            fullName: rawProcessor.fullName,
            isSeller: rawProcessor.isSeller,
            permissions: rawProcessor.permissions,
            branchId: rawProcessor.branchId,
            branchName: rawProcessor.branchName,
            createdAt: serializeTimestamp(rawProcessor.createdAt),
            updatedAt: serializeTimestamp(rawProcessor.updatedAt),
        } as AppUser;
      }
    }
    
    orderData.customerName = orderData.customerName || customerData?.fullName;
    orderData.sellerName = orderData.sellerName || sellerData?.fullName;
    orderData.processedByUserName = orderData.processedByUserName || processorData?.fullName;

    if (orderData.branchId && !orderData.branchName) {
        const branchRef = ref(database, `branches/${orderData.branchId}`);
        const branchSnap = await get(branchRef);
        if (branchSnap.exists()) {
            orderData.branchName = branchSnap.val()?.name;
        }
    }

    // Server-side check and update for overdue status
    if (
      orderData.transactionType === 'Rental' &&
      orderData.status === 'Ongoing' &&
      orderData.returnDate
    ) {
      const returnDateObj = parseSimpleDate(orderData.returnDate);
      if (returnDateObj) {
        if (startOfDay(new Date()) > returnDateObj) {
          try {
            const orderRef = ref(database, `orders/${orderId}`);
            await update(orderRef, {
              status: 'Overdue',
              updatedAt: Date.now()
            });
            console.log(`[OrderDetailPage SERVER] Order ${orderData.id} status updated to Overdue.`);
            orderData.status = 'Overdue';
            orderData.updatedAt = new Date().toISOString();
          } catch (updateError) {
            console.error(`[OrderDetailPage SERVER] Failed to update order ${orderData.id} to Overdue:`, updateError);
          }
        }
      }
    }

    return { 
      order: orderData, 
      product: primaryProductData, // Pass primary product if fetched, or undefined
      customer: customerData, 
      seller: sellerData, 
      processor: processorData 
    };

  } catch (error) {
    console.error("Error fetching order details from Realtime Database (Server):", error);
    return null;
  }
}


export default async function OrderDetailsPageServer({ params: routeParams }: { params: Promise<{ lang: string; orderId: string }> }) {
  const { lang, orderId } = await routeParams;
  const langTyped = lang as 'ar' | 'en';
  const effectiveLang = langTyped;

  const orderDetails = await getOrderDetailsFromRealtimeDB(orderId);

  const t = { 
    orderDetailsTitle: effectiveLang === 'ar' ? `تفاصيل الطلب` : `Order Details`,
    orderCodeLabel: effectiveLang === 'ar' ? 'كود الطلب:' : 'Order Code:',
    orderNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على الطلب.' : 'Order not found.',
    backToOrders: effectiveLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders',
    errorFetchingOrderTitle: effectiveLang === 'ar' ? 'خطأ في جلب الطلب' : 'Error Fetching Order',
    loadingOrderDetails: effectiveLang === 'ar' ? 'جار تحميل تفاصيل الطلب...' : 'Loading order details...',
  };
  
  const pageTitleContent = orderDetails?.order?.orderCode 
    ? `${t.orderDetailsTitle} #${orderId} (${t.orderCodeLabel} ${orderDetails.order.orderCode})`
    : `${t.orderDetailsTitle} #${orderId}`;


  if (orderDetails === undefined) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 rtl:mr-4">{t.loadingOrderDetails}</p>
      </div>
    );
  }

  if (orderDetails === null) { 
    return (
      <div className="space-y-8 text-center py-12">
        <PageTitle>{pageTitleContent}</PageTitle>
        <div className="border-destructive bg-destructive/10 max-w-md mx-auto rounded-lg p-6">
          <h3 className="text-destructive flex items-center text-lg justify-center font-semibold">
            <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.errorFetchingOrderTitle}
          </h3>
          <p className="mt-2 text-sm">{t.orderNotFound}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/orders`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.backToOrders}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <OrderDetailClientPage
      initialOrderDetails={orderDetails}
      lang={effectiveLang}
      orderId={orderId}
    />
  );
}
