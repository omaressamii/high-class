import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, AlertCircle, TrendingUp, ShoppingCart, Repeat } from 'lucide-react';
import { getProductTypesData } from '@/lib/reports-data';
import { ProductTypesFilters } from '@/components/reports/ProductTypesFilters';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { Branch } from '@/types';

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
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Branch;
  });

  // Sort by name
  branchList.sort((a, b) => a.name.localeCompare(b.name));
  return branchList;
}

export default async function ProductTypesReportPage({
  params: routeParams,
  searchParams: searchParamsPromise
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await routeParams;
  const searchParams = await searchParamsPromise;
  const effectiveLang = lang as 'ar' | 'en';

  // Extract filter parameters from URL
  const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined;
  const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : undefined;
  const branchId = typeof searchParams.branch === 'string' ? searchParams.branch : undefined;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تقرير أنواع المنتجات' : 'Product Types Report',
    allTimeDataNote: effectiveLang === 'ar' ? 'البيانات المعروضة تشمل إحصائيات شاملة لجميع أنواع المنتجات.' : 'Data shown includes comprehensive statistics for all product types.',
    backToDashboard: effectiveLang === 'ar' ? 'العودة إلى التقارير' : 'Back to Reports',
    productType: effectiveLang === 'ar' ? 'نوع المنتج' : 'Product Type',
    totalProducts: effectiveLang === 'ar' ? 'إجمالي المنتجات' : 'Total Products',
    totalSales: effectiveLang === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',
    totalRentals: effectiveLang === 'ar' ? 'إجمالي الإيجارات' : 'Total Rentals',
    salesRevenue: effectiveLang === 'ar' ? 'إيراد المبيعات' : 'Sales Revenue',
    rentalRevenue: effectiveLang === 'ar' ? 'إيراد الإيجارات' : 'Rental Revenue',
    totalRevenue: effectiveLang === 'ar' ? 'إجمالي الإيراد' : 'Total Revenue',
    availableProducts: effectiveLang === 'ar' ? 'المنتجات المتاحة' : 'Available Products',
    rentedProducts: effectiveLang === 'ar' ? 'المنتجات المؤجرة' : 'Rented Products',
    soldProducts: effectiveLang === 'ar' ? 'المنتجات المباعة' : 'Sold Products',
    noProductTypes: effectiveLang === 'ar' ? 'لا توجد أنواع منتجات مسجلة حاليًا.' : 'No product types recorded currently.',
    currencySymbol: effectiveLang === 'ar' ? 'ج.م' : 'EGP',
    errorLoadingData: effectiveLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data',
    tryAgain: effectiveLang === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    summary: effectiveLang === 'ar' ? 'ملخص أنواع المنتجات' : 'Product Types Summary',
    mostPopularType: effectiveLang === 'ar' ? 'النوع الأكثر شعبية' : 'Most Popular Type',
    highestRevenue: effectiveLang === 'ar' ? 'أعلى إيراد' : 'Highest Revenue',
    mostProducts: effectiveLang === 'ar' ? 'أكثر المنتجات' : 'Most Products',
  };

  let productTypesData: any[] = [];
  let branches: Branch[] = [];
  let error = false;

  try {
    // Fetch branches and product types data in parallel
    const [branchesResult, productTypesResult] = await Promise.all([
      getAllBranches(),
      getProductTypesData(effectiveLang, {
        startDate,
        endDate,
        branchId,
      })
    ]);

    branches = branchesResult;
    productTypesData = productTypesResult;
  } catch (err) {
    console.error("Error in ProductTypesReportPage:", err);
    error = true;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageTitle>{t.pageTitle}</PageTitle>
          <Button asChild variant="outline">
            <Link href={`/${effectiveLang}/reports`}>
              <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
              {t.backToDashboard}
            </Link>
          </Button>
        </div>
        <Card className="shadow-lg rounded-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.errorLoadingData}</h3>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary statistics
  const totalProductsCount = productTypesData.reduce((sum, type) => sum + type.totalProducts, 0);
  const totalSalesCount = productTypesData.reduce((sum, type) => sum + type.totalSales, 0);
  const totalRentalsCount = productTypesData.reduce((sum, type) => sum + type.totalRentals, 0);
  const totalRevenueSum = productTypesData.reduce((sum, type) => sum + type.totalRevenue, 0);

  const mostPopularType = productTypesData.reduce((prev, current) => 
    (prev.totalSales + prev.totalRentals) > (current.totalSales + current.totalRentals) ? prev : current, 
    productTypesData[0] || {}
  );

  const highestRevenueType = productTypesData.reduce((prev, current) => 
    prev.totalRevenue > current.totalRevenue ? prev : current, 
    productTypesData[0] || {}
  );

  const mostProductsType = productTypesData.reduce((prev, current) => 
    prev.totalProducts > current.totalProducts ? prev : current, 
    productTypesData[0] || {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>{t.pageTitle}</PageTitle>
        <Button asChild variant="outline">
          <Link href={`/${effectiveLang}/reports`}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
            {t.backToDashboard}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ProductTypesFilters
        branches={branches}
        lang={effectiveLang}
        currentFilters={{
          startDate,
          endDate,
          branchId,
        }}
      />

      <p className="text-sm text-muted-foreground">
        {startDate || endDate || branchId
          ? (effectiveLang === 'ar'
              ? 'البيانات المعروضة مفلترة حسب المعايير المحددة أعلاه.'
              : 'Data shown is filtered based on the criteria specified above.')
          : t.allTimeDataNote
        }
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalProducts}</p>
                <p className="text-2xl font-bold">{totalProductsCount.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalSales}</p>
                <p className="text-2xl font-bold">{totalSalesCount.toLocaleString()}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalRentals}</p>
                <p className="text-2xl font-bold">{totalRentalsCount.toLocaleString()}</p>
              </div>
              <Repeat className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg border-primary/20 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalRevenue}</p>
                <p className="text-2xl font-bold">{t.currencySymbol} {totalRevenueSum.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {productTypesData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
                {t.mostPopularType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{mostPopularType.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {mostPopularType.totalSales + mostPopularType.totalRentals} {effectiveLang === 'ar' ? 'معاملة' : 'transactions'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
                {t.highestRevenue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{highestRevenueType.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {t.currencySymbol} {highestRevenueType.totalRevenue?.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Package className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
                {t.mostProducts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{mostProductsType.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {mostProductsType.totalProducts} {effectiveLang === 'ar' ? 'منتج' : 'products'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Table */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.summary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productTypesData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t.productType}</TableHead>
                    <TableHead className="font-semibold text-center">{t.totalProducts}</TableHead>
                    <TableHead className="font-semibold text-center">{t.availableProducts}</TableHead>
                    <TableHead className="font-semibold text-center">{t.rentedProducts}</TableHead>
                    <TableHead className="font-semibold text-center">{t.soldProducts}</TableHead>
                    <TableHead className="font-semibold text-center">{t.totalSales}</TableHead>
                    <TableHead className="font-semibold text-center">{t.totalRentals}</TableHead>
                    <TableHead className="font-semibold text-right">{t.salesRevenue}</TableHead>
                    <TableHead className="font-semibold text-right">{t.rentalRevenue}</TableHead>
                    <TableHead className="font-semibold text-right">{t.totalRevenue}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTypesData.map((typeData) => (
                    <TableRow key={typeData.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{typeData.displayName}</TableCell>
                      <TableCell className="text-center">{typeData.totalProducts}</TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {typeData.availableProducts}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {typeData.rentedProducts}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {typeData.soldProducts}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{typeData.totalSales}</TableCell>
                      <TableCell className="text-center font-semibold">{typeData.totalRentals}</TableCell>
                      <TableCell className="text-right font-semibold">{t.currencySymbol} {typeData.salesRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{t.currencySymbol} {typeData.rentalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{t.currencySymbol} {typeData.totalRevenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.noProductTypes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
