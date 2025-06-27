
'use client';

import React, { useState, useMemo } from 'react';
import type { Customer } from '@/types';
import { CustomerFilters } from './CustomerFilters';
import { CustomerList } from './CustomerList';
import { Users as UsersIcon } from 'lucide-react'; // Assuming UsersIcon might be used for empty state

interface CustomerListClientWrapperProps {
  allCustomers: Customer[];
  lang: 'ar' | 'en';
}

export function CustomerListClientWrapper({ allCustomers, lang }: CustomerListClientWrapperProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const t = {
    noCustomersMatch: lang === 'ar' ? 'لا يوجد عملاء يطابقون بحثك.' : 'No customers match your search.',
    tryAdjustingFilters: lang === 'ar' ? 'حاول تعديل معايير البحث.' : 'Try adjusting your search criteria.',
    noCustomersAtAll: lang === 'ar' ? 'لا يوجد عملاء لعرضهم حاليًا.' : 'No customers to display currently.',
  };

  const filteredCustomers = useMemo(() => {
    if (!allCustomers) return [];
    return allCustomers.filter((customer) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        customer.fullName.toLowerCase().includes(searchTermLower) ||
        customer.phoneNumber.includes(searchTermLower) ||
        (customer.idCardNumber && customer.idCardNumber.toLowerCase().includes(searchTermLower)) ||
        customer.id.toLowerCase().includes(searchTermLower)
      );
    });
  }, [allCustomers, searchTerm]);

  if (!allCustomers || allCustomers.length === 0) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="text-xl text-muted-foreground mt-4">{t.noCustomersAtAll}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {lang === 'ar' ? 'ابدأ بإضافة عميلك الأول!' : 'Start by adding your first customer!'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <CustomerFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {filteredCustomers.length > 0 ? (
        <CustomerList customers={filteredCustomers} lang={lang} />
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">{t.noCustomersMatch}</p>
          <p className="text-sm text-muted-foreground">{t.tryAdjustingFilters}</p>
        </div>
      )}
    </div>
  );
}
