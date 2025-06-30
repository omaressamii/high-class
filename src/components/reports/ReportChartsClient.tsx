
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { BarChartBig, TrendingUp, DollarSign, Users as UsersIcon, Package } from 'lucide-react';

export interface ReportDataItem {
  name: string;
  value: number;
}

export interface OverallSalesSummary {
  totalSalesValue: number;
  numberOfSales: number;
  averageSaleValue: number;
}

interface ReportChartsClientProps {
  reportsData: {
    mostSoldProductsData: ReportDataItem[];
    mostRentedProductsData: ReportDataItem[];
    mostProfitableRentalsData: ReportDataItem[];
    mostActiveSalespersonsData: ReportDataItem[];
    productTypesData: ReportDataItem[];
    // overallSalesSummary is rendered by the server component
  };
  translations: {
    mostSoldProducts: string;
    mostRentedProducts: string;
    mostProfitableRentals: string;
    mostActiveSalespersons: string;
    productTypesRevenue: string;
    salesCount: string;
    rentalsCount: string;
    totalRentalRevenue: string;
    ordersCount: string;
    productName: string;
    sellerName: string;
    currencySymbol: string;
  };
  lang: 'ar' | 'en';
}

export function ReportChartsClient({ reportsData, translations: t, lang }: ReportChartsClientProps) {
  const soldChartConfig = { value: { label: t.salesCount, color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
  const rentedChartConfig = { value: { label: t.rentalsCount, color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
  const profitableChartConfig = { value: { label: t.totalRentalRevenue, color: "hsl(var(--chart-3))" } } satisfies ChartConfig;
  const salespersonsChartConfig = { value: { label: t.ordersCount, color: "hsl(var(--chart-4))" } } satisfies ChartConfig;
  const productTypesChartConfig = { value: { label: t.productTypesRevenue, color: "hsl(var(--chart-5))" } } satisfies ChartConfig;

  const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let currentLabel = payload[0].name;
      let currentValueDisplay = data.value?.toLocaleString() ?? '0';
      let entityNameLabel = t.productName;

      if (chartType === 'sales') currentLabel = t.salesCount;
      else if (chartType === 'rentals') currentLabel = t.rentalsCount;
      else if (chartType === 'revenue') {
        currentLabel = t.totalRentalRevenue;
        currentValueDisplay = `${t.currencySymbol} ${data.value?.toLocaleString() ?? '0.00'}`;
      } else if (chartType === 'salespersons') {
        currentLabel = t.ordersCount;
        entityNameLabel = t.sellerName;
      } else if (chartType === 'productTypes') {
        currentLabel = t.productTypesRevenue;
        currentValueDisplay = `${t.currencySymbol} ${data.value?.toLocaleString() ?? '0.00'}`;
        entityNameLabel = lang === 'ar' ? 'نوع المنتج' : 'Product Type';
      }

      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {entityNameLabel}
              </span>
              <span className="font-bold text-foreground">{label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {currentLabel}
              </span>
              <span className="font-bold" style={{ color: payload[0].fill }}>
                {currentValueDisplay}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <BarChartBig className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.mostSoldProducts}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={soldChartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={reportsData.mostSoldProductsData} layout="vertical" margin={{ right: 20, left: lang === 'ar' ? 10 : 120, top: 5, bottom: 5 }}>
                 <defs>
                  <linearGradient id="fillSalesChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="text-xs truncate" width={lang === 'ar' ? 80 : 120} interval={0} />
                <XAxis dataKey="value" type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip chartType="sales" />} />
                <Bar dataKey="value" fill="url(#fillSalesChart)" radius={4} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.mostRentedProducts}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={rentedChartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={reportsData.mostRentedProductsData} layout="vertical" margin={{ right: 20, left: lang === 'ar' ? 10 : 120, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="fillRentalsChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="text-xs truncate" width={lang === 'ar' ? 80 : 120} interval={0} />
                <XAxis dataKey="value" type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip chartType="rentals" />} />
                <Bar dataKey="value" fill="url(#fillRentalsChart)" radius={4} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.mostProfitableRentals}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={profitableChartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={reportsData.mostProfitableRentalsData} layout="vertical" margin={{ right: 20, left: lang === 'ar' ? 10 : 120, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="fillRevenueChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="text-xs truncate" width={lang === 'ar' ? 80 : 120} interval={0} />
                <XAxis dataKey="value" type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${t.currencySymbol}${value}`} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip chartType="revenue" />} />
                <Bar dataKey="value" fill="url(#fillRevenueChart)" radius={4} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <UsersIcon className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.mostActiveSalespersons}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={salespersonsChartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={reportsData.mostActiveSalespersonsData} layout="vertical" margin={{ right: 20, left: lang === 'ar' ? 10 : 120, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="fillSalespersonsChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="text-xs truncate" width={lang === 'ar' ? 80 : 120} interval={0} />
                <XAxis dataKey="value" type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip chartType="salespersons" />} />
                <Bar dataKey="value" fill="url(#fillSalespersonsChart)" radius={4} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      </div>

      {/* Product Types Revenue Chart */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.productTypesRevenue}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={productTypesChartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={reportsData.productTypesData} layout="vertical" margin={{ right: 20, left: lang === 'ar' ? 10 : 120, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillProductTypesChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="text-xs truncate" width={lang === 'ar' ? 80 : 120} interval={0} />
                <XAxis dataKey="value" type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${t.currencySymbol}${value}`} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip chartType="productTypes" />} />
                <Bar dataKey="value" fill="url(#fillProductTypesChart)" radius={4} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
