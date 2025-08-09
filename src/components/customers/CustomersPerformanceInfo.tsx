import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Eye, Filter } from 'lucide-react';

interface CustomersPerformanceInfoProps {
  totalCustomers: number;
  filteredCustomers: number;
  currentPageItems: number;
  currentPage: number;
  totalPages: number;
  lang: 'ar' | 'en';
}

export function CustomersPerformanceInfo({
  totalCustomers,
  filteredCustomers,
  currentPageItems,
  currentPage,
  totalPages,
  lang,
}: CustomersPerformanceInfoProps) {
  const t = {
    totalCustomers: lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers',
    filteredCustomers: lang === 'ar' ? 'العملاء المفلترة' : 'Filtered Customers',
    currentPage: lang === 'ar' ? 'الصفحة الحالية' : 'Current Page',
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    of: lang === 'ar' ? 'من' : 'of',
    page: lang === 'ar' ? 'صفحة' : 'Page',
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Total customers */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-muted-foreground">{t.totalCustomers}:</span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {totalCustomers.toLocaleString()}
            </span>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border" />

          {/* Filtered customers */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-muted-foreground">{t.filteredCustomers}:</span>
            <span className="font-semibold text-green-700 dark:text-green-300">
              {filteredCustomers.toLocaleString()}
            </span>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border" />

          {/* Current page info */}
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-muted-foreground">{t.showing}:</span>
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {currentPageItems}
            </span>
            <span className="text-muted-foreground">{t.of}</span>
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {filteredCustomers.toLocaleString()}
            </span>
          </div>

          {/* Page info */}
          {totalPages > 1 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.page}:</span>
                <span className="font-semibold text-orange-700 dark:text-orange-300">
                  {currentPage}
                </span>
                <span className="text-muted-foreground">{t.of}</span>
                <span className="font-semibold text-orange-700 dark:text-orange-300">
                  {totalPages}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
