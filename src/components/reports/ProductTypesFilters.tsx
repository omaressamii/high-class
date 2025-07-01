'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/DatePicker';
import { ListFilter, XCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { Branch } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ProductTypesFiltersProps {
  branches: Branch[];
  lang: 'ar' | 'en';
  currentFilters: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
  };
}

export function ProductTypesFilters({
  branches,
  lang,
  currentFilters,
}: ProductTypesFiltersProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { currentUser, hasPermission, isLoading: authLoading } = useAuth();

  const [startDate, setStartDate] = useState<Date | undefined>(
    currentFilters.startDate ? new Date(currentFilters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentFilters.endDate ? new Date(currentFilters.endDate) : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    currentFilters.branchId || 'all'
  );

  const t = {
    filterTitle: lang === 'ar' ? 'تصفية التقرير' : 'Filter Report',
    startDateLabel: lang === 'ar' ? 'من تاريخ' : 'From Date',
    endDateLabel: lang === 'ar' ? 'إلى تاريخ' : 'To Date',
    branchLabel: lang === 'ar' ? 'الفرع' : 'Branch',
    allBranches: lang === 'ar' ? 'جميع الفروع' : 'All Branches',
    clearFilters: lang === 'ar' ? 'مسح التصفية' : 'Clear Filters',
    applyFilters: lang === 'ar' ? 'تطبيق التصفية' : 'Apply Filters',
  };

  const handleApplyFilters = () => {
    const newSearchParams = new URLSearchParams();
    
    if (startDate) {
      newSearchParams.set('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      newSearchParams.set('endDate', format(endDate, 'yyyy-MM-dd'));
    }
    if (selectedBranchId && selectedBranchId !== 'all') {
      newSearchParams.set('branch', selectedBranchId);
    }

    const currentPath = `/${params.lang}/reports/product-types`;
    const queryString = newSearchParams.toString();
    router.push(queryString ? `${currentPath}?${queryString}` : currentPath);
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedBranchId('all');
    
    const currentPath = `/${params.lang}/reports/product-types`;
    router.push(currentPath);
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
  };

  if (authLoading) {
    return <div className="h-32 w-full animate-pulse rounded-md bg-muted"></div>;
  }

  // Check if user has permission to view all branches
  const canViewAllBranches = hasPermission('view_all_branches');
  const availableBranches = canViewAllBranches ? branches : [];

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <ListFilter className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
          {t.filterTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Start Date */}
          <div className="space-y-1.5">
            <Label htmlFor="startDateFilter">{t.startDateLabel}</Label>
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              lang={lang}
              placeholder={t.startDateLabel}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label htmlFor="endDateFilter">{t.endDateLabel}</Label>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              lang={lang}
              placeholder={t.endDateLabel}
              disabled={(date) => startDate ? date < startDate : false}
            />
          </div>

          {/* Branch Filter - Only show if user has permission */}
          {canViewAllBranches && (
            <div className="space-y-1.5">
              <Label htmlFor="branchFilter" className="flex items-center">
                <Filter className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0" />
                {t.branchLabel}
              </Label>
              <Select
                value={selectedBranchId}
                onValueChange={handleBranchChange}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                <SelectTrigger id="branchFilter" className="w-full bg-card">
                  <SelectValue placeholder={t.allBranches} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allBranches}</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              {t.applyFilters}
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              <XCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.clearFilters}
            </Button>
          </div>
        </div>

        {/* Show current branch if user doesn't have view_all_branches permission */}
        {!canViewAllBranches && currentUser?.branchName && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm bg-muted/50 p-3 rounded-md">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t.branchLabel}:</span>
            <span className="font-medium">{currentUser.branchName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
