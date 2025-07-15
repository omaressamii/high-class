'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ProductTypeDefinition } from '@/types';

interface SearchableProductTypeFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  availableProductTypes: ProductTypeDefinition[];
  lang: 'ar' | 'en';
  placeholder?: string;
  allTypesText?: string;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean; // Allow empty selection for forms
  emptyText?: string; // Text for empty option
}

export function SearchableProductTypeFilter({
  value,
  onValueChange,
  availableProductTypes,
  lang,
  placeholder,
  allTypesText,
  disabled,
  className,
  allowEmpty = false,
  emptyText,
}: SearchableProductTypeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const t = {
    searchPlaceholder: lang === 'ar' ? 'ابحث عن نوع المنتج...' : 'Search product type...',
    noTypeFound: lang === 'ar' ? 'لم يتم العثور على نوع منتج.' : 'No product type found.',
    allTypes: allTypesText || (lang === 'ar' ? 'جميع الأنواع' : 'All Types'),
    emptyOption: emptyText || (lang === 'ar' ? 'لا يوجد نوع محدد' : 'No type selected'),
  };

  // Get current selected type
  const currentType = value === 'all'
    ? { id: 'all', name: t.allTypes, name_ar: t.allTypes }
    : value === '' && allowEmpty
    ? { id: '', name: t.emptyOption, name_ar: t.emptyOption }
    : availableProductTypes.find((type) => type.id === value);

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue);
    setOpen(false);
    setSearchValue('');
  };

  // Create a combined list with special options
  const allOptions = React.useMemo(() => {
    const options = [];

    if (allowEmpty) {
      options.push({ id: '', name: t.emptyOption, name_ar: t.emptyOption });
    } else {
      options.push({ id: 'all', name: t.allTypes, name_ar: t.allTypes });
    }

    return [...options, ...availableProductTypes];
  }, [availableProductTypes, t.allTypes, t.emptyOption, allowEmpty]);

  // Memoize filtered types to avoid re-computation on every render
  const filteredTypeList = React.useMemo(() => {
    if (!allOptions) return [];
    const safeSearchValue = searchValue?.trim().toLowerCase() || "";

    if (!safeSearchValue) {
      return allOptions;
    }

    return allOptions.filter(type => {
      const nameEn = type.name?.toLowerCase() || "";
      const nameAr = type.name_ar?.toLowerCase() || "";
      
      const nameEnMatch = nameEn.includes(safeSearchValue);
      const nameArMatch = nameAr.includes(safeSearchValue);
      
      return nameEnMatch || nameArMatch;
    });
  }, [allOptions, searchValue]);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSearchValue('');
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-card", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          {currentType
            ? (lang === 'ar' ? currentType.name_ar : currentType.name)
            : placeholder || t.allTypes}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t.searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredTypeList.length === 0 && <CommandEmpty>{t.noTypeFound}</CommandEmpty>}
            <CommandGroup>
              {filteredTypeList.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.id}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === type.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">
                      {lang === 'ar' ? type.name_ar : type.name}
                    </div>
                    {type.id !== 'all' && (
                      <div className="text-xs text-muted-foreground">
                        {lang === 'ar' ? type.name : type.name_ar}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
