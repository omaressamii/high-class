
import type { User, UserPermissionsArray, PermissionString, ProductTypeDefinition, ProductCategory, ProductSize, ProductStatus } from '@/types';
import { PERMISSION_STRINGS } from '@/types';

export const defaultPermissionsValues: UserPermissionsArray = [];

export const allPermissions: UserPermissionsArray = [...PERMISSION_STRINGS];

export const cashierPermissions: UserPermissionsArray = [
  'dashboard_view',
  'products_view',
  'products_view_details',
  'products_add',
  'products_availability_view',
  'customers_view',
  'customers_manage',
  'orders_view',
  'orders_add',
  'orders_edit_price',
  'orders_apply_discount',
  'orders_prepare',
  'returns_receive',
  'financials_view',
  'payments_record',
];

export const permissionDetails: { id: PermissionString; oldKey?: string }[] = [
  { id: 'dashboard_view' },
  { id: 'products_view', oldKey: 'canViewProducts' },
  { id: 'products_view_details' },
  { id: 'products_add', oldKey: 'canAddProducts' },
  { id: 'products_edit', oldKey: 'canEditProducts' },
  { id: 'products_delete', oldKey: 'canDeleteProducts' },
  { id: 'products_availability_view' },
  { id: 'customers_view', oldKey: 'canViewCustomers' },
  { id: 'customers_manage', oldKey: 'canManageCustomers' },
  { id: 'orders_view', oldKey: 'canViewOrders' },
  { id: 'orders_add', oldKey: 'canAddOrders' },
  { id: 'orders_edit', oldKey: 'canEditOrders' },
  { id: 'orders_delete', oldKey: 'canDeleteOrders' },
  { id: 'orders_prepare' },
  { id: 'orders_edit_price' },
  { id: 'returns_receive', oldKey: 'canReceiveReturns' },
  { id: 'financials_view', oldKey: 'canViewFinancials' },
  { id: 'payments_record', oldKey: 'canRecordPayments' },
  { id: 'reports_view', oldKey: 'canViewReports' },
  { id: 'users_view', oldKey: 'canViewUsers' },
  { id: 'users_manage', oldKey: 'canManageUsers' },
  { id: 'branches_manage' },
  { id: 'view_all_branches' },
];


export const mockUsers: User[] = [
];

// These values are now primarily for reference or initial seeding.
// UI should fetch dynamic types from Firestore.
export const productTypeValues: ProductTypeDefinition[] = [
  { id: 'suit', name: 'Suit', name_ar: 'بدلة' },
  { id: 'dress', name: 'Dress', name_ar: 'فستان' },
];
export const productCategoryValues: ProductCategory[] = ['Rental', 'Sale'];
export const productSizeValues: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];
export const productStatusValues: ProductStatus[] = ['Available', 'Rented', 'Sold'];


export const mockProducts: Product[] = [];


export const mockCustomers: Customer[] = [

  {
    id: 'C008',
    fullName: 'ريم عبد العزيز الفهد',
    phoneNumber: '0581239876',
    address: 'المدينة المنورة، حي قباء، بجانب مسجد قباء',
    idCardNumber: 'IDR0123456789',
    notes: 'تبحث عن فستان خطوبة للإيجار، الميزانية متوسطة.',
  },
];


export const mockOrders: Order[] = [
  {
    id: 'O001',
    items: [{ productId: 'P_Firestore_ID_1', productName: 'بدلة سوداء كلاسيكية فاخرة', productCode: '90000001', quantity: 1, priceAtTimeOfOrder: 150 }],
    customerId: 'C001',
    customerName: 'أليس عبد الرحمن النمر',
    sellerId: 'S001',
    processedByUserId: 'U002',
    transactionType: 'Rental',
    orderDate: '2025-05-05',
    deliveryDate: '2025-05-10',
    returnDate: '2025-05-15',
    totalPrice: 150,
    paidAmount: 50,
    remainingAmount: 100,
    status: 'Ongoing',
    notes: 'طلبت التسليم السريع. تم التأكيد مع العميل على موعد الإرجاع.',
  },
  {
    id: 'O002',
    items: [{ productId: 'P_Firestore_ID_2', productName: 'فستان زفاف الأحلام الأبيض', productCode: '90000002', quantity: 1, priceAtTimeOfOrder: 1200 }],
    customerId: 'C002',
    customerName: 'باسم النجار الفايد',
    sellerId: 'S002',
    processedByUserId: 'U003',
    transactionType: 'Sale',
    orderDate: '2025-05-08',
    deliveryDate: '2025-05-12',
    totalPrice: 1200,
    paidAmount: 1200,
    remainingAmount: 0,
    status: 'Completed',
    notes: 'تم بيع المنتج مع طقم إكسسوارات إضافي بقيمة 150 جنيه. العميل سعيد جدًا.',
  },
];

export const mockPayments: Payment[] = [
    {
        id: 'PAY001',
        orderId: 'O001',
        date: '2025-05-05',
        amount: 50,
        paymentMethod: 'Card',
        notes: 'دفعة أولى للإيجار.',
        processedByUserId: 'U002',
    },
];
