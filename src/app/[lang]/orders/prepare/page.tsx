
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Loader, AlertCircle, PackageSearch, PackageCheck, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Order, Branch, Product, Customer, OrderStatus } from '@/types';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { format, startOfDay } from 'date-fns';
import { PrepareOrderFilters } from '@/components/orders/PrepareOrderFilters';
import { PrepareOrdersTable } from '@/components/orders/PrepareOrdersTable';
import { DeliverOrdersTable } from '@/components/orders/DeliverOrdersTable'; 
import { OrderPreparationDetailsDialog } from '@/components/orders/OrderPreparationDetailsDialog';

type OrderWithDetails = Order & {
  productName?: string;
  customerName?: string;
  customerPhoneNumber?: string;
  branchName?: string;
  isReturnedInThisSession?: boolean
};

export default function PrepareOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const [allFetchedOrders, setAllFetchedOrders] = useState<OrderWithDetails[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(startOfDay(new Date()));
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderWithDetails | null>(null);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تجهيز وتسليم الطلبات' : 'Prepare & Deliver Orders',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingOrders: effectiveLang === 'ar' ? 'جار تحميل الطلبات...' : 'Loading orders...',
    ordersToPrepareTitle: effectiveLang === 'ar' ? 'طلبات قيد التجهيز' : 'Orders for Preparation',
    ordersReadyForDeliveryTitle: effectiveLang === 'ar' ? 'طلبات جاهزة للتسليم' : 'Orders Ready for Delivery',
    noOrdersToPrepare: effectiveLang === 'ar' ? 'لا توجد طلبات لتجهيزها للفترة والفرع المحددين.' : 'No orders to prepare for the selected date range and branch.',
    noOrdersReadyForDelivery: effectiveLang === 'ar' ? 'لا توجد طلبات مجهزة جاهزة للتسليم حاليًا.' : 'No prepared orders ready for delivery currently.',
    errorFetchingOrders: effectiveLang === 'ar' ? 'خطأ في جلب الطلبات.' : 'Error fetching orders.',
    orderMarkedAsPrepared: effectiveLang === 'ar' ? 'تم تحديث حالة الطلب إلى "تم التجهيز".' : 'Order status updated to "Prepared".',
    orderMarkedAsDelivered: effectiveLang === 'ar' ? 'تم تحديث حالة الطلب إلى "تم التسليم للعميل".' : 'Order status updated to "Delivered to Customer".',
    errorMarkingOrder: effectiveLang === 'ar' ? 'خطأ في تحديث حالة الطلب.' : 'Error updating order status.',
    accessDenied: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
    accessDeniedDescription: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لتجهيز أو تسليم الطلبات.' : 'You do not have permission to prepare or deliver orders.',
    noteOrderPrepared: (user: string) => effectiveLang === 'ar' ? `تم تجهيز الطلب بواسطة ${user}.` : `Order prepared by ${user}.`,
    noteOrderDelivered: (user: string) => effectiveLang === 'ar' ? `تم تسليم الطلب للعميل بواسطة ${user}.` : `Order delivered to customer by ${user}.`,
  };

  useEffect(() => {
    if (!authIsLoading && !hasPermission('orders_prepare')) { 
      toast({ title: t.accessDenied, description: t.accessDeniedDescription, variant: 'destructive' });
      router.push(`/${effectiveLang}`);
    }
  }, [authIsLoading, hasPermission, effectiveLang, router, toast, t.accessDenied, t.accessDeniedDescription]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (hasPermission('view_all_branches')) {
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
            setAvailableBranches(branchList);
          } else {
            setAvailableBranches([]);
          }
        } catch (error) {
          console.error("Error fetching branches for filter:", error);
        }
      }
    };
    if (currentUser) {
      fetchBranches();
    }
  }, [currentUser, hasPermission]);

  const fetchOrders = useCallback(async () => {
    if (!currentUser || !hasPermission('orders_prepare')) return;
    setIsLoadingOrders(true);
    setFetchError(null);

    try {
      // Fetch all orders from Realtime Database
      const ordersRef = ref(database, 'orders');
      const ordersSnapshot = await get(ordersRef);

      if (!ordersSnapshot.exists()) {
        setAllFetchedOrders([]);
        setIsLoadingOrders(false);
        return;
      }

      const ordersData = ordersSnapshot.val();
      let fetchedOrdersRaw: Order[] = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
        id,
        ...data
      } as Order));

      // Client-side filtering since Realtime DB doesn't support complex queries
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      fetchedOrdersRaw = fetchedOrdersRaw.filter(order => {
        // Filter by delivery date range
        if (order.deliveryDate < startDateStr || order.deliveryDate > endDateStr) {
          return false;
        }

        // Filter by status (only Ongoing and Prepared orders)
        if (!['Ongoing', 'Prepared'].includes(order.status)) {
          return false;
        }

        // Filter by branch permissions
        if (hasPermission('view_all_branches') && selectedBranchId !== 'all') {
          return order.branchId === selectedBranchId;
        } else if (!hasPermission('view_all_branches') && currentUser?.branchId) {
          return order.branchId === currentUser.branchId;
        } else if (!hasPermission('view_all_branches') && !currentUser?.branchId) {
          return false;
        }

        return true;
      });

      // Sort by createdAt descending (since Realtime DB doesn't have built-in orderBy like Firestore)
      fetchedOrdersRaw.sort((a, b) => {
        const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreatedAt - aCreatedAt;
      });

      // Fetch referenced data from Realtime Database
      const [productsSnapshot, customersSnapshot, branchesSnapshot] = await Promise.all([
        get(ref(database, 'products')),
        get(ref(database, 'customers')),
        get(ref(database, 'branches'))
      ]);

      // Build products map
      const productsMap = new Map<string, Product>();
      if (productsSnapshot.exists()) {
        Object.entries(productsSnapshot.val()).forEach(([id, data]) => {
          productsMap.set(id, { id, ...data } as Product);
        });
      }

      // Build customers map
      const customersMap = new Map<string, Customer>();
      if (customersSnapshot.exists()) {
        Object.entries(customersSnapshot.val()).forEach(([id, data]) => {
          customersMap.set(id, { id, ...data } as Customer);
        });
      }

      // Build branches map (combine with availableBranches)
      const branchesMap = new Map<string, Branch>(availableBranches.map(b => [b.id, b]));
      if (branchesSnapshot.exists()) {
        Object.entries(branchesSnapshot.val()).forEach(([id, data]) => {
          if (!branchesMap.has(id)) {
            branchesMap.set(id, { id, ...data } as Branch);
          }
        });
      }

      const resolvedOrders: OrderWithDetails[] = fetchedOrdersRaw.map(order => {
        // For new orders with items array, get product name from first item
        let productName = order.productName;
        if (order.items && order.items.length > 0) {
          productName = order.items[0].productName;
        } else if (order.productId) {
          const product = productsMap.get(order.productId);
          productName = product?.name || order.productName || order.productId;
        }

        const customer = customersMap.get(order.customerId);
        const branch = branchesMap.get(order.branchId || '');

        return {
          ...order,
          id: order.id,
          productName: productName || order.productId,
          customerName: customer?.fullName || order.customerName || order.customerId,
          customerPhoneNumber: customer?.phoneNumber,
          branchName: branch?.name || order.branchName || (order.branchId ? (effectiveLang === 'ar' ? 'فرع غير معروف' : 'Unknown Branch') : undefined),
          orderDate: String(order.orderDate),
          deliveryDate: String(order.deliveryDate),
          returnDate: order.returnDate ? String(order.returnDate) : undefined,
        } as OrderWithDetails;
      });
      
      setAllFetchedOrders(resolvedOrders);
      if (resolvedOrders.length === 0) {
        setFetchError(t.noOrdersToPrepare); 
      } else {
        setFetchError(null);
      }

    } catch (error) {
      console.error("Error fetching orders:", error);
      setFetchError(t.errorFetchingOrders);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentUser, startDate, endDate, selectedBranchId, hasPermission, effectiveLang, t.errorFetchingOrders, t.noOrdersToPrepare, availableBranches]);

  useEffect(() => {
    if (currentUser && hasPermission('orders_prepare')) { 
      fetchOrders();
    }
  }, [fetchOrders, currentUser, hasPermission]);

  const ongoingForPreparationOrders = useMemo(() => {
    return allFetchedOrders.filter(order => order.status === 'Ongoing');
  }, [allFetchedOrders]);

  const readyForDeliveryOrders = useMemo(() => {
    return allFetchedOrders.filter(order => order.status === 'Prepared');
  }, [allFetchedOrders]);


  const handleMarkAsPrepared = async (orderId: string) => {
    if (!hasPermission('orders_prepare') || !currentUser) {
      toast({ title: t.accessDenied, description: t.accessDeniedDescription, variant: 'destructive' });
      return;
    }
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const orderSnap = await get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error("Order not found for preparation update.");
      }

      const orderData = orderSnap.val();
      const existingNotes = orderData.notes || '';
      const currentUserFullName = currentUser.fullName || currentUser.username || 'SystemUser';
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const preparationNote = `[${timestamp}] - ${t.noteOrderPrepared(currentUserFullName)}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${preparationNote}` : preparationNote;

      await update(orderRef, {
        status: 'Prepared',
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      toast({ title: t.orderMarkedAsPrepared });
      setAllFetchedOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Prepared' } : order
        )
      );
    } catch (error) {
      console.error("Error marking order as prepared:", error);
      toast({ title: t.errorMarkingOrder, variant: 'destructive' });
    }
  };
  
  const handleMarkAsDelivered = async (orderId: string) => {
    if (!hasPermission('orders_prepare') || !currentUser) {
      toast({ title: t.accessDenied, description: t.accessDeniedDescription, variant: 'destructive' });
      return;
    }
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const orderSnap = await get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error("Order not found for delivery update.");
      }

      const orderData = orderSnap.val();

      // Check if there's a remaining amount that needs to be paid
      const remainingAmount = orderData.remainingAmount || 0;
      if (remainingAmount > 0) {
        toast({
          title: effectiveLang === 'ar' ? 'لا يمكن التسليم' : 'Cannot Deliver',
          description: effectiveLang === 'ar'
            ? `يجب سداد المبلغ المتبقي (${remainingAmount.toFixed(2)} ${effectiveLang === 'ar' ? 'جنيه' : 'SAR'}) قبل التسليم`
            : `Remaining amount (${remainingAmount.toFixed(2)} SAR) must be paid before delivery`,
          variant: 'destructive'
        });
        return;
      }

      const existingNotes = orderData.notes || '';
      const currentUserFullName = currentUser.fullName || currentUser.username || 'SystemUser';
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const deliveryNote = `[${timestamp}] - ${t.noteOrderDelivered(currentUserFullName)}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${deliveryNote}` : deliveryNote;

      await update(orderRef, {
        status: 'Delivered to Customer',
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      toast({ title: t.orderMarkedAsDelivered });
      setAllFetchedOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Delivered to Customer' } : order
        )
      );
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast({ title: t.errorMarkingOrder, variant: 'destructive' });
    }
  };


  const handleOpenDetailsModal = (order: OrderWithDetails) => {
    setSelectedOrderForModal(order);
    setIsDetailsModalOpen(true);
  };

  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingPage}</p>
      </div>
    );
  }
  
  if (!hasPermission('orders_prepare')) { 
    return null;
  }

  return (
    <div className="space-y-8">
      <PageTitle>{t.pageTitle}</PageTitle>
      
      <PrepareOrderFilters
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        availableBranches={availableBranches}
        showBranchFilter={hasPermission('view_all_branches')}
        lang={effectiveLang}
        onFilter={fetchOrders}
      />

      {isLoadingOrders && (
        <div className="flex justify-center items-center min-h-[20rem]">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 rtl:mr-3">{t.loadingOrders}</p>
        </div>
      )}

      {!isLoadingOrders && fetchError && (!ongoingForPreparationOrders.length && !readyForDeliveryOrders.length) && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg">
              <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {t.errorFetchingOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{fetchError}</p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <PackageSearch className="mr-2 h-6 w-6 text-primary rtl:ml-2 rtl:mr-0" />
            {t.ordersToPrepareTitle}
          </CardTitle>
          <CardDescription>
            {effectiveLang === 'ar' ? 'الطلبات التي تحتاج إلى تجهيزها للتسليم في الفترة المحددة.' : 'Orders that need to be prepared for delivery in the selected period.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoadingOrders && !fetchError && ongoingForPreparationOrders.length === 0 && (
            <p className="text-muted-foreground text-center py-4">{t.noOrdersToPrepare}</p>
          )}
          {!isLoadingOrders && !fetchError && ongoingForPreparationOrders.length > 0 && (
            <PrepareOrdersTable
              orders={ongoingForPreparationOrders}
              onMarkAsPrepared={handleMarkAsPrepared}
              onViewDetails={handleOpenDetailsModal}
              lang={effectiveLang}
              hasEditPermission={hasPermission('orders_prepare')} 
            />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <PackageCheck className="mr-2 h-6 w-6 text-green-600 rtl:ml-2 rtl:mr-0" />
            {t.ordersReadyForDeliveryTitle}
          </CardTitle>
          <CardDescription>
            {effectiveLang === 'ar' ? 'الطلبات التي تم تجهيزها وهي جاهزة للتسليم للعميل.' : 'Orders that have been prepared and are ready for customer delivery.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoadingOrders && !fetchError && readyForDeliveryOrders.length === 0 && (
             <p className="text-muted-foreground text-center py-4">{t.noOrdersReadyForDelivery}</p>
          )}
          {!isLoadingOrders && !fetchError && readyForDeliveryOrders.length > 0 && (
            <DeliverOrdersTable
              orders={readyForDeliveryOrders}
              onMarkAsDelivered={handleMarkAsDelivered}
              onViewDetails={handleOpenDetailsModal}
              lang={effectiveLang}
              hasEditPermission={hasPermission('orders_prepare')}
              currentUserName={currentUser?.fullName || currentUser?.username || 'Unknown User'}
            />
          )}
        </CardContent>
      </Card>


      {selectedOrderForModal && (
        <OrderPreparationDetailsDialog
          isOpen={isDetailsModalOpen}
          setIsOpen={setIsDetailsModalOpen}
          order={selectedOrderForModal}
          lang={effectiveLang}
        />
      )}
    </div>
  );
}
