import type { Order, Product, ProductTypeDefinition } from '@/types';
import { getCurrentStockBalance } from '@/lib/product-utils';

const ARABIC_HEADERS = [
  'اسم الصنف',
  'المجموعة',
  'المقاس',
  'السعر',
  'النوع (بيع-ايجار)',
  'الكمية',
  'الفرع',
  'كود الصنف',
] as const;

const ENGLISH_HEADERS = [
  'Item Name',
  'Category',
  'Size',
  'Price',
  'Type (Sale/Rent)',
  'Quantity',
  'Branch',
  'Item Code',
] as const;

function getProductTypeName(
  typeId: string,
  productTypes: ProductTypeDefinition[],
  lang: 'ar' | 'en'
): string {
  const typeDef = productTypes.find((ptd) => ptd.id === typeId);
  if (!typeDef) {
    return lang === 'ar' ? 'نوع غير معروف' : 'Unknown Type';
  }
  return lang === 'ar' ? typeDef.name_ar : typeDef.name;
}

function getCategoryLabel(category: Product['category'], lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    return category === 'Rental' ? 'إيجار' : 'بيع';
  }
  return category;
}

function getBranchLabel(product: Product, lang: 'ar' | 'en'): string {
  if (product.branchName) {
    return product.branchName;
  }
  return lang === 'ar' ? 'الفرع الرئيسي' : 'Main Branch';
}

export function buildProductsExportRows(
  products: Product[],
  productTypes: ProductTypeDefinition[],
  lang: 'ar' | 'en',
  orders?: Order[]
): (string | number)[][] {
  const headers = lang === 'ar' ? [...ARABIC_HEADERS] : [...ENGLISH_HEADERS];

  const rows = products.map((product) => [
    product.name,
    getProductTypeName(product.type, productTypes, lang),
    product.size,
    product.price,
    getCategoryLabel(product.category, lang),
    // Current stock balance (initialStock − sold), not starting/initial stock
    getCurrentStockBalance(product, orders),
    getBranchLabel(product, lang),
    product.productCode ?? '',
  ]);

  return [headers, ...rows];
}

export async function exportProductsToExcel(
  products: Product[],
  productTypes: ProductTypeDefinition[],
  lang: 'ar' | 'en',
  filename?: string,
  orders?: Order[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const data = buildProductsExportRows(products, productTypes, lang, orders);
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    lang === 'ar' ? 'المنتجات' : 'Products'
  );

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, filename ?? `products_${date}.xlsx`);
}
