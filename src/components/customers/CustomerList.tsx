
import React from 'react'; // Import React
import type { Customer } from '@/types';
import { CustomerCard } from './CustomerCard';

interface CustomerListProps {
  customers: Customer[];
  lang: string;
}

const CustomerListComponent = ({ customers, lang }: CustomerListProps) => {
  return (
    <div className="space-y-6">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} lang={lang} />
      ))}
    </div>
  );
};

CustomerListComponent.displayName = 'CustomerList';
export const CustomerList = React.memo(CustomerListComponent);
