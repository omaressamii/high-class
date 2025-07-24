
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
import type { Product } from '@/types';

interface ProductSelectorProps {
  products: Product[];
  value: string | undefined; // Selected productId
  onValueChange: (productId: string | undefined) => void;
  onProductSelect: (product: Product | undefined) => void; // To pass full product details for price etc.
  lang: 'ar' | 'en';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductSelector({
  products,
  value,
  onValueChange,
  onProductSelect,
  lang,
  placeholder,
  disabled,
  className,
}: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const t = {
    selectProduct: lang === 'ar' ? 'اختر منتجًا...' : 'Select a product...',
    noProductFound: lang === 'ar' ? 'لم يتم العثور على منتج.' : 'No product found.',
    searchProducts: lang === 'ar' ? 'ابحث عن المنتجات بالاسم أو الكود...' : 'Search products by name or code...',
  };

  const currentProduct = products.find((product) => product.id === value);

  const handleSelect = (currentValue: string) => {
    // currentValue is product.id
    const selectedProd = products.find(p => p.id === currentValue);
    onValueChange(selectedProd ? selectedProd.id : undefined);
    onProductSelect(selectedProd);
    setOpen(false);
    setSearchValue(''); 
  };

  // Memoize filtered products to avoid re-computation on every render
  const filteredProductList = React.useMemo(() => {
    if (!products) return [];
    const safeSearchValue = searchValue?.trim().toLowerCase() || "";

    if (!safeSearchValue) { // If search value is empty, show all products from the prop
      return products;
    }

    return products.filter(product => {
      const productNameLower = product.name?.toLowerCase() || "";
      const productCodeLower = product.productCode?.toLowerCase() || "";
      
      const nameMatch = product.name ? productNameLower.includes(safeSearchValue) : false;
      const codeMatch = product.productCode ? productCodeLower.includes(safeSearchValue) : false;
      
      return nameMatch || codeMatch;
    });
  }, [products, searchValue]);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSearchValue(''); // Clear search when popover closes
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          {currentProduct
            ? `${currentProduct.name} (${currentProduct.productCode || 'N/A'})`
            : placeholder || t.selectProduct}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}> {/* We are doing custom filtering via filteredProductList */}
          <CommandInput
            placeholder={t.searchProducts}
            value={searchValue}
            onValueChange={setSearchValue} // Updates searchValue, triggers useMemo for filteredProductList
          />
          <CommandList>
            {filteredProductList.length === 0 && <CommandEmpty>{t.noProductFound}</CommandEmpty>}
            <CommandGroup>
              {filteredProductList.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id} // This value is passed to onSelect
                  onSelect={handleSelect} // handleSelect will receive product.id
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">{product.name || (lang === 'ar' ? 'منتج بدون اسم' : 'Unnamed Product')}</div>
                    <div className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'الكود' : 'Code'}: {product.productCode || 'N/A'} - {lang === 'ar' ? 'السعر' : 'Price'}: {product.price?.toFixed(2) || '0.00'}
                    </div>
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
