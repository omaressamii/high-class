"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, User, Phone, MapPin, CreditCard, Building } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer, Branch } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ref, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface CustomerSelectorWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  availableCustomers: Customer[];
  branches: Branch[];
  lang: 'ar' | 'en';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyText?: string;
  onCustomerAdded?: (customer: Customer) => void;
}

interface NewCustomerForm {
  fullName: string;
  phoneNumber: string;
  address: string;
  idCardNumber: string;
  notes: string;
  branchId: string;
}

export function CustomerSelectorWithAdd({
  value,
  onValueChange,
  availableCustomers,
  branches,
  lang,
  placeholder,
  disabled,
  className,
  allowEmpty = false,
  emptyText,
  onCustomerAdded,
}: CustomerSelectorWithAddProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const { toast } = useToast();
  const { currentUser, hasPermission } = useAuth();

  const [newCustomer, setNewCustomer] = React.useState<NewCustomerForm>({
    fullName: '',
    phoneNumber: '',
    address: '',
    idCardNumber: '',
    notes: '',
    branchId: '',
  });

  const t = {
    searchPlaceholder: lang === 'ar' ? 'ابحث عن العميل...' : 'Search customer...',
    noCustomerFound: lang === 'ar' ? 'لم يتم العثور على عميل.' : 'No customer found.',
    emptyOption: emptyText || (lang === 'ar' ? 'لا يوجد عميل محدد' : 'No customer selected'),
    addNewCustomer: lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer',
    addCustomerTitle: lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer',
    addCustomerDescription: lang === 'ar' ? 'أدخل معلومات العميل الجديد' : 'Enter the new customer information',
    fullName: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    phoneNumber: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    address: lang === 'ar' ? 'العنوان' : 'Address',
    idCardNumber: lang === 'ar' ? 'رقم الهوية' : 'ID Card Number',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    saving: lang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    customerAdded: lang === 'ar' ? 'تم إضافة العميل بنجاح' : 'Customer added successfully',
    errorAddingCustomer: lang === 'ar' ? 'خطأ في إضافة العميل' : 'Error adding customer',
    fullNameRequired: lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required',
    phoneRequired: lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required',
    branchRequired: lang === 'ar' ? 'الفرع مطلوب' : 'Branch is required',
    selectBranch: lang === 'ar' ? 'اختر الفرع' : 'Select Branch',
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

  // Auto-set branch for users with specific branch
  React.useEffect(() => {
    if (!hasPermission('view_all_branches') && currentUser?.branchId) {
      setNewCustomer(prev => ({ ...prev, branchId: currentUser.branchId }));
    }
  }, [currentUser, hasPermission]);

  const handleAddCustomer = async () => {
    // Validation
    if (!newCustomer.fullName.trim()) {
      toast({
        title: t.errorAddingCustomer,
        description: t.fullNameRequired,
        variant: "destructive",
      });
      return;
    }

    if (!newCustomer.phoneNumber.trim()) {
      toast({
        title: t.errorAddingCustomer,
        description: t.phoneRequired,
        variant: "destructive",
      });
      return;
    }

    if (!hasPermission('view_all_branches') && !newCustomer.branchId) {
      toast({
        title: t.errorAddingCustomer,
        description: t.branchRequired,
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      const selectedBranch = newCustomer.branchId ? branches.find(b => b.id === newCustomer.branchId) : undefined;

      const customerDataToSave = {
        fullName: newCustomer.fullName.trim(),
        phoneNumber: newCustomer.phoneNumber.trim(),
        address: newCustomer.address.trim() || null,
        idCardNumber: newCustomer.idCardNumber.trim() || null,
        notes: newCustomer.notes.trim() || null,
        branchId: newCustomer.branchId || null,
        branchName: selectedBranch?.name || null,
        createdAt: new Date().toISOString(),
        createdByUserId: currentUser?.id || 'UNKNOWN_USER',
      };

      const customersRef = ref(database, 'customers');
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, customerDataToSave);

      const addedCustomer: Customer = {
        id: newCustomerRef.key!,
        ...customerDataToSave,
      };

      toast({
        title: t.customerAdded,
        description: `${newCustomer.fullName} ${lang === 'ar' ? 'أضيف بنجاح' : 'has been added'}`,
      });

      // Reset form
      setNewCustomer({
        fullName: '',
        phoneNumber: '',
        address: '',
        idCardNumber: '',
        notes: '',
        branchId: !hasPermission('view_all_branches') && currentUser?.branchId ? currentUser.branchId : '',
      });

      // Close dialog
      setShowAddDialog(false);

      // Select the new customer
      onValueChange(addedCustomer.id);

      // Notify parent component
      if (onCustomerAdded) {
        onCustomerAdded(addedCustomer);
      }

    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast({
        title: t.errorAddingCustomer,
        description: error.message || 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
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
                {/* Add new customer option */}
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowAddDialog(true);
                  }}
                  className="cursor-pointer border-b"
                >
                  <Plus className="mr-2 h-4 w-4 text-green-600" />
                  <div className="font-medium text-green-600">{t.addNewCustomer}</div>
                </CommandItem>
                
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

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.addCustomerTitle}
            </DialogTitle>
            <DialogDescription>
              {t.addCustomerDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.fullName} *
                </Label>
                <Input
                  id="fullName"
                  value={newCustomer.fullName}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={t.fullName}
                />
              </div>
              
              <div>
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t.phoneNumber} *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder={t.phoneNumber}
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t.address}
                </Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t.address}
                />
              </div>
              
              <div>
                <Label htmlFor="idCardNumber" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t.idCardNumber}
                </Label>
                <Input
                  id="idCardNumber"
                  value={newCustomer.idCardNumber}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, idCardNumber: e.target.value }))}
                  placeholder={t.idCardNumber}
                />
              </div>
              
              {hasPermission('view_all_branches') && (
                <div>
                  <Label htmlFor="branchId" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t.branch} *
                  </Label>
                  <Select
                    value={newCustomer.branchId}
                    onValueChange={(value) => setNewCustomer(prev => ({ ...prev, branchId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectBranch} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t.notes}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomer}
              disabled={isAdding}
            >
              {isAdding ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
