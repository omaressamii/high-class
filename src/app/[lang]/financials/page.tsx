
// src/app/[lang]/financials/page.tsx (NEW Server Component structure)
import type { FinancialTransaction, Branch } from '@/types';
import { ref, get, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { FinancialsPageClientContent } from '@/components/financials/FinancialsPageClientContent';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

async function getFinancialTransactionsFromRealtimeDB(): Promise<FinancialTransaction[] | null> {
  // console.log("[FinancialsPage SERVER] Attempting to fetch financial transactions from Realtime Database...");
  const transactionsRef = ref(database, "financial_transactions");

  try {
    const transactionSnapshot = await get(transactionsRef);
    // console.log(`[FinancialsPage SERVER] Realtime Database query successful.`);

    if (!transactionSnapshot.exists()) {
      // console.log("[FinancialsPage SERVER] No financial transactions found in Realtime Database.");
      return [];
    }

    const transactionsData = transactionSnapshot.val();
    const transactionList: FinancialTransaction[] = [];

    Object.entries(transactionsData).forEach(([id, data]: [string, any]) => {
      try {
        const transaction: FinancialTransaction = {
          id: id,
          date: data.date, // This is likely a string 'yyyy-MM-dd'
          type: data.type,
          transactionCategory: data.transactionCategory,
          description: data.description,
          customerName: data.customerName,
          customerId: data.customerId,
          sellerName: data.sellerName,
          sellerId: data.sellerId,
          processedByUserId: data.processedByUserId,
          processedByUserName: data.processedByUserName,
          orderId: data.orderId,
          orderCode: data.orderCode, // Added orderCode
          amount: Number(data.amount) || 0,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          // createdAt should already be in ISO string format
          createdAt: data.createdAt || new Date().toISOString(),
          productId: data.productId,
          productName: data.productName,
          branchId: data.branchId,
          branchName: data.branchName,
        };
        transactionList.push(transaction);
      } catch (mapError: any) {
        console.error(`[FinancialsPage SERVER] Error processing transaction ${id}:`, mapError.message, "Transaction data:", data);
      }
    });

    // Sort by createdAt descending (since Realtime DB doesn't have built-in orderBy like Firestore)
    transactionList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // console.log(`[FinancialsPage SERVER] Successfully mapped ${transactionList.length} transactions.`);
    return transactionList;

  } catch (fetchError: any) {
    console.error("[FinancialsPage SERVER] Realtime Database fetch error in getFinancialTransactionsFromRealtimeDB: ", fetchError);
    return null;
  }
}

async function getAllBranchesForFinancials(): Promise<Branch[]> {
    const branchesRef = ref(database, "branches");
    // console.log("[FinancialsPage SERVER] Attempting to fetch all branches...");
    try {
        const snapshot = await get(branchesRef);
        if (!snapshot.exists()) {
            return [];
        }

        const branchesData = snapshot.val();
        const branchList = Object.entries(branchesData).map(([id, data]: [string, any]) => {
            return {
                id: id,
                name: data.name,
                address: data.address,
                phoneNumber: data.phoneNumber,
                notes: data.notes,
                createdByUserId: data.createdByUserId,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            } as Branch;
        });

        // Sort by name (since Realtime DB doesn't have built-in orderBy like Firestore)
        branchList.sort((a, b) => a.name.localeCompare(b.name));

        // console.log(`[FinancialsPage SERVER] Fetched ${branchList.length} branches.`);
        return branchList;
    } catch (error) {
        console.error("[FinancialsPage SERVER] Error fetching branches: ", error);
        return [];
    }
}


export default async function FinancialsPageServer({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await routeParams;
  const lang = langParam as 'ar' | 'en';
  const initialTransactions = await getFinancialTransactionsFromRealtimeDB();
  const allBranches = await getAllBranchesForFinancials();

  const t = {
    pageTitle: lang === 'ar' ? 'السجل المالي' : 'Financial Ledger',
    errorFetchingTransactionsTitle: lang === 'ar' ? 'خطأ في جلب المعاملات' : 'Error Fetching Transactions',
    errorFetchingTransactionsMessage: lang === 'ar' ? 'لم نتمكن من تحميل البيانات المالية. يرجى المحاولة مرة أخرى لاحقًا.' : 'We could not load the financial data. Please try again later.',
  };

  if (initialTransactions === null) {
    return (
      <div className="space-y-8 container mx-auto px-4 py-8">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg">
              <AlertCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {t.errorFetchingTransactionsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent><p>{t.errorFetchingTransactionsMessage}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FinancialsPageClientContent
      initialTransactions={initialTransactions}
      allBranches={allBranches}
      lang={lang}
    />
  );
}
