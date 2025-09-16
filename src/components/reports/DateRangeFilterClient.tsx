'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { DatePicker } from '@/components/shared/DatePicker';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, X } from 'lucide-react';

interface DateRangeFilterClientProps {
  lang: 'ar' | 'en';
  startDate?: Date;
  endDate?: Date;
}

export function DateRangeFilterClient({ lang, startDate, endDate }: DateRangeFilterClientProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Initialize date state with the server-provided dates
  const [start, setStart] = useState<Date | undefined>(startDate);
  const [end, setEnd] = useState<Date | undefined>(endDate);

  useEffect(() => {
    // Sync state if server-provided dates change
    setStart(startDate);
    setEnd(endDate);
  }, [startDate, endDate]);

  const handleDateChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setStart(startDate);
    setEnd(endDate);

    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (startDate) {
      newSearchParams.set('startDate', format(startDate, 'yyyy-MM-dd'));
    } else {
      newSearchParams.delete('startDate');
    }

    if (endDate) {
      newSearchParams.set('endDate', format(endDate, 'yyyy-MM-dd'));
    } else {
      newSearchParams.delete('endDate');
    }

    const currentPath = `/${params.lang}/reports`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    handleDateChange(date, end);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    handleDateChange(start, date);
  };

  const clearFilters = () => {
    setStart(undefined);
    setEnd(undefined);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('startDate');
    newSearchParams.delete('endDate');
    const currentPath = `/${params.lang}/reports`;
    router.push(`${currentPath}?${newSearchParams.toString()}`);
  };

  const t = {
    dateRangeFilter: lang === 'ar' ? 'فلترة حسب نطاق التاريخ' : 'Filter by Date Range',
    startDate: lang === 'ar' ? 'من تاريخ' : 'From Date',
    endDate: lang === 'ar' ? 'إلى تاريخ' : 'To Date',
    clearFilters: lang === 'ar' ? 'مسح المرشحات' : 'Clear Filters',
  };

  return (
    <Card className="mb-6 shadow-md rounded-lg bg-card/50 border-primary/30">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
              {t.dateRangeFilter}
            </Label>
            {(start || end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0" />
                {t.clearFilters}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date-picker" className="text-sm font-medium">
                {t.startDate}
              </Label>
              <DatePicker
                date={start}
                setDate={handleStartDateChange}
                lang={lang}
                placeholder={t.startDate}
                disabled={(date) => end ? date > end : false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date-picker" className="text-sm font-medium">
                {t.endDate}
              </Label>
              <DatePicker
                date={end}
                setDate={handleEndDateChange}
                lang={lang}
                placeholder={t.endDate}
                disabled={(date) => start ? date < start : false}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}