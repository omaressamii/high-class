// Server Component for fetching order data for editing
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Order, Product, Customer, User as AppUser, OrderItem, Branch } from '@/types';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Edit3 } from 'lucide-react';
import { EditOrderClientPage, type EditOrderData } from '@/components/orders/EditOrderClientPage';
import { startOfDay } from 'date-fns';

interface EditOrderPageProps {
  params: {
    lang: 'ar' | 'en';
    orderId: string;
  };
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { lang, orderId } = await params;
  const effectiveLang = lang === 'en' ? 'en' : 'ar';

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تعديل الطلب' : 'Edit Order',
    errorFetchingOrderTitle: effectiveLang === 'ar' ? 'خطأ في جلب بيانات الطلب' : 'Error Fetching Order',
    orderNotFound: effectiveLang === 'ar' ? 'لم يتم العثور على الطلب المطلوب.' : 'The requested order was not found.',
    backToOrders: effectiveLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders',
    backToOrderDetails: effectiveLang === 'ar' ? 'العودة إلى تفاصيل الطلب' : 'Back to Order Details',
  };

  const pageTitleContent = `${t.pageTitle} #${orderId}`;

  let editOrderData: EditOrderData | null = null;

  try {
    // Fetch order data
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnap = await get(orderRef);

    if (!orderSnap.exists()) {
      editOrderData = null;
    } else {
      const orderData = orderSnap.val() as Order;

      // Fetch customer data
      const customerRef = ref(database, `customers/${orderData.customerId}`);
      const customerSnap = await get(customerRef);
      const customer = customerSnap.exists() ? (customerSnap.val() as Customer) : null;

      // Fetch seller data if exists
      let seller: AppUser | null = null;
      if (orderData.sellerId) {
        const sellerRef = ref(database, `users/${orderData.sellerId}`);
        const sellerSnap = await get(sellerRef);
        seller = sellerSnap.exists() ? (sellerSnap.val() as AppUser) : null;
      }

      // Fetch branch data if exists
      let branch: Branch | null = null;
      if (orderData.branchId) {
        const branchRef = ref(database, `branches/${orderData.branchId}`);
        const branchSnap = await get(branchRef);
        branch = branchSnap.exists() ? (branchSnap.val() as Branch) : null;
      }

      // Fetch all products to get current product data
      const productsRef = ref(database, 'products');
      const productsSnap = await get(productsRef);
      const allProducts: Record<string, Product> = productsSnap.exists() ? productsSnap.val() : {};

      // Fetch all customers for the dropdown
      const customersRef = ref(database, 'customers');
      const customersSnap = await get(customersRef);
      const allCustomers: Customer[] = customersSnap.exists() 
        ? Object.entries(customersSnap.val()).map(([id, data]) => ({ id, ...(data as Omit<Customer, 'id'>) }))
        : [];

      // Fetch all users for seller dropdown
      const usersRef = ref(database, 'users');
      const usersSnap = await get(usersRef);
      const allUsers: AppUser[] = usersSnap.exists()
        ? Object.entries(usersSnap.val()).map(([id, data]) => ({ id, ...(data as Omit<AppUser, 'id'>) }))
        : [];

      // Fetch all branches
      const branchesRef = ref(database, 'branches');
      const branchesSnap = await get(branchesRef);
      const allBranches: Branch[] = branchesSnap.exists()
        ? Object.entries(branchesSnap.val()).map(([id, data]) => ({ id, ...(data as Omit<Branch, 'id'>) }))
        : [];

      editOrderData = {
        order: { id: orderId, ...orderData },
        customer,
        seller,
        branch,
        allProducts: Object.entries(allProducts).map(([id, data]) => ({ id, ...data })),
        allCustomers,
        allUsers,
        allBranches,
      };
    }
  } catch (error) {
    console.error('Error fetching order data for editing:', error);
    editOrderData = null;
  }

  if (editOrderData === null) {
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
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}/orders`}>
              <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.backToOrders}
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href={`/${effectiveLang}/orders/${orderId}`}>
              <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.backToOrderDetails}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EditOrderClientPage
      initialEditOrderData={editOrderData}
      lang={effectiveLang}
      orderId={orderId}
    />
  );
}
