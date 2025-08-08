
import React from 'react';
import { OrdersPageClientContent } from '@/components/orders/OrdersPageClientContent';




export default async function OrdersPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة الطلبات' : 'Order Management',
    addOrder: effectiveLang === 'ar' ? 'إضافة طلب جديد' : 'Add New Order',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
    loadingOrders: effectiveLang === 'ar' ? 'جار تحميل الطلبات...' : 'Loading orders...',
    noOrdersYet: effectiveLang === 'ar' ? 'لا توجد طلبات بعد. قم بإضافة طلبك الأول!' : 'No orders yet. Add your first order!',
    // errorFetchingOrders: effectiveLang === 'ar' ? 'خطأ في جلب الطلبات' : 'Error Fetching Orders', // No longer directly used for display
  };
  
  return (
    <div className="space-y-8">
      <OrdersPageClientContent
        initialOrders={[]}
        allBranches={[]}
        lang={effectiveLang}
        addOrderText={t.addOrder}
        noOrdersYetText={t.noOrdersYet}
        pageTitleText={t.pageTitle}
      />
    </div>
  );
}

