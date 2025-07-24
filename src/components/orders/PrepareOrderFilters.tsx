
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shared/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/types';
import { ListFilter, Search, CalendarDays } from 'lucide-react'; // Added CalendarDays

interface PrepareOrderFiltersProps {
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
  availableBranches: Branch[];
  showBranchFilter: boolean;
  lang: 'ar' | 'en';
  onFilter: () => void;
}

export function PrepareOrderFilters({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedBranchId,
  setSelectedBranchId,
  availableBranches,
  showBranchFilter,
  lang,
  onFilter
}: PrepareOrderFiltersProps) {
  
  const t = {
    filterTitle: lang === 'ar' ? 'فلترة طلبات التجهيز والتسليم' : 'Filter Orders for Preparation & Delivery',
    startDateLabel: lang === 'ar' ? 'من تاريخ تسليم' : 'From Delivery Date',
    endDateLabel: lang === 'ar' ? 'إلى تاريخ تسليم' : 'To Delivery Date',
    branchLabel: lang === 'ar' ? 'الفرع' : 'Branch',
    allBranches: lang === 'ar' ? 'كل الفروع' : 'All Branches',
    selectBranch: lang === 'ar' ? 'اختر الفرع' : 'Select Branch',
    applyFiltersButton: lang === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters',
    noBranchesAvailable: lang === 'ar' ? 'لا توجد فروع متاحة' : 'No branches available',
  };

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <ListFilter className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
          {t.filterTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="startDateFilterDelivery">{t.startDateLabel}</Label>
          <DatePicker
            date={startDate}
            setDate={(date) => setStartDate(date || new Date())} 
            lang={lang}
            placeholder={t.startDateLabel}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDateFilterDelivery">{t.endDateLabel}</Label>
          <DatePicker
            date={endDate}
            setDate={(date) => setEndDate(date || new Date())} 
            lang={lang}
            placeholder={t.endDateLabel}
            disabled={(date) => startDate ? date < startDate : false}
          />
        </div>

        {showBranchFilter && (
          <div className="space-y-1.5">
            <Label htmlFor="branchFilterPrepareOrders">{t.branchLabel}</Label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <SelectTrigger id="branchFilterPrepareOrders">
                <SelectValue placeholder={t.selectBranch} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allBranches}</SelectItem>
                {availableBranches.length === 0 && <SelectItem value="no-branch-placeholder" disabled>{t.noBranchesAvailable}</SelectItem>}
                {availableBranches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button onClick={onFilter} className={`w-full ${showBranchFilter ? 'lg:w-auto lg:self-end' : 'md:col-start-2 lg:col-start-3 md:w-auto self-end'}`}>
          <Search className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {t.applyFiltersButton}
        </Button>
      </CardContent>
    </Card>
  );
}
