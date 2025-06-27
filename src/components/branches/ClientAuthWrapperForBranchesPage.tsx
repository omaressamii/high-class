
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ClientAuthWrapperProps {
  lang: string;
  addBranchText: string;
}

export function ClientAuthWrapperForBranchesPage({ lang, addBranchText }: ClientAuthWrapperProps) {
  const { isLoading: authIsLoading, hasPermission } = useAuth();

  if (authIsLoading) {
    return <div className="h-10 w-32 animate-pulse rounded-md bg-muted"></div>;
  }

  if (!hasPermission('branches_manage')) {
    return null;
  }

  return (
    <Button asChild variant="default">
      <Link href={`/${lang}/branches/new`}>
        <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
        {addBranchText}
      </Link>
    </Button>
  );
}
