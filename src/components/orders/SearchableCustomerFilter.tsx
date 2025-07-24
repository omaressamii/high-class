"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer } from "@/types";

interface SearchableCustomerFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  availableCustomers: Customer[];
  lang: 'ar' | 'en';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyText?: string;
}

export function SearchableCustomerFilter({
  value,
  onValueChange,
  availableCustomers,
  lang,
  placeholder,
  disabled,
  className,
  allowEmpty = false,
  emptyText,
}: SearchableCustomerFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const t = {
    searchPlaceholder: lang === 'ar' ? 'ابحث عن العميل...' : 'Search customer...',
    noCustomerFound: lang === 'ar' ? 'لم يتم العثور على عميل.' : 'No customer found.',
    emptyOption: emptyText || (lang === 'ar' ? 'لا يوجد عميل محدد' : 'No customer selected'),
  };

  const currentCustomer = availableCustomers.find(customer => customer.id === value);

  // Create options array including empty option if allowed
  const allOptions = React.useMemo(() => {
    const options = [...availableCustomers];
    if (allowEmpty) {
      options.unshift({
        id: '',
        fullName: t.emptyOption,
        phoneNumber: '',
        address: '',
        idCardNumber: '',
        notes: '',
        createdAt: null,
        createdByUserId: '',
        branchId: '',
        branchName: '',
      } as Customer);
    }
    return options;
  }, [availableCustomers, allowEmpty, t.emptyOption]);

  // Memoize filtered customers to avoid re-computation on every render
  const filteredCustomerList = React.useMemo(() => {
    if (!allOptions) return [];
    const safeSearchValue = searchValue?.trim().toLowerCase() || "";

    if (!safeSearchValue) {
      return allOptions;
    }

    return allOptions.filter(customer => {
      // Skip filtering for empty option
      if (customer.id === '') return true;
      
      const fullName = customer.fullName?.toLowerCase() || "";
      const phoneNumber = customer.phoneNumber?.toLowerCase() || "";
      
      const nameMatch = fullName.includes(safeSearchValue);
      const phoneMatch = phoneNumber.includes(safeSearchValue);
      
      return nameMatch || phoneMatch;
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
          {currentCustomer && currentCustomer.id !== ''
            ? `${currentCustomer.fullName} (${currentCustomer.phoneNumber})`
            : placeholder || t.emptyOption}
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
            {filteredCustomerList.length === 0 && <CommandEmpty>{t.noCustomerFound}</CommandEmpty>}
            <CommandGroup>
              {filteredCustomerList.map((customer) => (
                <CommandItem
                  key={customer.id || 'empty'}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setSearchValue('');
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">{customer.fullName}</div>
                    {customer.id !== '' && (
                      <div className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'الهاتف' : 'Phone'}: {customer.phoneNumber}
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
