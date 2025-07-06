
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useParams can be removed if lang is a prop
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { FinancialTransactionTable } from '@/components/financials/FinancialTransactionTable';
import { FinancialTransactionCard } from '@/components/financials/FinancialTransactionCard';
import { FinancialsFilters } from '@/components/financials/FinancialsFilters';
import type { FinancialTransaction, User, FinancialTransactionType, Branch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealtimeStatus } from '@/components/shared/RealtimeStatus';
import { useRealtimeFinancials } from '@/context/RealtimeDataContext';
import { Banknote, TrendingUp, Users as UsersIconLucide, FilterX, PlusCircle, Loader, AlertCircle, Eye, EyeOff, Store, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
// Firestore imports might not be needed here if all data comes via props
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { parseISO, isWithinInterval, format, startOfDay, endOfDay } from 'date-fns';

interface FinancialsPageClientContentProps {
  initialTransactions: FinancialTransaction[];
  allBranches: Branch[];
  lang: 'ar' | 'en';
}

export function FinancialsPageClientContent({ initialTransactions, allBranches, lang }: FinancialsPageClientContentProps) {
  const router = useRouter(); // useRouter might still be needed for navigation
  const { toast } = useToast();
  const { isLoading: authIsLoading, currentUser, hasPermission } = useAuth();
  const { financialTransactions: realtimeTransactions, isLoading: realtimeLoading, connectionStatus } = useRealtimeFinancials();
  const effectiveLang = lang;
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use real-time data if available, otherwise fallback to server data
  const allTransactions = realtimeTransactions.length > 0 ? realtimeTransactions : initialTransactions;
  // isLoadingTransactions and errorFetchingTransactions are handled by the server component for initial load
  // However, you might want client-side loading/error states for subsequent actions or re-filtering if it involves new fetches.
  // For now, we assume initial load handles loading/error.
  
  const [isLoadingBranches, setIsLoadingBranches] = useState(false); // Kept if branches might be re-fetched or filtered client-side separately
  const [selectedPageBranchId, setSelectedPageBranchId] = useState<string>('all');


  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    transactionType: FinancialTransactionType | 'all';
    transactionCategory: string | 'all';
    startDate?: Date;
    endDate?: Date;
    branchId?: string | 'all';
  }>({
    transactionType: 'all',
    transactionCategory: 'all',
    startDate: new Date(), 
    endDate: new Date(),   
    branchId: 'all',
  });
  const [showDetailedFinancials, setShowDetailedFinancials] = useState(false);
  
  // Note: We now use real-time data directly, so no need to sync with initialTransactions
  // The allTransactions variable is computed from real-time data above

  useEffect(() => {
    if (!authIsLoading && !hasPermission('financials_view')) {
      toast({
        title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لعرض السجلات المالية.' : 'You do not have permission to view financials.',
        variant: 'destructive',
      });
      router.push(`/${effectiveLang}`);
      return;
    }
    
    // If user doesn't have view_all_branches, set their branch as the selected one from client-side context
    if (!authIsLoading && currentUser && !hasPermission('view_all_branches') && currentUser.branchId) {
        setSelectedPageBranchId(currentUser.branchId);
        // Also apply this to the filter component's branchId if necessary, or ensure `FinancialsFilters`
        // is aware of the page-level branch context.
        setFilters(prev => ({ ...prev, branchId: currentUser.branchId! }));
    }


  }, [authIsLoading, currentUser, hasPermission, effectiveLang, router, toast]);


  const t = {
    pageTitle: effectiveLang === 'ar' ? 'السجل المالي' : 'Financial Ledger',
    pageDescription: effectiveLang === 'ar' ? 'عرض جميع المعاملات المالية بما في ذلك المبيعات، الإيجارات، والدفعات المستلمة.' : 'View all financial transactions including sales, rentals, and payments received.',
    overallSummaryTitle: effectiveLang === 'ar' ? 'الملخص المالي العام (حسب الفلتر)' : 'Overall Financial Summary (Filtered)',
    overallSummaryDescription: effectiveLang === 'ar' ? 'نظرة عامة على الدخل المسجل وعدد المعاملات للفترة والتصنيفات المحددة.' : 'Overview of recorded income and transaction count for the selected period and categories.',
    totalIncome: effectiveLang === 'ar' ? 'إجمالي الدخل (المسجل)' : 'Total Recorded Income',
    totalTransactions: effectiveLang === 'ar' ? 'إجمالي المعاملات' : 'Total Transactions',
    processorActivityTitle: effectiveLang === 'ar' ? 'نشاط المسجلين (الكاشير/المدير)' : "Processors' Activity (Cashier/Admin)",
    processorActivityDescription: effectiveLang === 'ar' ? 'ملخص الدفعات المستلمة وعددها لكل مسجل، مفلترة حسب الفترة والتصنيفات المحددة. اضغط على اسم المسجل لفلترة دفعاته أدناه.' : "Summary of payments received and their count per processor, filtered by the selected period and categories. Click a processor's name to filter their payments below.",
    transactionsForProcessor: (processorName: string) => effectiveLang === 'ar' ? `دفعات المسجل: ${processorName}` : `Payments by: ${processorName}`,
    allTransactions: effectiveLang === 'ar' ? 'جميع المعاملات' : 'All Transactions',
    transactionsCountLabel: effectiveLang === 'ar' ? 'عدد الدفعات' : 'Payments Count',
    totalAmountLabel: effectiveLang === 'ar' ? 'إجمالي المدفوع' : 'Total Paid',
    showAllProcessors: effectiveLang === 'ar' ? 'عرض كل المعاملات' : 'Show All Transactions',
    unknownSeller: effectiveLang === 'ar' ? 'بائع غير محدد' : 'Unassigned Seller',
    unknownProcessor: effectiveLang === 'ar' ? 'معالج غير معروف' : 'Unknown Processor',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    dailySummaryNote: effectiveLang === 'ar' ? 'ملاحظة: يعرض ملخص المسجلين بيانات "الدفعات المستلمة" فقط، بناءً على الفلاتر المطبقة.' : "Note: Processor summary shows 'Payment Received' data only, based on applied filters.",
    addNewPayment: effectiveLang === 'ar' ? 'إضافة دفعة جديدة' : 'Add New Payment',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    // loadingTransactions no longer primarily managed here for initial load
    noTransactionsToDisplay: effectiveLang === 'ar' ? 'لا توجد معاملات مالية لعرضها حاليًا.' : 'No financial transactions to display currently.',
    filterSectionTitle: effectiveLang === 'ar' ? 'تصفية المعاملات' : 'Filter Transactions',
    transactionTypeFilterLabel: effectiveLang === 'ar' ? 'نوع المعاملة' : 'Transaction Type',
    transactionCategoryFilterLabel: effectiveLang === 'ar' ? 'فئة المعاملة' : 'Transaction Category',
    allTransactionTypes: effectiveLang === 'ar' ? 'كل الأنواع' : 'All Types',
    allTransactionCategories: effectiveLang === 'ar' ? 'كل الفئات' : 'All Categories',
    filterStartDateLabel: effectiveLang === 'ar' ? 'من تاريخ' : 'From Date',
    filterEndDateLabel: effectiveLang === 'ar' ? 'إلى تاريخ' : 'To Date',
    clearFiltersButton: effectiveLang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters',
    typeSale: effectiveLang === 'ar' ? 'قيمة بيع أولية' : 'Initial Sale Value',
    typeRental: effectiveLang === 'ar' ? 'قيمة إيجار أولية' : 'Initial Rental Value',
    typePaymentReceived: effectiveLang === 'ar' ? 'دفعة مستلمة' : 'Payment Received',
    showDetailedFinancialsLabel: effectiveLang === 'ar' ? 'إظهار التفاصيل المالية (إيرادات/قيم أولية)' : 'Show Detailed Financials (Revenue/Initial Values)',
    hideDetailedFinancialsLabel: effectiveLang === 'ar' ? 'إخفاء التفاصيل المالية (إيرادات/قيم أولية)' : 'Hide Detailed Financials (Revenue/Initial Values)',
    branchFilterLabel: effectiveLang === 'ar' ? 'فلترة حسب الفرع:' : 'Filter by Branch:',
    allBranchesText: effectiveLang === 'ar' ? 'كل الفروع' : 'All Branches',
    selectBranchPlaceholder: effectiveLang === 'ar' ? 'اختر الفرع' : 'Select Branch',
    loadingBranches: effectiveLang === 'ar' ? 'جار تحميل الفروع...' : 'Loading branches...',
  };

  const displayedTransactions = useMemo(() => {
    let transactions = allTransactions;

    // Page-level branch filtering
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
      transactions = transactions.filter(tx => tx.branchId === currentUser.branchId);
    } else if (hasPermission('view_all_branches') && selectedPageBranchId !== 'all') {
      transactions = transactions.filter(tx => tx.branchId === selectedPageBranchId);
    }

    return transactions.filter(tx => {
      if (!showDetailedFinancials) {
        if (tx.transactionCategory === 'Rental Revenue' || tx.type === 'Initial Sale Value') {
          return false;
        }
      }

      if (selectedProcessor) {
        if ((tx.processedByUserName || t.unknownProcessor) !== selectedProcessor) {
          return false;
        }
         if (!tx.paymentMethod || tx.paymentMethod === '') {
           return false;
        }
      }
      
      if (filters.transactionType !== 'all' && tx.type !== filters.transactionType) {
        return false;
      }
      if (filters.transactionCategory !== 'all' && tx.transactionCategory !== filters.transactionCategory) {
        return false;
      }

      let dateMatch = true;
      if (filters.startDate || filters.endDate) {
        const transactionDateString = tx.createdAt || tx.date;
        if (!transactionDateString) {
          dateMatch = false;
        } else {
          try {
            let effectiveTransactionDate: Date;
            if (tx.createdAt) { // Timestamps converted to ISO strings
              effectiveTransactionDate = parseISO(tx.createdAt);
            } else { // 'yyyy-MM-dd' strings for tx.date
              const parts = tx.date.split('-');
              effectiveTransactionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }

            const start = filters.startDate ? startOfDay(filters.startDate) : null;
            const end = filters.endDate ? endOfDay(filters.endDate) : null;

            if (start && effectiveTransactionDate < start) {
              dateMatch = false;
            }
            if (end && effectiveTransactionDate > end) {
              dateMatch = false;
            }
          } catch (e) {
            console.warn("Error parsing date for filtering:", transactionDateString, e);
            dateMatch = false;
          }
        }
      }
      if (!dateMatch) return false;

      return true;
    });
  }, [allTransactions, selectedPageBranchId, selectedProcessor, filters, t.unknownProcessor, showDetailedFinancials, currentUser, hasPermission]);


  const filteredOverallTotalIncome = useMemo(() => {
    // Only count actual payments received
    // Discounts are already applied to remainingAmount, so we shouldn't double-subtract them
    const income = displayedTransactions
      .filter(tx => tx.type === 'Payment Received')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return income;
  }, [displayedTransactions]);

  const processorSummaries = useMemo(() => {
    const summaryMap: Record<string, { totalAmount: number; transactionCount: number }> = {};
    
    let transactionsToConsider = allTransactions.filter(tx => tx.type === 'Payment Received');

    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
      transactionsToConsider = transactionsToConsider.filter(tx => tx.branchId === currentUser.branchId);
    } else if (hasPermission('view_all_branches') && selectedPageBranchId !== 'all') {
        transactionsToConsider = transactionsToConsider.filter(tx => tx.branchId === selectedPageBranchId);
    }

    if (filters.startDate || filters.endDate) {
      transactionsToConsider = transactionsToConsider.filter(tx => {
        const transactionDateString = tx.createdAt || tx.date;
        if (!transactionDateString) return false;
        try {
          let effectiveTransactionDate: Date;
          if (tx.createdAt) effectiveTransactionDate = parseISO(tx.createdAt);
          else {
            const parts = tx.date.split('-');
            effectiveTransactionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
          const start = filters.startDate ? startOfDay(filters.startDate) : null;
          const end = filters.endDate ? endOfDay(filters.endDate) : null;

          if (start && effectiveTransactionDate < start) return false;
          if (end && effectiveTransactionDate > end) return false;
          return true;
        } catch (e) { 
          console.warn("Error parsing date for processor summary filtering:", transactionDateString, e);
          return false; 
        }
      });
    }

    if (filters.transactionType !== 'all') {
        transactionsToConsider = transactionsToConsider.filter(tx => tx.type === filters.transactionType);
    }

    if (filters.transactionCategory !== 'all') {
        transactionsToConsider = transactionsToConsider.filter(tx => tx.transactionCategory === filters.transactionCategory);
    }

    transactionsToConsider.forEach(tx => {
        const processor = tx.processedByUserName || t.unknownProcessor;
        if (!summaryMap[processor]) {
          summaryMap[processor] = { totalAmount: 0, transactionCount: 0 };
        }
        summaryMap[processor].totalAmount += tx.amount;
        summaryMap[processor].transactionCount += 1;
    });

    // Note: We don't subtract discounts from processor summaries because
    // discounts are already applied to remainingAmount in orders.
    // Subtracting discount transactions would result in double-counting the discount.

    return Object.entries(summaryMap).map(([processorName, data]) => ({
      processorName,
      ...data,
    })).sort((a,b) => b.totalAmount - a.totalAmount);
  }, [allTransactions, filters, selectedPageBranchId, currentUser, hasPermission, t.unknownProcessor]);

  const availableCategories = useMemo(() => {
    const categories = new Set(allTransactions.map(tx => tx.transactionCategory).filter(Boolean));
    return Array.from(categories) as string[];
  }, [allTransactions]);


  if (authIsLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 rtl:mr-4">{t.loadingPage}</p>
      </div>
    );
  }

  if (!hasPermission('financials_view')) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        {hasPermission('payments_record') && (
          <Button asChild variant="default">
            <Link href={`/${effectiveLang}/payments/new`}>
              <PlusCircle className={effectiveLang === 'ar' ? 'ml-2' : 'mr-2'} />
              {t.addNewPayment}
            </Link>
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">{t.pageDescription}</p>

      {/* Real-time status indicator */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{effectiveLang === 'ar' ? 'تحديث البيانات' : 'Real-time Data'}</h3>
          <RealtimeStatus lang={effectiveLang} compact showLastUpdated />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => setShowDetailedFinancials(prev => !prev)}
        >
          {showDetailedFinancials ? (
            <>
              <EyeOff className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.hideDetailedFinancialsLabel}
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.showDetailedFinancialsLabel}
            </>
          )}
        </Button>
        {hasPermission('view_all_branches') && (
          <div className="flex items-center gap-2">
            <Label htmlFor="pageBranchFilter" className="text-sm font-medium flex items-center">
              <Store className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0 text-primary" />
              {t.branchFilterLabel}
            </Label>
            <Select
              value={selectedPageBranchId}
              onValueChange={(value) => setSelectedPageBranchId(value)}
              dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <SelectTrigger id="pageBranchFilter" className="w-auto min-w-[180px]">
                <SelectValue placeholder={t.selectBranchPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allBranchesText}</SelectItem>
                {allBranches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!hasPermission('view_all_branches') && currentUser?.branchName && (
           <div className="flex items-center gap-2 text-sm">
              <Store className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0 text-primary" />
              <span className="font-medium">{t.branchFilterLabel}</span>
              <span className="text-muted-foreground">{currentUser.branchName}</span>
          </div>
        )}
      </div>

      <FinancialsFilters
        filters={filters}
        setFilters={setFilters}
        lang={effectiveLang}
        availableCategories={availableCategories}
        // Branches prop not needed directly by FinancialsFilters if page level handles branch context
      />

      <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Banknote className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.overallSummaryTitle}
          </CardTitle>
          <CardDescription>{t.overallSummaryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-md shadow">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500 rtl:ml-2 rtl:mr-0" />
              {t.totalIncome}
            </h3>
            <p className="text-2xl font-bold">{t.currencySymbol} {filteredOverallTotalIncome.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-card rounded-md shadow">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <UsersIconLucide className="mr-2 h-4 w-4 text-blue-500 rtl:ml-2 rtl:mr-0" />
              {t.totalTransactions}
            </h3>
            <p className="text-2xl font-bold">{displayedTransactions.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <UsersIconLucide className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.processorActivityTitle}
          </CardTitle>
          <CardDescription>
            {t.processorActivityDescription}
            <span className="block mt-1 text-xs">{t.dailySummaryNote}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {processorSummaries.map(summary => (
            <Button
              key={summary.processorName}
              variant={selectedProcessor === summary.processorName ? "default" : "outline"}
              onClick={() => setSelectedProcessor(summary.processorName)}
              className={`flex flex-col h-auto p-3 items-start shadow-sm hover:shadow-md rounded-md ${selectedProcessor === summary.processorName ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              size="lg"
            >
              <span className="font-semibold text-base">{summary.processorName}</span>
              <span className="text-xs text-muted-foreground">{t.transactionsCountLabel}: {summary.transactionCount}</span>
              <span className="text-xs text-muted-foreground">{t.totalAmountLabel}: {t.currencySymbol} {summary.totalAmount.toFixed(2)}</span>
            </Button>
          ))}
          {selectedProcessor && (
            <Button variant="ghost" onClick={() => setSelectedProcessor(null)} className="flex items-center gap-2 text-sm">
              <FilterX className="h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.showAllProcessors}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 mb-2">
        {selectedProcessor ? (
          <h2 className="text-xl font-semibold">{t.transactionsForProcessor(selectedProcessor)}</h2>
        ) : (
          <h2 className="text-xl font-semibold">{t.allTransactions}</h2>
        )}
      </div>

      {displayedTransactions.length > 0 ? (
        isMobile ? (
          <div className="space-y-4">
            {displayedTransactions.map((tx, index) => (
              <FinancialTransactionCard key={tx.id} transaction={tx} lang={effectiveLang} serialNumber={index + 1} />
            ))}
          </div>
        ) : (
          <FinancialTransactionTable transactions={displayedTransactions} lang={effectiveLang} />
        )
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t.noTransactionsToDisplay}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
