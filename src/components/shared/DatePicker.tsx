
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  lang: 'ar' | 'en';
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ date, setDate, lang, placeholder, disabled }: DatePickerProps) {
  const locale = lang === 'ar' ? arSA : enUS;
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setOpen(false);
  };
  
  const t = {
    pickDate: lang === 'ar' ? 'اختر تاريخًا' : 'Pick a date',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className={lang === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
          {date ? format(date, 'PPP', { locale }) : <span>{placeholder || t.pickDate}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={locale}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
