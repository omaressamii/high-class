
'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleButtonProps {
  lang: 'ar' | 'en';
}

export function ThemeToggleButton({ lang }: ThemeToggleButtonProps) {
  const { setTheme, resolvedTheme } = useTheme();

  const t = {
    toggleTheme: lang === 'ar' ? 'تبديل السمة' : 'Toggle theme',
    light: lang === 'ar' ? 'فاتح' : 'Light',
    dark: lang === 'ar' ? 'داكن' : 'Dark',
    system: lang === 'ar' ? 'النظام' : 'System',
  };

  return (
    <DropdownMenu dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.toggleTheme}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t.toggleTheme}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className={resolvedTheme === 'light' ? 'bg-accent' : ''}>
          <Sun className={`h-4 w-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t.light}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className={resolvedTheme === 'dark' ? 'bg-accent' : ''}>
          <Moon className={`h-4 w-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t.dark}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className={resolvedTheme === 'system' ? 'bg-accent' : ''}>
          <Laptop className={`h-4 w-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t.system}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
