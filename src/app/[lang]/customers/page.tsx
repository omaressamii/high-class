
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { CustomerListClientWrapper } from '@/components/customers/CustomerListClientWrapper';
import { ClientAuthWrapperForCustomersPage } from '@/components/customers/ClientAuthWrapperForCustomersPage';
import { ref, get, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button'; // Added for error state
import { AlertCircle } from 'lucide-react'; // Added for error state
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added for error state

async function getCustomersFromRealtimeDB(): Promise<Customer[] | null> {
  // console.log("[SERVER CustomersPage] Attempting to fetch customers from Realtime Database...");
  const customersRef = ref(database, "customers");

  try {
    const customerSnapshot = await get(customersRef);
    // console.log(`[SERVER CustomersPage] Realtime Database query successful.`);

    if (!customerSnapshot.exists()) {
      // console.log("[SERVER CustomersPage] No customers found in Realtime Database.");
      return [];
    }

    const customersData = customerSnapshot.val();
    const customerList: Customer[] = [];

    Object.entries(customersData).forEach(([id, data]: [string, any]) => {
      try {
        // console.log(`[SERVER CustomersPage] Processing customer ID: ${id} with data:`, JSON.stringify(data, null, 2));

        const customer: Customer = {
          id: id,
          fullName: data.fullName || 'N/A',
          phoneNumber: data.phoneNumber || 'N/A',
          address: data.address || undefined,
          idCardNumber: data.idCardNumber || undefined,
          notes: data.notes || undefined,
          createdAt: data.createdAt || undefined, // Already in ISO string format
          createdByUserId: data.createdByUserId || undefined,
        };
        customerList.push(customer);
      } catch (mapError: any) {
        console.error(`[SERVER CustomersPage] Error processing customer ${id}:`, mapError.message, "Customer data:", data);
        // Optionally skip this customer or handle error as needed
      }
    });

    // Sort by creation time, newest first (since Realtime DB doesn't have built-in orderBy like Firestore)
    customerList.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // console.log(`[SERVER CustomersPage] Successfully mapped ${customerList.length} customers.`);
    // console.log("[SERVER CustomersPage] Final customer list to be returned:", JSON.stringify(customerList, null, 2));
    return customerList;

  } catch (fetchError: any) {
    console.error("[SERVER CustomersPage] Realtime Database fetch error in getCustomersFromRealtimeDB: ", fetchError);
    return null; // Indicate an error occurred
  }
}

export default async function CustomersPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  // console.log(`[SERVER CustomersPage] Page rendering for lang: ${effectiveLang}`);

  const customers = await getCustomersFromRealtimeDB();

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'ملفات تعريف العملاء' : 'Customer Profiles',
    addCustomer: effectiveLang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer',
    noCustomers: effectiveLang === 'ar' ? 'لا يوجد عملاء لعرضهم حاليًا.' : 'No customers to display currently.',
    errorFetchingCustomers: effectiveLang === 'ar' ? 'حدث خطأ أثناء جلب بيانات العملاء.' : 'An error occurred while fetching customer data.',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
  };

  if (customers === null) {
    // Handle error state where fetching failed
    return (
      <div className="space-y-8 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <PageTitle>{t.pageTitle}</PageTitle>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg">
              <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {t.errorFetchingCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{effectiveLang === 'ar' ? 'لم نتمكن من تحميل قائمة العملاء. يرجى التحقق من اتصالك بالإنترنت أو محاولة تحديث الصفحة.' : 'We could not load the customer list. Please check your internet connection or try refreshing the page.'}</p>
            {/* Optionally, a button to retry or link to homepage */}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // console.log("[SERVER CustomersPage] Customers data passed to Client Wrapper:", customers ? customers.length : 'null');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <ClientAuthWrapperForCustomersPage lang={effectiveLang} addCustomerText={t.addCustomer} />
      </div>
      
      {customers.length > 0 ? (
        <CustomerListClientWrapper allCustomers={customers} lang={effectiveLang} />
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{t.noCustomers}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {effectiveLang === 'ar' ? 'ابدأ بإضافة عميلك الأول!' : 'Start by adding your first customer!'}
          </p>
        </div>
      )}
    </div>
  );
}

// Placeholder for UsersIcon if not already imported from lucide-react
// import { Users as UsersIcon } from 'lucide-react'; // Ensure this is imported if used above
// For now, I'll assume UsersIcon might be used if no customers are found.
// If not, the import can be removed.
// To avoid potential build error if UsersIcon is not imported from lucide-react
// and it is used in the noCustomers condition. For now, assuming it is imported.
// If not, please ensure `import { Users as UsersIcon } from 'lucide-react'` is present.
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path d="M15 6a3 3 0 11-6 0 3 3 0 016 0zM17 9a5 5 0 10-10 0c0 1.275.563 2.426 1.486 3.258A5.96 5.96 0 007 17.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5 5.96 5.96 0 00-4.486-5.242A4.988 4.988 0 0017 9zm-1.07 3.915A3.002 3.002 0 0012 15a3.002 3.002 0 00-3.93 2.085h7.86zm-8.805 0A5.002 5.002 0 0112 13a5.002 5.002 0 014.875 2.915H7.125z" />
  </svg>
);
