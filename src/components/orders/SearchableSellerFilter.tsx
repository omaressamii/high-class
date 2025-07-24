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
import { User } from "@/types";

interface SearchableSellerFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  availableSellers: User[];
  lang: 'ar' | 'en';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyText?: string;
  noSellerValue?: string;
  noSellerText?: string;
}

export function SearchableSellerFilter({
  value,
  onValueChange,
  availableSellers,
  lang,
  placeholder,
  disabled,
  className,
  allowEmpty = false,
  emptyText,
  noSellerValue = 'no-seller',
  noSellerText,
}: SearchableSellerFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const t = {
    searchPlaceholder: lang === 'ar' ? 'ابحث عن البائع...' : 'Search seller...',
    noSellerFound: lang === 'ar' ? 'لم يتم العثور على بائع.' : 'No seller found.',
    emptyOption: emptyText || (lang === 'ar' ? 'لا يوجد بائع محدد' : 'No seller selected'),
    noSpecificSeller: noSellerText || (lang === 'ar' ? 'لا يوجد بائع محدد' : 'No specific seller'),
  };

  const currentSeller = availableSellers.find(seller => seller.id === value);

  // Create options array including no-seller option and empty option if allowed
  const allOptions = React.useMemo(() => {
    const options = [...availableSellers];
    
    // Add no-seller option at the beginning
    options.unshift({
      id: noSellerValue,
      username: '',
      fullName: t.noSpecificSeller,
      isSeller: true,
      permissions: [],
      branchId: '',
      branchName: '',
      createdAt: null,
      updatedAt: null,
    } as User);

    if (allowEmpty) {
      options.unshift({
        id: '',
        username: '',
        fullName: t.emptyOption,
        isSeller: true,
        permissions: [],
        branchId: '',
        branchName: '',
        createdAt: null,
        updatedAt: null,
      } as User);
    }
    return options;
  }, [availableSellers, allowEmpty, t.emptyOption, t.noSpecificSeller, noSellerValue]);

  // Memoize filtered sellers to avoid re-computation on every render
  const filteredSellerList = React.useMemo(() => {
    if (!allOptions) return [];
    const safeSearchValue = searchValue?.trim().toLowerCase() || "";

    if (!safeSearchValue) {
      return allOptions;
    }

    return allOptions.filter(seller => {
      // Skip filtering for empty option and no-seller option
      if (seller.id === '' || seller.id === noSellerValue) return true;
      
      const fullName = seller.fullName?.toLowerCase() || "";
      const username = seller.username?.toLowerCase() || "";
      
      const nameMatch = fullName.includes(safeSearchValue);
      const usernameMatch = username.includes(safeSearchValue);
      
      return nameMatch || usernameMatch;
    });
  }, [allOptions, searchValue, noSellerValue]);

  const getDisplayText = () => {
    if (value === noSellerValue) {
      return t.noSpecificSeller;
    }
    if (currentSeller && currentSeller.id !== '' && currentSeller.id !== noSellerValue) {
      return currentSeller.fullName;
    }
    return placeholder || t.emptyOption;
  };

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
          {getDisplayText()}
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
            {filteredSellerList.length === 0 && <CommandEmpty>{t.noSellerFound}</CommandEmpty>}
            <CommandGroup>
              {filteredSellerList.map((seller) => (
                <CommandItem
                  key={seller.id || 'empty'}
                  value={seller.id}
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
                      value === seller.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">{seller.fullName}</div>
                    {seller.id !== '' && seller.id !== noSellerValue && seller.username && (
                      <div className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'اسم المستخدم' : 'Username'}: {seller.username}
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
