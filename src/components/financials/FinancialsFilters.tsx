
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/DatePicker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, XCircle } from 'lucide-react';
import type { FinancialTransactionType } from '@/types';
import { financialTransactionTypeValues } from '@/types'; // Import the array of types

interface FinancialsFiltersProps {
  filters: {
    transactionType: FinancialTransactionType | 'all';
    transactionCategory: string | 'all'; // Added
    startDate?: Date;
    endDate?: Date;
  };
  setFilters: React.Dispatch<React.SetStateAction<FinancialsFiltersProps['filters']>>;
  lang: 'ar' | 'en';
  availableCategories: string[]; // Added
}

export function FinancialsFilters({ filters, setFilters, lang, availableCategories }: FinancialsFiltersProps) {
  const t = {
    filterSectionTitle: lang === 'ar' ? 'تصفية المعاملات' : 'Filter Transactions',
    transactionTypeFilterLabel: lang === 'ar' ? 'نوع المعاملة' : 'Transaction Type',
    transactionCategoryFilterLabel: lang === 'ar' ? 'فئة المعاملة' : 'Transaction Category', // Added
    allTransactionTypes: lang === 'ar' ? 'كل الأنواع' : 'All Types',
    allTransactionCategories: lang === 'ar' ? 'كل الفئات' : 'All Categories', // Added
    filterStartDateLabel: lang === 'ar' ? 'من تاريخ' : 'From Date',
    filterEndDateLabel: lang === 'ar' ? 'إلى تاريخ' : 'To Date',
    clearFiltersButton: lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters',
    typeSale: lang === 'ar' ? 'قيمة بيع أولية' : 'Initial Sale Value',
    typeRental: lang === 'ar' ? 'قيمة إيجار أولية' : 'Initial Rental Value',
    typePaymentReceived: lang === 'ar' ? 'دفعة مستلمة' : 'Payment Received',
  };

  const displayTransactionTypeFilter = (type: FinancialTransactionType | 'all') => {
    if (type === 'all') return t.allTransactionTypes;
    if (type === 'Initial Sale Value') return t.typeSale;
    if (type === 'Initial Rental Value') return t.typeRental;
    if (type === 'Payment Received') return t.typePaymentReceived;
    return type;
  };

  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, transactionType: value as FinancialTransactionType | 'all' }));
  };

  const handleCategoryChange = (value: string) => { // Added
    setFilters(prev => ({ ...prev, transactionCategory: value as string | 'all'}));
  };

  const handleStartDateChange = (date?: Date) => {
    setFilters(prev => ({ ...prev, startDate: date }));
  };

  const handleEndDateChange = (date?: Date) => {
    setFilters(prev => ({ ...prev, endDate: date }));
  };

  const handleClearFilters = () => {
    setFilters({
      transactionType: 'all',
      transactionCategory: 'all', // Added
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <Card className="mb-6 shadow-md rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline text-xl flex items-center">
          <Filter className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
          {t.filterSectionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="transactionTypeFilter">{t.transactionTypeFilterLabel}</Label>
            <Select value={filters.transactionType} onValueChange={handleTypeChange} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <SelectTrigger id="transactionTypeFilter">
                <SelectValue placeholder={t.allTransactionTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{displayTransactionTypeFilter('all')}</SelectItem>
                {financialTransactionTypeValues.map(type => (
                  <SelectItem key={type} value={type}>
                    {displayTransactionTypeFilter(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"> {/* New filter for category */}
            <Label htmlFor="transactionCategoryFilter">{t.transactionCategoryFilterLabel}</Label>
            <Select value={filters.transactionCategory} onValueChange={handleCategoryChange} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <SelectTrigger id="transactionCategoryFilter">
                <SelectValue placeholder={t.allTransactionCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTransactionCategories}</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category} {/* Assuming categories are already translated or simple strings */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filterStartDate">{t.filterStartDateLabel}</Label>
            <DatePicker
              date={filters.startDate}
              setDate={handleStartDateChange}
              lang={lang}
              placeholder={t.filterStartDateLabel}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filterEndDate">{t.filterEndDateLabel}</Label>
            <DatePicker
              date={filters.endDate}
              setDate={handleEndDateChange}
              lang={lang}
              placeholder={t.filterEndDateLabel}
              disabled={(date) => filters.startDate ? date < filters.startDate : false}
            />
          </div>
          <Button onClick={handleClearFilters} variant="outline" className="w-full md:w-auto self-end">
            <XCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.clearFiltersButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
