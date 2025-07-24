
'use client'; // This page now needs client-side auth checks

import React, { Suspense, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useParams, useSearchParams
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RealtimeMetrics } from '@/components/dashboard/RealtimeMetrics';
import { LayoutDashboard, DollarSign, ClipboardList, Undo2, PackageCheck, AlertTriangle, Loader, Calendar, Database, Download, Upload } from 'lucide-react';
import type { Order, User, OrderStatus } from '@/types';
import { DatePickerClient } from '@/components/dashboard/DatePickerClient';
import { useAuth } from '@/context/AuthContext'; // For permission check
import { useToast } from '@/hooks/use-toast'; // For notifications

import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";
import { format, startOfDay, endOfDay, isSameDay, isPast, parseISO, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';


// Helper function to safely parse dates, accommodating strings and numbers
function safeParseDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    try {
      let parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        return parsed;
      }
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        parsed = new Date(Date.UTC(year, month, day));
        if (isValid(parsed)) {
            return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
        }
      }
    } catch (e) {
      return null;
    }
  }
  if (typeof dateInput === 'number') {
    try {
      const parsed = new Date(dateInput);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      return null;
    }
  }
  if (dateInput instanceof Date && isValid(dateInput)) {
      return dateInput;
  }
  return null;
}


interface StatCardServerProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  lang: 'ar' | 'en';
  href?: string;
  dateQuery?: string;
  permissionRequired?: string; // Already exists
}

// Renamed to StatCard as it's now part of a client component page
function StatCard({ title, value, icon: Icon, description, lang, href, dateQuery }: StatCardServerProps) {
  const cardContent = (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{title}</CardTitle>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${lang === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'} text-primary flex-shrink-0`} />
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-lg sm:text-2xl font-bold text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1 leading-tight">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    const finalHref = dateQuery ? `${href}?date=${dateQuery}` : href;
    return (
      <Link href={finalHref} className="block h-full">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}

interface DashboardStats {
  activeRentalsCount: number;
  salesForSelectedDateValue: number;
  rentalsForSelectedDateValue: number;
  returnsForSelectedDateCount: number;
  deliveriesForSelectedDateCount: number;
  overdueOrdersCount: number;
}

// This function will now be called client-side or passed data from server
async function getDashboardStats(
  selectedDate: Date,
  currentUserForStats: User | null // Changed from currentUserServer
): Promise<DashboardStats> {

  const stats: DashboardStats = {
    activeRentalsCount: 0,
    salesForSelectedDateValue: 0,
    rentalsForSelectedDateValue: 0,
    returnsForSelectedDateCount: 0,
    deliveriesForSelectedDateCount: 0,
    overdueOrdersCount: 0,
  };

  const ordersRef = ref(database, "orders");

  try {
    const orderSnapshot = await get(ordersRef);

    if (!orderSnapshot.exists()) {
      return stats;
    }

    const ordersData = orderSnapshot.val();
    let allFetchedOrders: Order[] = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
      id,
      ...data
    } as Order));

    // Filter by branch if user doesn't have view_all_branches permission
    if (currentUserForStats && !currentUserForStats.permissions?.includes('view_all_branches') && currentUserForStats.branchId) {
      allFetchedOrders = allFetchedOrders.filter(order => order.branchId === currentUserForStats.branchId);
    } else if (currentUserForStats && !currentUserForStats.permissions?.includes('view_all_branches') && !currentUserForStats.branchId) {
      return stats;
    }

    const todayStart = startOfDay(new Date());

    allFetchedOrders.forEach(order => {
      if (
        order.transactionType === 'Rental' &&
        (order.status === 'Ongoing' || order.status === 'Pending Preparation' || order.status === 'Prepared' || order.status === 'Delivered to Customer')
      ) {
        stats.activeRentalsCount++;
      }

      const orderCreationDate = safeParseDate(order.orderDate);
      if (orderCreationDate && isSameDay(orderCreationDate, selectedDate)) {
        // Calculate effective value after discount
        const discountAmount = order.discountAmount || 0;
        const effectiveValue = (order.totalPrice || 0) - discountAmount;

        if (order.transactionType === 'Sale' && order.status === 'Completed') {
          stats.salesForSelectedDateValue += effectiveValue;
        }
        if (order.transactionType === 'Rental') {
          stats.rentalsForSelectedDateValue += effectiveValue;
        }
      }

      const returnDateObj = safeParseDate(order.returnDate);
      if (
        order.transactionType === 'Rental' &&
        (order.status === 'Ongoing' || order.status === 'Delivered to Customer' || order.status === 'Overdue') &&
        returnDateObj &&
        isSameDay(returnDateObj, selectedDate)
      ) {
        stats.returnsForSelectedDateCount++;
      }

      const deliveryDateObj = safeParseDate(order.deliveryDate);
      if (
        deliveryDateObj &&
        isSameDay(deliveryDateObj, selectedDate) &&
        (order.status === 'Ongoing' || order.status === 'Pending Preparation' || order.status === 'Prepared')
      ) {
        stats.deliveriesForSelectedDateCount++;
      }

      if (order.status === 'Overdue') {
        stats.overdueOrdersCount++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats from Realtime Database:", error);
    return stats;
  }
}

// Create a stable default date to prevent re-renders
const DEFAULT_DATE = startOfDay(new Date());

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading, hasPermission } = useAuth();
  const { toast } = useToast();

  const effectiveLang = (params.lang as string) === 'en' ? 'en' : 'ar';
  const currentLocale = effectiveLang === 'ar' ? arSA : enUS;

  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  
  const selectedDateString = searchParams.get('date');

  // Memoize the selected date to prevent unnecessary re-renders
  const selectedDate = useMemo(() => {
    if (selectedDateString) {
      try {
        const parsed = parseISO(selectedDateString);
        if (isValid(parsed)) {
          return startOfDay(parsed);
        }
      } catch (e) {
        // Fall through to default
      }
    }
    // Use the stable default date
    return DEFAULT_DATE;
  }, [selectedDateString]);

  const formattedSelectedDate = format(selectedDate, 'PPP', { locale: currentLocale });

  // Stable navigation functions
  const navigateToLogin = useCallback(() => {
    router.push(`/${effectiveLang}/login`);
  }, [router, effectiveLang]);

  const navigateToSplash = useCallback(() => {
    router.push(`/${effectiveLang}`);
  }, [router, effectiveLang]);

  // Permission Check
  useEffect(() => {
    if (!authIsLoading) {
      if (!currentUser) {
        navigateToLogin();
      } else if (!hasPermission('dashboard_view')) {
        toast({
          title: effectiveLang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
          description: effectiveLang === 'ar' ? 'ليس لديك الصلاحية لعرض لوحة التحكم.' : 'You do not have permission to view the dashboard.',
          variant: 'destructive',
        });
        navigateToSplash();
      }
    }
  }, [authIsLoading, currentUser, hasPermission, navigateToLogin, navigateToSplash, toast]);

  // Fetch stats
  useEffect(() => {
    if (currentUser && hasPermission('dashboard_view')) {
      setIsLoadingStats(true);
      getDashboardStats(selectedDate, currentUser)
        .then(setDashboardStats)
        .catch(err => {
          console.error("Error fetching dashboard stats:", err);
          setDashboardStats(null); // Or set to a default error state
          toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive"});
        })
        .finally(() => setIsLoadingStats(false));
    } else if (!currentUser && !authIsLoading) {
      // If not logged in after auth check, stats won't be loaded.
      // AuthContext's redirection should handle moving to /login.
      setIsLoadingStats(false);
    }
  }, [selectedDate, currentUser, hasPermission, authIsLoading, toast]);


  const translations = {
    en: {
      welcome: "ClasicStore Dashboard",
      quickOverview: "Quick Overview for:",
      manageWedding: "Manage your wedding attire rentals and sales efficiently.",
      activeRentals: "Active Rentals",
      salesForDate: "Sales",
      newRentalsForDate: "New Rentals",
      returnsForDate: "Returns Due",
      deliveriesForDate: "Deliveries Scheduled",
      overdueOrders: "Overdue Orders",
      goTo: "View",
      currencySymbol: "EGP",
      allActiveRentalsDesc: "All currently active rental items",
      salesOnDateDesc: (date: string) => `Completed sales on ${date}`,
      newRentalsOnDateDesc: (date: string) => `New rental agreements on ${date}`,
      returnsOnDateDesc: (date: string) => `Items due for return on ${date}`,
      deliveriesOnDateDesc: (date: string) => `Orders scheduled for delivery on ${date}`,
      overdueOrdersDesc: "Orders marked as overdue",
      loadingDashboard: "Loading Dashboard...",
      selectDate: "Select Date:",
      allBranches: "All Branches",
      orders: "Orders",
      financials: "Financials",
      reports: "Reports",
      returns: "Returns",
    },
    ar: {
      welcome: "لوحة تحكم ClasicStore",
      quickOverview: "نظرة عامة سريعة ليوم:",
      manageWedding: "قم بإدارة إيجارات ومبيعات ملابس الزفاف بكفاءة.",
      activeRentals: "الإيجارات النشطة",
      salesForDate: "مبيعات",
      newRentalsForDate: "إيجارات جديدة",
      returnsForDate: "مرتجعات مستحقة",
      deliveriesForDate: "تسليمات مجدولة",
      overdueOrders: "الطلبات المتأخرة",
      goTo: "عرض",
      currencySymbol: "ج.م",
      allActiveRentalsDesc: "جميع أصناف الإيجار النشطة حالياً",
      salesOnDateDesc: (date: string) => `المبيعات المكتملة في ${date}`,
      newRentalsOnDateDesc: (date: string) => `عقود إيجار جديدة في ${date}`,
      returnsOnDateDesc: (date: string) => `أصناف مستحقة للإرجاع في ${date}`,
      deliveriesOnDateDesc: (date: string) => `طلبات مجدولة للتسليم في ${date}`,
      overdueOrdersDesc: "طلبات تم تحديدها كمتأخرة",
      loadingDashboard: "جار تحميل لوحة التحكم...",
      selectDate: "اختر التاريخ:",
      allBranches: "كل الفروع",
      orders: "Orders",
      financials: "المالية",
      reports: "التقارير",
      returns: "المرتجعات",
    }
  };

  const t = effectiveLang === 'ar' ? translations.ar : translations.en;
  
  if (authIsLoading || (!currentUser && !authIsLoading)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">{t.loadingDashboard}</p>
      </div>
    );
  }
  
  if (!hasPermission('dashboard_view')) {
    // This case should ideally be handled by redirection in useEffect,
    // but as a fallback, don't render content.
    return null;
  }


  return (
    <div className="space-y-8">
      <PageTitle>{t.welcome}</PageTitle>

      {/* Real-time Metrics Section */}
      <RealtimeMetrics lang={effectiveLang} />

      <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted mb-6"></div>}>
        <DatePickerClient lang={effectiveLang} currentSelectedDate={selectedDate} />
      </Suspense>

      {isLoadingStats && (
         <div className="flex justify-center items-center min-h-[calc(50vh-10rem)]">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4">{t.loadingDashboard}</p>
        </div>
      )}

      {!isLoadingStats && dashboardStats && (
        <section className="grid gap-6 md:grid-cols-1">
          <Card className="shadow-xl rounded-lg border-primary/50 bg-gradient-to-br from-primary/5 via-card to-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <LayoutDashboard className={`h-6 w-6 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t.quickOverview} {formattedSelectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {t.manageWedding}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title={t.activeRentals}
                  value={dashboardStats.activeRentalsCount}
                  icon={ClipboardList}
                  description={t.allActiveRentalsDesc}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/orders`} // Updated href for consistency
                  permissionRequired="orders_view" 
                />
                <StatCard
                  title={`${t.salesForDate}`}
                  value={`${t.currencySymbol} ${dashboardStats.salesForSelectedDateValue.toFixed(2)}`}
                  icon={DollarSign}
                  description={t.salesOnDateDesc(formattedSelectedDate)}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/financials`}
                  dateQuery={format(selectedDate, 'yyyy-MM-dd')}
                  permissionRequired="financials_view"
                />
                <StatCard
                  title={`${t.newRentalsForDate}`}
                  value={`${t.currencySymbol} ${dashboardStats.rentalsForSelectedDateValue.toFixed(2)}`}
                  icon={DollarSign}
                  description={t.newRentalsOnDateDesc(formattedSelectedDate)}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/financials`}
                  dateQuery={format(selectedDate, 'yyyy-MM-dd')}
                  permissionRequired="financials_view"
                />
                <StatCard
                  title={`${t.returnsForDate}`}
                  value={dashboardStats.returnsForSelectedDateCount}
                  icon={Undo2}
                  description={t.returnsOnDateDesc(formattedSelectedDate)}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/returns/receive`}
                  dateQuery={format(selectedDate, 'yyyy-MM-dd')}
                  permissionRequired="returns_receive"
                />
                <StatCard
                  title={`${t.deliveriesForDate}`}
                  value={dashboardStats.deliveriesForSelectedDateCount}
                  icon={PackageCheck}
                  description={t.deliveriesOnDateDesc(formattedSelectedDate)}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/orders/prepare`} 
                  dateQuery={format(selectedDate, 'yyyy-MM-dd')}
                  permissionRequired="orders_prepare"
                />
                <StatCard
                  title={t.overdueOrders}
                  value={dashboardStats.overdueOrdersCount}
                  icon={AlertTriangle}
                  description={t.overdueOrdersDesc}
                  lang={effectiveLang}
                  href={`/${effectiveLang}/orders`}
                  permissionRequired="orders_view"
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}
      {!isLoadingStats && !dashboardStats && (
        <Card>
            <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Could not load dashboard statistics.</p>
            </CardContent>
        </Card>
      )}

      {/* Database Management Section - Only for users with backup/restore permissions */}
      {currentUser && (currentUser.permissions?.includes('database_backup') || currentUser.permissions?.includes('database_restore')) && (
        <section className="mt-8">
          <Card className="shadow-xl rounded-lg border-orange-500/50 bg-gradient-to-br from-orange-50/50 via-card to-orange-100/50 dark:from-orange-950/20 dark:via-card dark:to-orange-900/20">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-orange-600 dark:text-orange-400 flex items-center">
                <Database className={`h-6 w-6 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {effectiveLang === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Management'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {effectiveLang === 'ar'
                  ? 'إدارة النسخ الاحتياطية واستعادة قاعدة البيانات'
                  : 'Manage database backups and restore operations'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {currentUser.permissions?.includes('database_backup') && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${effectiveLang}/admin/database-backup`}>
                      <Download className={`h-4 w-4 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {effectiveLang === 'ar' ? 'النسخ الاحتياطي' : 'Database Backup'}
                    </Link>
                  </Button>
                )}
                {currentUser.permissions?.includes('database_restore') && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${effectiveLang}/admin/database-backup`}>
                      <Upload className={`h-4 w-4 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {effectiveLang === 'ar' ? 'استعادة البيانات' : 'Database Restore'}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
