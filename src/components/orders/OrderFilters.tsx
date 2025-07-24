
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { TransactionType, OrderStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface OrderFiltersProps {
  filters: {
    searchTerm: string;
    transactionType: TransactionType | 'all';
    status: OrderStatus | 'all';
    branchId?: string | 'all'; // Added branchId filter
  };
  setFilters: React.Dispatch<React.SetStateAction<OrderFiltersProps['filters']>>;
  lang: string;
  branches?: { id: string, name: string }[]; // Added branches for the dropdown
  showBranchFilter?: boolean; // To conditionally show the branch filter
}

const transactionTypeValues: TransactionType[] = ['Rental', 'Sale'];
const orderStatusValues: OrderStatus[] = ['Ongoing', 'Pending Preparation', 'Prepared', 'Delivered to Customer', 'Completed', 'Overdue', 'Cancelled'];


export function OrderFilters({ filters, setFilters, lang: propLang, branches, showBranchFilter }: OrderFiltersProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSelectChange = (field: keyof Omit<OrderFiltersProps['filters'], 'searchTerm'>) => (value: string) => {
    setFilters(prev => ({ ...prev, [field]: value as (TransactionType | OrderStatus | string | 'all') }));
  };

  const t = {
    filterOrders: lang === 'ar' ? 'فلترة الطلبات' : 'Filter Orders',
    searchLabel: lang === 'ar' ? 'بحث' : 'Search',
    searchPlaceholder: lang === 'ar' ? 'البحث بالطلب، المنتج، العميل أو رقم الهاتف...' : 'Search by Order ID, Product, Customer, or Phone...',
    transactionTypeLabel: lang === 'ar' ? 'نوع المعاملة' : 'Transaction Type',
    selectTypePlaceholder: lang === 'ar' ? 'اختر النوع' : 'Select Type',
    allTypes: lang === 'ar' ? 'كل الأنواع' : 'All Types',
    statusLabel: lang === 'ar' ? 'الحالة' : 'Status',
    selectStatusPlaceholder: lang === 'ar' ? 'اختر الحالة' : 'Select Status',
    allStatuses: lang === 'ar' ? 'كل الحالات' : 'All Statuses',
    branchLabel: lang === 'ar' ? 'الفرع' : 'Branch', // Added
    selectBranchPlaceholder: lang === 'ar' ? 'اختر الفرع' : 'Select Branch', // Added
    allBranches: lang === 'ar' ? 'كل الفروع' : 'All Branches', // Added
    rental: lang === 'ar' ? 'إيجار' : 'Rental',
    sale: lang === 'ar' ? 'بيع' : 'Sale',
    ongoing: lang === 'ar' ? 'جاري التنفيذ' : 'Ongoing',
    pendingPreparation: lang === 'ar' ? 'قيد التجهيز' : 'Pending Preparation',
    prepared: lang === 'ar' ? 'تم التجهيز' : 'Prepared',
    deliveredToCustomer: lang === 'ar' ? 'تم التسليم للعميل' : 'Delivered to Customer',
    completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    overdue: lang === 'ar' ? 'متأخر' : 'Overdue',
    cancelled: lang === 'ar' ? 'ملغى' : 'Cancelled',
  };

  const getTransactionTypeDisplay = (type: TransactionType) => {
    if (type === 'Rental') return t.rental;
    if (type === 'Sale') return t.sale;
    return type;
  };

  const getOrderStatusDisplay = (status: OrderStatus) => {
    if (status === 'Ongoing') return t.ongoing;
    if (status === 'Pending Preparation') return t.pendingPreparation;
    if (status === 'Prepared') return t.prepared;
    if (status === 'Delivered to Customer') return t.deliveredToCustomer;
    if (status === 'Completed') return t.completed;
    if (status === 'Overdue') return t.overdue;
    if (status === 'Cancelled') return t.cancelled;
    return status;
  };

  return (
    <Card className="mb-8 shadow-md rounded-lg">
        <CardHeader className="pb-4">
            <CardTitle className="font-headline text-xl flex items-center">
                <Filter className="h-5 w-5 mr-2 text-primary" />
                {t.filterOrders}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-3 ${showBranchFilter ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 items-end`}>
            <div className="space-y-1">
                <Label htmlFor="orderSearch">{t.searchLabel}</Label>
                <Input
                id="orderSearch"
                placeholder={t.searchPlaceholder}
                value={filters.searchTerm}
                onChange={handleInputChange}
                className="bg-card"
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="transactionType">{t.transactionTypeLabel}</Label>
                <Select value={filters.transactionType} onValueChange={handleSelectChange('transactionType')}>
                <SelectTrigger id="transactionType" className="bg-card">
                    <SelectValue placeholder={t.selectTypePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t.allTypes}</SelectItem>
                    {transactionTypeValues.map(type => <SelectItem key={type} value={type}>{getTransactionTypeDisplay(type)}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="orderStatus">{t.statusLabel}</Label>
                <Select value={filters.status} onValueChange={handleSelectChange('status')}>
                <SelectTrigger id="orderStatus" className="bg-card">
                    <SelectValue placeholder={t.selectStatusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    {orderStatusValues.map(status => <SelectItem key={status} value={status}>{getOrderStatusDisplay(status)}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>
            {showBranchFilter && branches && (
              <div className="space-y-1">
                <Label htmlFor="branchFilterOrders">{t.branchLabel}</Label>
                <Select value={filters.branchId || 'all'} onValueChange={handleSelectChange('branchId')}>
                  <SelectTrigger id="branchFilterOrders" className="bg-card">
                    <SelectValue placeholder={t.selectBranchPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allBranches}</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            </div>
        </CardContent>
    </Card>
  );
}
