
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/use-optimized-auth';
import { OptimizedLoader } from '@/components/shared/OptimizedLoader';

interface ClientAuthWrapperProps {
  lang: string;
  addProductText: string;
}

const ClientAuthWrapperComponent = ({ lang, addProductText }: ClientAuthWrapperProps) => {
  const { isLoading, commonPermissions } = useOptimizedAuth();

  if (isLoading) {
    return <OptimizedLoader size="sm" className="h-10 w-32" showText={false} />;
  }

  if (!commonPermissions.canAddProducts) {
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
};

ClientAuthWrapperComponent.displayName = 'ClientAuthWrapper';
export const ClientAuthWrapper = React.memo(ClientAuthWrapperComponent);
