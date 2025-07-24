
import React from 'react'; 
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import type { Order, TransactionType, OrderStatus, Product, Customer, User as AppUser, Branch, OrderItem } from '@/types';
import { PlusCircle, Loader, AlertCircle, ListChecks } from 'lucide-react';
import { ref, get, query, orderByChild, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfDay } from 'date-fns';
import { OrdersPageClientContent } from '@/components/orders/OrdersPageClientContent';

type OrderWithDetails = Order & {
  customerPhoneNumber?: string;
};

function parseSimpleDate(dateString: string): Date | null {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  } catch (e) {
    return null;
  }
}

async function fetchReferencedDataMaps() {
  const customersRef = ref(database, "customers");
  const usersRef = ref(database, "users");
  const branchesRef = ref(database, "branches");

  const [customersSnapshot, usersSnapshot, branchesSnapshot] = await Promise.all([
    get(customersRef),
    get(usersRef),
    get(branchesRef)
  ]);

  const customersMap = new Map();
  if (customersSnapshot.exists()) {
    Object.entries(customersSnapshot.val()).forEach(([id, data]) => {
      customersMap.set(id, data as Customer);
    });
  }

  const usersMap = new Map();
  if (usersSnapshot.exists()) {
    Object.entries(usersSnapshot.val()).forEach(([id, data]) => {
      usersMap.set(id, data as AppUser);
    });
  }

  const branchesMap = new Map();
  const branchesList: {id: string, name: string}[] = [];
  if (branchesSnapshot.exists()) {
    Object.entries(branchesSnapshot.val()).forEach(([id, data]) => {
      const branchData = data as Branch;
      branchesMap.set(id, branchData);
      branchesList.push({ id, name: branchData.name });
    });
  }

  return { customersMap, usersMap, branchesMap, branchesList };
}

async function getOrdersWithDetails(lang: 'ar' | 'en'): Promise<{orders: OrderWithDetails[], branches: {id: string, name: string}[]} | { error: string }> {
  try {
    const { customersMap, usersMap, branchesMap, branchesList } = await fetchReferencedDataMaps();

    const ordersRef = ref(database, "orders");
    const orderSnapshot = await get(ordersRef);

    if (!orderSnapshot.exists()) {
      return { orders: [], branches: branchesList };
    }

    const ordersData = orderSnapshot.val();
    const orderListPromises: Promise<OrderWithDetails>[] = Object.entries(ordersData).map(async ([orderId, data]: [string, any]) => {
      const customer = customersMap.get(data.customerId);
      const seller = data.sellerId ? usersMap.get(data.sellerId) : undefined;
      const processor = data.processedByUserId ? usersMap.get(data.processedByUserId) : undefined;
      const branch = data.branchId ? branchesMap.get(data.branchId) : undefined;
      
      let mappedOrder: OrderWithDetails = {
        id: orderId,
        orderCode: data.orderCode,
        items: (data.items || []).map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            quantity: Number(item.quantity) || 1,
            priceAtTimeOfOrder: Number(item.priceAtTimeOfOrder) || 0,
        })),
        customerId: data.customerId,
        customerName: customer?.fullName || data.customerName || data.customerId,
        customerPhoneNumber: customer?.phoneNumber || '',
        sellerId: data.sellerId,
        sellerName: seller?.fullName || data.sellerName || (data.sellerId ? (lang === 'ar' ? 'بائع غير معروف' : 'Unknown Seller') : undefined),
        processedByUserId: data.processedByUserId,
        processedByUserName: processor?.fullName || data.processedByUserName || (data.processedByUserId ? (lang === 'ar' ? 'معالج غير معروف' : 'Unknown Processor') : undefined),
        branchId: data.branchId,
        branchName: branch?.name || data.branchName || (data.branchId ? (lang === 'ar' ? 'فرع غير معروف' : 'Unknown Branch') : undefined),
        transactionType: data.transactionType as TransactionType,
        orderDate: String(data.orderDate),
        deliveryDate: String(data.deliveryDate),
        returnDate: data.returnDate ? String(data.returnDate) : undefined,
        totalPrice: Number(data.totalPrice) || 0,
        paidAmount: Number(data.paidAmount) || 0,
        remainingAmount: Number(data.remainingAmount) || 0,
        status: data.status as OrderStatus,
        notes: data.notes,
        returnCondition: data.returnCondition,
        returnNotes: data.returnNotes,
        createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
      };

      if (
          mappedOrder.transactionType === 'Rental' &&
          mappedOrder.status === 'Ongoing' &&
          mappedOrder.returnDate
      ) {
          const returnDateObj = parseSimpleDate(mappedOrder.returnDate);
          if (returnDateObj) {
              if (startOfDay(new Date()) > returnDateObj) { 
                  try {
                      const orderRef = ref(database, `orders/${mappedOrder.id}`);
                      await update(orderRef, {
                          status: 'Overdue',
                          updatedAt: new Date().toISOString()
                      });
                      mappedOrder.status = 'Overdue';
                  } catch (updateError) {
                      console.error(`[OrdersPage SERVER] Failed to update order ${mappedOrder.id} to Overdue:`, updateError);
                  }
              }
          }
      }
      return mappedOrder;
    });
    
    const orderList = await Promise.all(orderListPromises);

    // Sort by createdAt descending (since Realtime DB doesn't have built-in orderBy like Firestore)
    orderList.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { orders: orderList, branches: branchesList };

  } catch (fetchError: any) {
    console.error("[OrdersPage SERVER] Realtime Database fetch error: ", fetchError);
    return { error: lang === 'ar' ? 'حدث خطأ أثناء جلب الطلبات.' : 'An error occurred while fetching orders.' };
  }
}


export default async function OrdersPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const result = await getOrdersWithDetails(effectiveLang);

  let ordersData: OrderWithDetails[];
  let branchesData: {id: string, name: string}[];

  if ('error' in result) {
    // If there's an error, log it (already done in getOrdersWithDetails)
    // and pass empty arrays to the client component to show "no orders" state.
    ordersData = [];
    branchesData = [];
  } else {
    ordersData = result.orders;
    branchesData = result.branches;
  }

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة الطلبات' : 'Order Management',
    addOrder: effectiveLang === 'ar' ? 'إضافة طلب جديد' : 'Add New Order',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingOrders: effectiveLang === 'ar' ? 'جار تحميل الطلبات...' : 'Loading orders...',
    noOrdersYet: effectiveLang === 'ar' ? 'لا توجد طلبات بعد. قم بإضافة طلبك الأول!' : 'No orders yet. Add your first order!',
    // errorFetchingOrders: effectiveLang === 'ar' ? 'خطأ في جلب الطلبات' : 'Error Fetching Orders', // No longer directly used for display
  };
  
  return (
    <div className="space-y-8">
      <OrdersPageClientContent 
        initialOrders={ordersData} 
        allBranches={branchesData} 
        lang={effectiveLang} 
        addOrderText={t.addOrder}
        noOrdersYetText={t.noOrdersYet}
        pageTitleText={t.pageTitle}
      />
    </div>
  );
}

