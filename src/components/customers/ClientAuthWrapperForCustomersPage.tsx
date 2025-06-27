
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ClientAuthWrapperForCustomersPageProps {
  lang: string;
  addCustomerText: string;
}

export function ClientAuthWrapperForCustomersPage({ lang, addCustomerText }: ClientAuthWrapperForCustomersPageProps) {
  const { isLoading: authIsLoading, hasPermission } = useAuth();

  if (authIsLoading) {
    return (
      <Button disabled className="h-10 w-auto px-4 py-2">
        <Loader className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
        {lang === 'ar' ? 'تحميل...' : 'Loading...'}
      </Button>
    );
  }

  if (!hasPermission('customers_manage')) {
    return null;
  }

  return (
    <Button asChild variant="default">
      <Link href={`/${lang}/customers/new`}>
        <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
        {addCustomerText}
      </Link>
    </Button>
  );
}
