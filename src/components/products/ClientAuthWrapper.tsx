
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ClientAuthWrapperProps {
  lang: string;
  addProductText: string;
}

export function ClientAuthWrapper({ lang, addProductText }: ClientAuthWrapperProps) {
  const { isLoading: authIsLoading, hasPermission } = useAuth();

  if (authIsLoading) {
    return <div className="h-10 w-32 animate-pulse rounded-md bg-muted"></div>;
  }

  if (!hasPermission('products_add')) {
    return null;
  }

  return (
    <Button asChild variant="default">
      <Link href={`/${lang}/products/new`}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {addProductText}
      </Link>
    </Button>
  );
}
