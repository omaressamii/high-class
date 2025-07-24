// Server Component for fetching customer data
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Customer, Order, User as AppUser } from '@/types';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { CustomerDetailClientPage, type CustomerDetailsData } from '@/components/customers/CustomerDetailClientPage';

interface CustomerDetailsPageProps {
  params: { lang: string; customerId: string };
}

function serializeTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp.toISOString) return timestamp.toISOString();
  return String(timestamp);
}

async function getCustomerDetailsFromRealtimeDB(customerId: string): Promise<CustomerDetailsData | null> {
  try {
    // Fetch customer data
    const customerRef = ref(database, `customers/${customerId}`);
    const customerSnap = await get(customerRef);
    
    if (!customerSnap.exists()) {
      return null;
    }

    const rawCustomer = customerSnap.val();
    const customerData: Customer = {
      id: customerId,
      fullName: rawCustomer.fullName,
      phoneNumber: rawCustomer.phoneNumber,
      address: rawCustomer.address,
      idCardNumber: rawCustomer.idCardNumber,
      notes: rawCustomer.notes,
      branchId: rawCustomer.branchId,
      branchName: rawCustomer.branchName,
      createdByUserId: rawCustomer.createdByUserId,
      createdAt: serializeTimestamp(rawCustomer.createdAt),
    };

    // Fetch customer's orders - get all orders and filter locally to avoid index requirement
    const ordersRef = ref(database, 'orders');
    const ordersSnap = await get(ordersRef);

    let customerOrders: Order[] = [];
    if (ordersSnap.exists()) {
      const ordersData = ordersSnap.val();
      // Filter orders for this specific customer
      const filteredOrders = Object.entries(ordersData).filter(([, orderData]: [string, any]) =>
        orderData.customerId === customerId
      );

      customerOrders = filteredOrders.map(([orderId, orderData]: [string, any]) => ({
        id: orderId,
        orderCode: orderData.orderCode,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        branchId: orderData.branchId,
        branchName: orderData.branchName,
        sellerId: orderData.sellerId,
        sellerName: orderData.sellerName,
        processorId: orderData.processorId,
        processorName: orderData.processorName,
        orderDate: serializeTimestamp(orderData.orderDate),
        transactionType: orderData.transactionType,
        status: orderData.status,
        items: orderData.items || [],
        totalPrice: orderData.totalPrice || 0,
        totalPaid: orderData.totalPaid || 0,
        remainingBalance: orderData.remainingBalance || 0,
        discount: orderData.discount || 0,
        notes: orderData.notes,
        specialInstructions: orderData.specialInstructions,
        createdAt: serializeTimestamp(orderData.createdAt),
        updatedAt: serializeTimestamp(orderData.updatedAt),
      }));
      
      // Sort orders by date (newest first)
      customerOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }

    return {
      customer: customerData,
      orders: customerOrders,
    };

  } catch (error) {
    console.error("Error fetching customer details from Realtime Database:", error);
    return null;
  }
}

export default async function CustomerDetailsPageServer({ params: routeParams }: { params: Promise<{ lang: string; customerId: string }> }) {
  const { lang, customerId } = await routeParams;
  const langTyped = lang as 'ar' | 'en';
  const effectiveLang = langTyped;

  const customerDetails = await getCustomerDetailsFromRealtimeDB(customerId);

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تفاصيل العميل' : 'Customer Details',
    errorFetchingCustomerTitle: effectiveLang === 'ar' ? 'خطأ في جلب بيانات العميل' : 'Error Fetching Customer',
    customerNotFound: effectiveLang === 'ar' ? 'العميل غير موجود أو تم حذفه.' : 'Customer not found or has been deleted.',
    backToCustomers: effectiveLang === 'ar' ? 'العودة للعملاء' : 'Back to Customers',
  };

  const pageTitleContent = customerDetails?.customer 
    ? `${t.pageTitle}: ${customerDetails.customer.fullName}`
    : t.pageTitle;

  if (customerDetails === null) { 
    return (
      <div className="space-y-8 text-center py-12">
        <PageTitle>{pageTitleContent}</PageTitle>
        <div className="border-destructive bg-destructive/10 max-w-md mx-auto rounded-lg p-6">
          <h3 className="text-destructive flex items-center text-lg justify-center font-semibold">
            <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.errorFetchingCustomerTitle}
          </h3>
          <p className="mt-2 text-sm">{t.customerNotFound}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/customers`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.backToCustomers}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <CustomerDetailClientPage
      initialCustomerDetails={customerDetails}
      lang={effectiveLang}
      customerId={customerId}
    />
  );
}
