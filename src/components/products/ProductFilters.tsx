
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ProductTypeDefinition, ProductCategory, ProductStatus, ProductSize } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    searchTerm: string;
    type: string | 'all'; // Changed from ProductType to string for type ID
    category: ProductCategory | 'all';
    status: ProductStatus | 'all';
    size: ProductSize | 'all';
  };
  setFilters: React.Dispatch<React.SetStateAction<ProductFiltersProps['filters']>>;
  lang: string;
  availableProductTypes: ProductTypeDefinition[]; // Added prop for dynamic types
}

// These are now only for category, status, size as type is dynamic
// const productTypeValues: ProductType[] = ['Suit', 'Dress']; // Removed
const productCategoryValues: ProductCategory[] = ['Rental', 'Sale'];
const productStatusValues: ProductStatus[] = ['Available', 'Rented', 'Sold'];
const productSizeValues: ProductSize[] = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', 'Custom'];


export function ProductFilters({ filters, setFilters, lang: propLang, availableProductTypes }: ProductFiltersProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSelectChange = (field: keyof Omit<ProductFiltersProps['filters'], 'searchTerm'>) => (value: string) => {
    setFilters(prev => ({ ...prev, [field]: value as (string | ProductCategory | ProductStatus | ProductSize | 'all') }));
  };

  const t = {
    filterProducts: lang === 'ar' ? 'فلترة المنتجات' : 'Filter Products',
    searchLabel: lang === 'ar' ? 'بحث' : 'Search',
    searchPlaceholder: lang === 'ar' ? 'البحث بالاسم أو الوصف أو الكود...' : 'Search by name, description, or code...',
    typeLabel: lang === 'ar' ? 'النوع' : 'Type',
    selectTypePlaceholder: lang === 'ar' ? 'اختر النوع' : 'Select Type',
    allTypes: lang === 'ar' ? 'كل الأنواع' : 'All Types',
    categoryLabel: lang === 'ar' ? 'الفئة' : 'Category',
    selectCategoryPlaceholder: lang === 'ar' ? 'اختر الفئة' : 'Select Category',
    allCategories: lang === 'ar' ? 'كل الفئات' : 'All Categories',
    statusLabel: lang === 'ar' ? 'الحالة' : 'Status',
    selectStatusPlaceholder: lang === 'ar' ? 'اختر الحالة' : 'Select Status',
    allStatuses: lang === 'ar' ? 'كل الحالات' : 'All Statuses',
    sizeLabel: lang === 'ar' ? 'المقاس' : 'Size',
    selectSizePlaceholder: lang === 'ar' ? 'اختر المقاس' : 'Select Size',
    allSizes: lang === 'ar' ? 'كل المقاسات' : 'All Sizes',
    // Translations for values
    // suit: lang === 'ar' ? 'بدلة' : 'Suit', (Removed as types are dynamic)
    // dress: lang === 'ar' ? 'فستان' : 'Dress', (Removed)
    rental: lang === 'ar' ? 'إيجار' : 'Rental',
    sale: lang === 'ar' ? 'بيع' : 'Sale',
    available: lang === 'ar' ? 'متوفر' : 'Available',
    rented: lang === 'ar' ? 'مستأجر' : 'Rented',
    sold: lang === 'ar' ? 'مباع' : 'Sold',
  };

  const getProductCategoryDisplay = (category: ProductCategory) => {
    if (category === 'Rental') return t.rental;
    if (category === 'Sale') return t.sale;
    return category;
  };

  const getProductStatusDisplay = (status: ProductStatus) => {
    if (status === 'Available') return t.available;
    if (status === 'Rented') return t.rented;
    if (status === 'Sold') return t.sold;
    return status;
  };

  const getProductSizeDisplay = (size: ProductSize) => {
    return size;
  };


  return (
    <Card className="mb-8 shadow-md rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline text-xl flex items-center">
          <Filter className="h-5 w-5 mr-2 text-primary" />
          {t.filterProducts}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="searchTerm">{t.searchLabel}</Label>
            <Input
              id="searchTerm"
              placeholder={t.searchPlaceholder}
              value={filters.searchTerm}
              onChange={handleInputChange}
              className="bg-card"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">{t.typeLabel}</Label>
            <Select value={filters.type} onValueChange={handleSelectChange('type')}>
              <SelectTrigger id="type" className="bg-card">
                <SelectValue placeholder={t.selectTypePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {availableProductTypes.map(typeDef => (
                  <SelectItem key={typeDef.id} value={typeDef.id}>
                    {lang === 'ar' ? typeDef.name_ar : typeDef.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">{t.categoryLabel}</Label>
            <Select value={filters.category} onValueChange={handleSelectChange('category')}>
              <SelectTrigger id="category" className="bg-card">
                <SelectValue placeholder={t.selectCategoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {productCategoryValues.map(cat => <SelectItem key={cat} value={cat}>{getProductCategoryDisplay(cat)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">{t.statusLabel}</Label>
            <Select value={filters.status} onValueChange={handleSelectChange('status')}>
              <SelectTrigger id="status" className="bg-card">
                <SelectValue placeholder={t.selectStatusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                {productStatusValues.map(stat => <SelectItem key={stat} value={stat}>{getProductStatusDisplay(stat)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="size">{t.sizeLabel}</Label>
            <Select value={filters.size} onValueChange={handleSelectChange('size')}>
              <SelectTrigger id="size" className="bg-card">
                <SelectValue placeholder={t.selectSizePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSizes}</SelectItem>
                {productSizeValues.map(s => <SelectItem key={s} value={s}>{getProductSizeDisplay(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
