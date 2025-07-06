'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeData } from '@/context/RealtimeDataContext';
import { DetailedRealtimeStatus } from '@/components/shared/RealtimeStatus';
import { 
  ShoppingBag, 
  Users, 
  ListOrdered, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

interface RealtimeMetricsProps {
  lang: 'ar' | 'en';
}

export function RealtimeMetrics({ lang }: RealtimeMetricsProps) {
  const { 
    products, 
    orders, 
    customers, 
    financialTransactions, 
    connectionStatus,
    isLoading 
  } = useRealtimeData();

  const t = {
    realtimeMetrics: lang === 'ar' ? 'المقاييس المباشرة' : 'Real-time Metrics',
    totalProducts: lang === 'ar' ? 'إجمالي المنتجات' : 'Total Products',
    totalOrders: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    totalCustomers: lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers',
    totalRevenue: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
    activeOrders: lang === 'ar' ? 'الطلبات النشطة' : 'Active Orders',
    pendingOrders: lang === 'ar' ? 'الطلبات المعلقة' : 'Pending Orders',
    lowStockProducts: lang === 'ar' ? 'منتجات قليلة المخزون' : 'Low Stock Products',
    recentActivity: lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity',
    dataStatus: lang === 'ar' ? 'حالة البيانات' : 'Data Status',
    connected: lang === 'ar' ? 'متصل' : 'Connected',
    disconnected: lang === 'ar' ? 'غير متصل' : 'Disconnected',
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
    noData: lang === 'ar' ? 'لا توجد بيانات' : 'No data',
    currency: lang === 'ar' ? 'ج.م' : 'SAR',
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    
    // Calculate revenue from financial transactions
    const income = financialTransactions
      .filter(t => t.type === 'Payment Received')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const discounts = financialTransactions
      .filter(t => t.type === 'Discount Applied')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalRevenue = income - discounts;

    // Active orders (not completed or cancelled)
    const activeOrders = orders.filter(order => 
      !['Completed', 'Cancelled', 'Returned'].includes(order.status)
    ).length;

    // Pending orders
    const pendingOrders = orders.filter(order => 
      order.status === 'Pending Preparation'
    ).length;

    // Low stock products (assuming quantityInStock < 10 is low stock)
    const lowStockProducts = products.filter(product =>
      (product.quantityInStock || 0) < 10
    ).length;

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      activeOrders,
      pendingOrders,
      lowStockProducts,
    };
  }, [products, orders, customers, financialTransactions]);

  // Recent activity (last 5 orders)
  const recentActivity = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        type: 'order',
        description: `${lang === 'ar' ? 'طلب جديد' : 'New order'} #${order.orderCode || order.id.slice(-6)}`,
        time: order.orderDate,
        status: order.status,
      }));
  }, [orders, lang]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t.dataStatus}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DetailedRealtimeStatus lang={lang} />
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalProducts}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            {metrics.lowStockProducts > 0 && (
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                {metrics.lowStockProducts} {lang === 'ar' ? 'قليل المخزون' : 'low stock'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalOrders}</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {metrics.activeOrders} {lang === 'ar' ? 'نشط' : 'active'}
              </Badge>
              {metrics.pendingOrders > 0 && (
                <Badge variant="outline" className="text-xs">
                  {metrics.pendingOrders} {lang === 'ar' ? 'معلق' : 'pending'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCustomers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalRevenue.toLocaleString()} {t.currency}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.recentActivity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{activity.description}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(activity.time), 'HH:mm', {
                      locale: lang === 'ar' ? arSA : enUS
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.noData}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
