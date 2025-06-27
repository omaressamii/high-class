
'use client';

import React from 'react'; // Import React
import type { Order } from '@/types';
import { OrderCard } from './OrderCard';
import { OrderTable } from './OrderTable';
import { useMediaQuery } from '@/hooks/useMediaQuery'; 

interface OrderListProps {
  orders: Order[];
  lang: string;
}

const OrderListComponent = ({ orders, lang }: OrderListProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)'); // md breakpoint

  if (isMobile) {
    return (
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} lang={lang} />
        ))}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-4">{lang === 'ar' ? 'لا توجد طلبات لعرضها.' : 'No orders to display.'}</p>}
      </div>
    );
  }

  return <OrderTable orders={orders} lang={lang as 'ar' | 'en'} />;
};

OrderListComponent.displayName = 'OrderList';
export const OrderList = React.memo(OrderListComponent);
