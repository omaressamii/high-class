
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { DatePicker } from '@/components/shared/DatePicker';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface DatePickerClientProps {
  lang: 'ar' | 'en';
  currentSelectedDate: Date; // Date object from server
}

export function DatePickerClient({ lang, currentSelectedDate }: DatePickerClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize date state with the server-provided date
  const [date, setDate] = useState<Date | undefined>(currentSelectedDate);

  useEffect(() => {
    // Sync state if server-provided date changes (e.g., due to direct URL navigation)
    setDate(currentSelectedDate);
  }, [currentSelectedDate]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (newDate) {
      newSearchParams.set('date', format(newDate, 'yyyy-MM-dd'));
    } else {
      // If date is cleared, remove the date param
      newSearchParams.delete('date');
    }
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  const t = {
    selectDate: lang === 'ar' ? 'اختر تاريخ العرض:' : 'Select Display Date:',
  };

  return (
    <Card className="mb-6 shadow-md rounded-lg bg-card/50 border-primary/30">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0">
          <Label htmlFor="dashboard-date-picker" className="text-sm font-medium flex items-center shrink-0">
            <CalendarDays className="mr-2 h-5 w-5 text-primary rtl:ml-2 rtl:mr-0" />
            {t.selectDate}
          </Label>
          <div className="w-full sm:w-auto sm:min-w-[280px]">
            <DatePicker
              date={date}
              setDate={handleDateChange}
              lang={lang}
              placeholder={t.selectDate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
