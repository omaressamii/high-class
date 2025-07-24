
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order, Product, User as AppUser, Branch } from '@/types';
import { ShoppingCart, ListChecks, Undo2, AlertTriangle, Package } from 'lucide-react';
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
  productTypesData: ReportDataItem[];
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
  const typesConfigRef = ref(database, 'system_settings/productTypesConfig');

  const [ordersSnapshot, productsSnapshot, usersSnapshot, typesSnapshot] = await Promise.all([
    get(ordersRef),
    get(productsRef),
    get(usersRef),
    get(typesConfigRef)
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

  // Get product types
  let productTypes: any[] = [];
  if (typesSnapshot.exists()) {
    productTypes = typesSnapshot.val().types || [];
  }

  // --- Process Most Sold Products ---
  const salesByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Sale') {
      // Handle both new format (items array) and old format (productId)
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const productKey = item.productName || item.productId || 'Unknown Product';
          salesByProduct[productKey] = (salesByProduct[productKey] || 0) + item.quantity;
        });
      } else if (order.productId) {
        // Fallback for old format
        const product = productsMap.get(order.productId);
        const productKey = product?.name || order.productId;
        salesByProduct[productKey] = (salesByProduct[productKey] || 0) + 1;
      }
    }
  });
  const mostSoldProductsData = Object.entries(salesByProduct)
    .map(([productName, count]) => {
      return { name: productName, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Most Rented Products ---
  const rentalsByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Rental') {
      // Handle both new format (items array) and old format (productId)
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const productKey = item.productName || item.productId || 'Unknown Product';
          rentalsByProduct[productKey] = (rentalsByProduct[productKey] || 0) + item.quantity;
        });
      } else if (order.productId) {
        // Fallback for old format
        const product = productsMap.get(order.productId);
        const productKey = product?.name || order.productId;
        rentalsByProduct[productKey] = (rentalsByProduct[productKey] || 0) + 1;
      }
    }
  });
  const mostRentedProductsData = Object.entries(rentalsByProduct)
    .map(([productName, count]) => {
      return { name: productName, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Process Most Profitable Rental Products ---
  const rentalRevenueByProduct: Record<string, number> = {};
  orders.forEach(order => {
    if (order.transactionType === 'Rental') {
      // Calculate effective revenue after discount
      const discountAmount = order.discountAmount || 0;
      const totalOrderRevenue = (order.totalPrice || 0) - discountAmount;

      // Handle both new format (items array) and old format (productId)
      if (order.items && order.items.length > 0) {
        const totalItemsValue = order.items.reduce((sum, item) => sum + (item.priceAtTimeOfOrder * item.quantity), 0);

        order.items.forEach(item => {
          const productKey = item.productName || item.productId || 'Unknown Product';
          const itemRevenue = item.priceAtTimeOfOrder * item.quantity;
          // Apply proportional discount to this item
          const itemRevenueAfterDiscount = totalItemsValue > 0 ? itemRevenue * (totalOrderRevenue / totalItemsValue) : itemRevenue;
          rentalRevenueByProduct[productKey] = (rentalRevenueByProduct[productKey] || 0) + itemRevenueAfterDiscount;
        });
      } else if (order.productId) {
        // Fallback for old format
        const product = productsMap.get(order.productId);
        const productKey = product?.name || order.productId;
        rentalRevenueByProduct[productKey] = (rentalRevenueByProduct[productKey] || 0) + totalOrderRevenue;
      }
    }
  });
  const mostProfitableRentalsData = Object.entries(rentalRevenueByProduct)
    .map(([productName, totalRevenue]) => {
      return { name: productName, value: parseFloat(totalRevenue.toFixed(2)) };
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
      // Calculate effective sales value after discount
      const discountAmount = order.discountAmount || 0;
      const effectiveSalesValue = (order.totalPrice || 0) - discountAmount;
      totalSalesValue += effectiveSalesValue;
      numberOfSales += 1;
    }
  });
  const averageSaleValue = numberOfSales > 0 ? totalSalesValue / numberOfSales : 0;
  const overallSalesSummary: OverallSalesSummary = {
    totalSalesValue: parseFloat(totalSalesValue.toFixed(2)),
    numberOfSales,
    averageSaleValue: parseFloat(averageSaleValue.toFixed(2)),
  };

  // --- Process Product Types Data ---
  const typeStats: Record<string, { totalRevenue: number; displayName: string }> = {};

  // Initialize stats for each product type
  productTypes.forEach(type => {
    typeStats[type.id] = {
      totalRevenue: 0,
      displayName: lang === 'ar' ? type.name_ar : type.name,
    };
  });

  // Calculate revenue by product type
  orders.forEach(order => {
    // Calculate effective revenue after discount
    const discountAmount = order.discountAmount || 0;
    const totalOrderRevenue = (order.totalPrice || 0) - discountAmount;

    if (order.items && order.items.length > 0) {
      const totalItemsValue = order.items.reduce((sum, item) => sum + (item.priceAtTimeOfOrder * item.quantity), 0);

      order.items.forEach(item => {
        const product = productsMap.get(item.productId);
        if (product && typeStats[product.type]) {
          const itemRevenue = item.priceAtTimeOfOrder * item.quantity;
          // Apply proportional discount to this item
          const itemRevenueAfterDiscount = totalItemsValue > 0 ? itemRevenue * (totalOrderRevenue / totalItemsValue) : itemRevenue;
          typeStats[product.type].totalRevenue += itemRevenueAfterDiscount;
        }
      });
    } else if (order.productId) {
      const product = productsMap.get(order.productId);
      if (product && typeStats[product.type]) {
        typeStats[product.type].totalRevenue += totalOrderRevenue;
      }
    }
  });

  const productTypesData = Object.values(typeStats)
    .map(stat => ({
      name: stat.displayName,
      value: parseFloat(stat.totalRevenue.toFixed(2))
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    mostSoldProductsData,
    mostRentedProductsData,
    mostProfitableRentalsData,
    mostActiveSalespersonsData,
    productTypesData,
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
          productTypesData: [],
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
    productTypesRevenue: effectiveLang === 'ar' ? 'إيراد أنواع المنتجات' : 'Product Types Revenue',
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

      {/* Quick Links to Detailed Reports */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            {effectiveLang === 'ar' ? 'التقارير التفصيلية' : 'Detailed Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href={`/${effectiveLang}/reports/sales`}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{effectiveLang === 'ar' ? 'تفاصيل المبيعات' : 'Sales Details'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {effectiveLang === 'ar' ? 'عرض جميع المبيعات' : 'View all sales'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={`/${effectiveLang}/reports/product-types`}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{effectiveLang === 'ar' ? 'أنواع المنتجات' : 'Product Types'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {effectiveLang === 'ar' ? 'إحصائيات الأنواع' : 'Types statistics'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={`/${effectiveLang}/reports/active-rentals`}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={`flex items-center space-x-3 ${effectiveLang === 'ar' ? 'space-x-reverse' : ''}`}>
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <ListChecks className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{effectiveLang === 'ar' ? 'الإيجارات النشطة' : 'Active Rentals'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {effectiveLang === 'ar' ? 'الإيجارات الجارية' : 'Current rentals'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={`/${effectiveLang}/reports/upcoming-returns`}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={`flex items-center space-x-3 ${effectiveLang === 'ar' ? 'space-x-reverse' : ''}`}>
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <Undo2 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{effectiveLang === 'ar' ? 'المرتجعات القادمة' : 'Upcoming Returns'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {effectiveLang === 'ar' ? 'خلال الأسبوع القادم' : 'Within next week'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={`/${effectiveLang}/reports/overdue-returns`}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={`flex items-center space-x-3 ${effectiveLang === 'ar' ? 'space-x-reverse' : ''}`}>
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{effectiveLang === 'ar' ? 'المرتجعات المتأخرة' : 'Overdue Returns'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {effectiveLang === 'ar' ? 'تحتاج متابعة عاجلة' : 'Need urgent follow-up'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

