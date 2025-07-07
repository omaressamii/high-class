'use client';

import React from 'react';
import type { Customer } from '@/types';
import { ResponsiveTable, createTableColumn } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Phone, MapPin, User, Store } from 'lucide-react';
import Link from 'next/link';

interface ResponsiveCustomerListProps {
  customers: Customer[];
  lang: 'ar' | 'en';
}

const ResponsiveCustomerListComponent = ({ customers, lang }: ResponsiveCustomerListProps) => {
  const t = {
    name: lang === 'ar' ? 'الاسم' : 'Name',
    phone: lang === 'ar' ? 'الهاتف' : 'Phone',
    address: lang === 'ar' ? 'العنوان' : 'Address',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    noCustomers: lang === 'ar' ? 'لا يوجد عملاء' : 'No customers found',
    customerId: lang === 'ar' ? 'رقم العميل' : 'Customer ID'
  };

  const columns = [
    createTableColumn<Customer>(
      'name',
      t.name,
      'fullName',
      {
        mobileLabel: t.name,
        render: (value, customer) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{value}</div>
              <div className="text-xs text-muted-foreground">
                {t.customerId}: {customer.id}
              </div>
            </div>
          </div>
        )
      }
    ),
    createTableColumn<Customer>(
      'phone',
      t.phone,
      'phoneNumber',
      {
        mobileLabel: t.phone,
        render: (value) => (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        )
      }
    ),
    createTableColumn<Customer>(
      'address',
      t.address,
      'address',
      {
        mobileLabel: t.address,
        hideOnMobile: false, // Show on mobile but truncated
        render: (value) => value ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            {lang === 'ar' ? 'غير محدد' : 'Not specified'}
          </span>
        )
      }
    ),
    createTableColumn<Customer>(
      'branch',
      t.branch,
      'branchName',
      {
        mobileLabel: t.branch,
        hideOnMobile: false,
        render: (value) => value ? (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            {lang === 'ar' ? 'غير محدد' : 'Not specified'}
          </span>
        )
      }
    ),
    createTableColumn<Customer>(
      'actions',
      t.actions,
      (customer) => (
        <div className="flex items-center justify-center gap-2">
          <Button asChild variant="ghost" size="sm" className="touch-target">
            <Link href={`/${lang}/customers/${customer.id}`}>
              <Eye className={`h-4 w-4 ${lang === 'ar' ? 'ml-1' : 'mr-1'}`} />
              <span className="hidden sm:inline">{t.view}</span>
            </Link>
          </Button>
        </div>
      ),
      {
        mobileLabel: t.actions,
        className: 'text-center'
      }
    )
  ];

  return (
    <ResponsiveTable
      data={customers}
      columns={columns}
      lang={lang}
      emptyMessage={t.noCustomers}
      className="mobile-overflow"
      mobileCardClassName="mobile-card hover:shadow-md transition-shadow"
      onRowClick={(customer) => {
        // Optional: Handle row click for navigation
        window.location.href = `/${lang}/customers/${customer.id}`;
      }}
    />
  );
};

ResponsiveCustomerListComponent.displayName = 'ResponsiveCustomerList';
export const ResponsiveCustomerList = React.memo(ResponsiveCustomerListComponent);
