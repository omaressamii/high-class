
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, ListChecks, X } from 'lucide-react';
import type { ProductTypeDefinition } from '@/types';
import { database } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

interface ManageProductTypesDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onTypeAdded: () => void; // Callback to refresh types in parent form
  lang: 'ar' | 'en';
}

export function ManageProductTypesDialog({
  isOpen,
  setIsOpen,
  onTypeAdded,
  lang,
}: ManageProductTypesDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTypes, setIsFetchingTypes] = useState(false);
  const [existingTypes, setExistingTypes] = useState<ProductTypeDefinition[]>([]);
  const [newTypeNameAr, setNewTypeNameAr] = useState('');

  const t = {
    dialogTitle: lang === 'ar' ? 'إدارة أنواع المنتجات' : 'Manage Product Types',
    dialogDescription: lang === 'ar' ? 'عرض وإضافة أنواع منتجات جديدة.' : 'View and add new product types.',
    currentTypesLabel: lang === 'ar' ? 'الأنواع الحالية:' : 'Current Types:',
    noTypesExist: lang === 'ar' ? 'لا توجد أنواع معرفة بعد.' : 'No types defined yet.',
    addNewTypeSectionTitle: lang === 'ar' ? 'إضافة نوع جديد' : 'Add New Type',
    typeNameArLabel: lang === 'ar' ? 'اسم النوع' : 'Type Name',
    typeNameArPlaceholder: lang === 'ar' ? 'مثال: بدلة' : 'e.g., بدلة',
    addButton: lang === 'ar' ? 'إضافة النوع' : 'Add Type',
    addingButton: lang === 'ar' ? 'جار الإضافة...' : 'Adding...',
    closeButton: lang === 'ar' ? 'إغلاق' : 'Close',
    typeAddedSuccess: lang === 'ar' ? 'تمت إضافة النوع بنجاح!' : 'Type added successfully!',
    typeAddedError: lang === 'ar' ? 'فشل في إضافة النوع.' : 'Failed to add type.',
    fetchTypesError: lang === 'ar' ? 'فشل في جلب الأنواع.' : 'Failed to fetch types.',
    nameRequired: lang === 'ar' ? 'الاسم مطلوب' : 'Name is required',
    loadingTypes: lang === 'ar' ? 'جار تحميل الأنواع...' : 'Loading types...',
  };

  const fetchProductTypes = async () => {
    setIsFetchingTypes(true);
    try {
      const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
      const docSnap = await get(typesConfigRef);
      if (docSnap.exists()) {
        const data = docSnap.val();
        setExistingTypes(data.types || []);
      } else {
        setExistingTypes([]);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      toast({ title: t.fetchTypesError, variant: 'destructive' });
    } finally {
      setIsFetchingTypes(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProductTypes();
    }
  }, [isOpen]);

  const handleAddType = async () => {
    if (!newTypeNameAr.trim()) {
      toast({ title: t.nameRequired, variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    // Generate a unique ID based on timestamp and random number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const newTypeId = `type_${timestamp}_${randomNum}`;

    const newType: ProductTypeDefinition = {
      id: newTypeId,
      name: newTypeNameAr.trim(), // Use Arabic name as the main name
      name_ar: newTypeNameAr.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const typesConfigRef = ref(database, 'system_settings/productTypesConfig');

      // Get current types and add the new one
      const currentSnap = await get(typesConfigRef);
      let currentTypes: ProductTypeDefinition[] = [];

      if (currentSnap.exists()) {
        currentTypes = currentSnap.val().types || [];
      }

      // Add the new type to the array
      const updatedTypes = [...currentTypes, newType];

      // Save back to database
      await set(typesConfigRef, { types: updatedTypes });

      toast({ title: t.typeAddedSuccess });
      setNewTypeNameAr('');
      onTypeAdded(); // Refresh types in parent
      fetchProductTypes(); // Re-fetch types for the dialog
    } catch (error) {
      console.error("Error adding product type:", error);
      toast({ title: t.typeAddedError, description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`sm:max-w-lg ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.dialogTitle}
          </DialogTitle>
          <DialogDescription>{t.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="font-semibold mb-2">{t.currentTypesLabel}</h3>
            {isFetchingTypes ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" /> {t.loadingTypes}
              </div>
            ) : existingTypes.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                {existingTypes.map((type) => (
                  <li key={type.id}>
                    {lang === 'ar' ? type.name_ar : type.name} ({type.id})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noTypesExist}</p>
            )}
          </div>

          <hr />

          <div>
            <h3 className="font-semibold mb-3">{t.addNewTypeSectionTitle}</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="newTypeNameAr">{t.typeNameArLabel}</Label>
                <Input
                  id="newTypeNameAr"
                  value={newTypeNameAr}
                  onChange={(e) => setNewTypeNameAr(e.target.value)}
                  placeholder={t.typeNameArPlaceholder}
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>
              <Button onClick={handleAddType} disabled={isLoading || !newTypeNameAr.trim()}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                )}
                {isLoading ? t.addingButton : t.addButton}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              <X className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t.closeButton}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
