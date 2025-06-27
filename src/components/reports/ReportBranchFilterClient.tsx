
'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Branch } from '@/types';
import { useAuth } from '@/context/AuthContext'; // To check 'view_all_branches' permission
import { Filter } from 'lucide-react';

interface ReportBranchFilterClientProps {
  branches: Branch[];
  currentBranchId?: string;
  lang: 'ar' | 'en';
  allBranchesText: string;
  filterLabelText: string;
}

export function ReportBranchFilterClient({
  branches,
  currentBranchId,
  lang,
  allBranchesText,
  filterLabelText,
}: ReportBranchFilterClientProps) {
  const router = useRouter();
  const params = useParams();
  const searchParamsHook = useSearchParams(); // Use hook for client components
  const { currentUser, hasPermission, isLoading: authLoading } = useAuth();

  const handleBranchChange = (value: string) => {
    const currentPath = `/${params.lang}/reports`;
    if (value === 'all') {
      router.push(currentPath);
    } else {
      router.push(`${currentPath}?branch=${value}`);
    }
  };

  if (authLoading) {
    return <div className="h-10 w-48 animate-pulse rounded-md bg-muted"></div>; // Placeholder for loading state
  }

  // If user does not have view_all_branches, show their branch or nothing
  if (!hasPermission('view_all_branches')) {
    if (currentUser?.branchName) {
      return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{filterLabelText}:</span>
          <span className="font-medium">{currentUser.branchName}</span>
        </div>
      );
    }
    return null; // Don't show filter if no permission and no branch
  }

  // User has view_all_branches permission
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <Label htmlFor="branchFilterReports" className="text-sm font-medium flex items-center">
        <Filter className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0" />
        {filterLabelText}
      </Label>
      <Select
        value={currentBranchId || 'all'}
        onValueChange={handleBranchChange}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <SelectTrigger id="branchFilterReports" className="w-auto min-w-[180px] bg-card">
          <SelectValue placeholder={allBranchesText} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allBranchesText}</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

