
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order, Product, User as AppUser, Branch } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { ref, get, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { ReportChartsClient, type ReportDataItem, type OverallSalesSummary } from '@/components/reports/ReportChartsClient';
import { ReportBranchFilterClient } from '@/components/reports/ReportBranchFilterClient';
import { PERMISSION_STRINGS } from '@/types';

interface ReportsData {
  mostSoldProductsData: ReportDataItem[];
  mostRentedProductsData: ReportDataItem[];
  mostProfitableRentalsData: ReportDataItem[];
  mostActiveSalespersonsData: ReportDataItem[];
  overallSalesSummary: OverallSalesSummary;
}

function serializeTimestamp(ts: any): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === 'string') { // Already serialized
    // Basic check if it might be an ISO string already
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(ts)) {
        return ts;
    }
  }
  if (typeof ts === 'number') {
    return new Date(ts).toISOString();
  }
  console.warn("Unrecognized or unsupported timestamp format encountered during serialization:", ts);
  return undefined; // Or return ts if it's expected to be a pre-formatted string in some cases
}

async function getAllBranches(): Promise<Branch[]> {
  const branchesRef = ref(database, "branches");
  const branchSnapshot = await get(branchesRef);

  if (!branchSnapshot.exists()) {
    return [];
  }

  const branchesData = branchSnapshot.val();
  const branchList = Object.entries(branchesData).map(([id, data]: [string, any]) => {
    return {
      id: id,
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber,
      notes: data.notes,
      createdByUserId: data.createdByUserId,
      createdAt: data.createdAt, // Already in ISO string format
      updatedAt: data.updatedAt, // Already in ISO string format
    } as Branch;
  });

  // Sort by name (since Realtime DB doesn't have built-in orderBy like Firestore)
  branchList.sort((a, b) => a.name.localeCompare(b.name));

  return branchList;
}


async function getReportsData(lang: 'ar' | 'en', selectedBranchId?: string): Promise<ReportsData> {
  // Fetch all necessary data
  const ordersRef = ref(database, "orders");
  const productsRef = ref(database, "products");
  const usersRef = ref(database, "users");

  const [ordersSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
    get(ordersRef),
    get(productsRef),
    get(usersRef)
  ]);

  let orders: Order[] = [];
  if (ordersSnapshot.exists()) {
    const ordersData = ordersSnapshot.val();
    orders = Object.entries(ordersData).map(([id, data]: [string, any]) => ({ id, ...data } as Order));

    // Sort by orderDate descending (since Realtime DB doesn't have built-in orderBy like Firestore)
    orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }

  // Filter orders by selectedBranchId if provided and not 'all'
  if (selectedBranchId && selectedBranchId !== 'all') {
    orders = orders.filter(order => order.branchId === selectedBranchId);
  }

  const productsMap = new Map();
  if (productsSnapshot.exists()) {
    const productsData = productsSnapshot.val();
    Object.entries(productsData).forEach(([id, data]) => {
      productsMap.set(id, data as Product);
    });
  }

  const usersMap = new Map();
  if (usersSnapshot.exists()) {
    const usersData = usersSnapshot.val();
    Object.entries(usersData).forEach(([id, data]) => {
      usersMap.set(id, data as AppUser);
    });
  }

  // --- Process Most Sold Products ---
  const salesByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Sale') {
      salesByProduct[order.productId] = (salesByProduct[order.productId] || 0) + 1;
    }
  });
  const mostSoldProductsData = Object.entries(salesByProduct)
    .map(([productId, count]) => {
      const product = productsMap.get(productId);
      return { name: product?.name || productId, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Most Rented Products ---
  const rentalsByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Rental') {
      rentalsByProduct[order.productId] = (rentalsByProduct[order.productId] || 0) + 1;
    }
  });
  const mostRentedProductsData = Object.entries(rentalsByProduct)
    .map(([productId, count]) => {
      const product = productsMap.get(productId);
      return { name: product?.name || productId, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Most Profitable Rental Products ---
  const rentalRevenueByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Rental') {
      rentalRevenueByProduct[order.productId] = (rentalRevenueByProduct[order.productId] || 0) + (order.totalPrice || 0);
    }
  });
  const mostProfitableRentalsData = Object.entries(rentalRevenueByProduct)
    .map(([productId, totalRevenue]) => {
      const product = productsMap.get(productId);
      return { name: product?.name || productId, value: parseFloat(totalRevenue.toFixed(2)) };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Most Active Salespersons ---
  const ordersBySeller: Record<string, number> = {};
  orders.forEach(order => {
    if (order.sellerId) {
      ordersBySeller[order.sellerId] = (ordersBySeller[order.sellerId] || 0) + 1;
    }
  });
  const mostActiveSalespersonsData = Object.entries(ordersBySeller)
    .map(([sellerId, count]) => {
      const seller = usersMap.get(sellerId);
      return { name: seller?.fullName || seller?.username || sellerId, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Overall Sales Summary ---
  let totalSalesValue = 0;
  let numberOfSales = 0;
  orders.forEach(order => {
    if (order.transactionType === 'Sale') {
      totalSalesValue += (order.totalPrice || 0);
      numberOfSales += 1;
    }
  });
  const averageSaleValue = numberOfSales > 0 ? totalSalesValue / numberOfSales : 0;
  const overallSalesSummary: OverallSalesSummary = {
    totalSalesValue: parseFloat(totalSalesValue.toFixed(2)),
    numberOfSales,
    averageSaleValue: parseFloat(averageSaleValue.toFixed(2)),
  };


  return {
    mostSoldProductsData,
    mostRentedProductsData,
    mostProfitableRentalsData,
    mostActiveSalespersonsData,
    overallSalesSummary,
  };
}


export default async function ReportsPage({
  params: routeParams,
  searchParams
}: {
  params: Promise<{ lang: string }>,
  searchParams?: Promise<{ branch?: string }>
}) {
  const { lang } = await routeParams;
  const effectiveLang = lang as 'ar' | 'en';
  const searchParamsResolved = await searchParams;
  const selectedBranchId = searchParamsResolved?.branch || 'all'; // Default to 'all' if no query param

  let reportsData: ReportsData;
  let branches: Branch[] = [];
  try {
      reportsData = await getReportsData(effectiveLang, selectedBranchId);
      branches = await getAllBranches();
  } catch (error) {
      console.error("Failed to fetch reports data or branches:", error);
      reportsData = {
          mostSoldProductsData: [],
          mostRentedProductsData: [],
          mostProfitableRentalsData: [],
          mostActiveSalespersonsData: [],
          overallSalesSummary: { totalSalesValue: 0, numberOfSales: 0, averageSaleValue: 0 },
      };
  }

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'التقارير و الإحصائيات' : 'Reports & Analytics',
    filterByBranch: effectiveLang === 'ar' ? 'فلترة حسب الفرع' : 'Filter by Branch', // New translation
    allBranches: effectiveLang === 'ar' ? 'كل الفروع' : 'All Branches', // New translation
    mostSoldProducts: effectiveLang === 'ar' ? 'المنتجات الأكثر مبيعًا' : 'Most Sold Products',
    mostRentedProducts: effectiveLang === 'ar' ? 'المنتجات الأكثر إيجارًا' : 'Most Rented Products',
    mostProfitableRentals: effectiveLang === 'ar' ? 'المنتجات الأكثر ربحية (إيجار)' : 'Most Profitable Rentals',
    mostActiveSalespersons: effectiveLang === 'ar' ? 'البائعون الأكثر نشاطًا' : 'Most Active Salespersons',
    overallSalesSummaryTitle: effectiveLang === 'ar' ? 'ملخص المبيعات الإجمالي' : 'Overall Sales Summary',
    totalSalesValueLabel: effectiveLang === 'ar' ? 'إجمالي قيمة المبيعات' : 'Total Sales Value',
    numberOfSalesLabel: effectiveLang === 'ar' ? 'عدد المبيعات' : 'Number of Sales',
    averageSaleValueLabel: effectiveLang === 'ar' ? 'متوسط قيمة البيع' : 'Average Sale Value',
    salesCount: effectiveLang === 'ar' ? 'عدد المبيعات' : 'Sales Count',
    rentalsCount: effectiveLang === 'ar' ? 'عدد الإيجارات' : 'Rentals Count',
    totalRentalRevenue: effectiveLang === 'ar' ? 'إجمالي إيراد الإيجار' : 'Total Rental Revenue',
    ordersCount: effectiveLang === 'ar' ? 'عدد الطلبات' : 'Orders Count',
    productName: effectiveLang === 'ar' ? 'اسم المنتج' : 'Product Name',
    sellerName: effectiveLang === 'ar' ? 'اسم البائع' : 'Seller Name',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    allTimeDataNote: effectiveLang === 'ar' ? 'ملاحظة: تعرض هذه التقارير البيانات لجميع الأوقات من قاعدة البيانات الحية، مفلترة حسب الفرع المختار (إن وجد).' : 'Note: These reports show all-time data from the live database, filtered by the selected branch (if any).',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل التقارير...' : 'Loading reports...',
    errorFetchingData: effectiveLang === 'ar' ? 'حدث خطأ أثناء تحميل بيانات التقارير.' : 'An error occurred while loading report data.',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <ReportBranchFilterClient
            branches={branches}
            currentBranchId={selectedBranchId}
            lang={effectiveLang}
            allBranchesText={t.allBranches}
            filterLabelText={t.filterByBranch}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t.allTimeDataNote}</p>

      <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <ShoppingCart className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.overallSalesSummaryTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-md shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t.totalSalesValueLabel}</h3>
            <p className="text-2xl font-bold">{t.currencySymbol} {reportsData.overallSalesSummary.totalSalesValue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-card rounded-md shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t.numberOfSalesLabel}</h3>
            <p className="text-2xl font-bold">{reportsData.overallSalesSummary.numberOfSales.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-card rounded-md shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t.averageSaleValueLabel}</h3>
            <p className="text-2xl font-bold">{t.currencySymbol} {reportsData.overallSalesSummary.averageSaleValue.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <ReportChartsClient
        reportsData={reportsData}
        translations={t}
        lang={effectiveLang}
      />
    </div>
  );
}

