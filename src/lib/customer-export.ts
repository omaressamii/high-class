import type { Customer } from '@/types';

const ARABIC_HEADERS = [
  'الاسم',
  'الهاتف الأساسي',
  'الهاتف الثانوي',
  'المنطقة',
] as const;

const ENGLISH_HEADERS = [
  'Name',
  'Primary Phone',
  'Secondary Phone',
  'Area',
] as const;

export function buildCustomersExportRows(
  customers: Customer[],
  lang: 'ar' | 'en'
): (string | number)[][] {
  const headers = lang === 'ar' ? [...ARABIC_HEADERS] : [...ENGLISH_HEADERS];

  const rows = customers.map((customer) => [
    customer.fullName,
    customer.phoneNumber,
    customer.secondaryPhoneNumber ?? '',
    customer.address ?? '',
  ]);

  return [headers, ...rows];
}

export async function exportCustomersToExcel(
  customers: Customer[],
  lang: 'ar' | 'en',
  filename?: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const data = buildCustomersExportRows(customers, lang);
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    lang === 'ar' ? 'العملاء' : 'Customers'
  );

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, filename ?? `customers_${date}.xlsx`);
}
