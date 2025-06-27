
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { useRouter } from 'next/navigation';

interface DeleteAllProductsButtonProps {
  lang: 'ar' | 'en';
}

export function DeleteAllProductsButton({ lang }: DeleteAllProductsButtonProps) {
  const { isLoading: authIsLoading, hasPermission } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const t = {
    deleteAllProducts: lang === 'ar' ? 'حذف جميع المنتجات' : 'Delete All Products',
    confirmDeleteTitle: lang === 'ar' ? 'تأكيد حذف جميع المنتجات؟' : 'Confirm Delete All Products?',
    confirmDeleteDescription: lang === 'ar' ? 'سيتم حذف جميع المنتجات بشكل دائم. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟' : 'This will permanently delete all products. This action cannot be undone. Are you sure?',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    confirm: lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
    deleting: lang === 'ar' ? 'جار الحذف...' : 'Deleting...',
    deleteAllSuccess: (count: number) => lang === 'ar' ? `تم حذف ${count} منتج بنجاح.` : `Successfully deleted ${count} products.`,
    deleteAllError: lang === 'ar' ? 'فشل حذف المنتجات.' : 'Failed to delete products.',
    noProductsToDelete: lang === 'ar' ? 'لا توجد منتجات لحذفها.' : 'No products to delete.',
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const productsRef = ref(database, 'products');
      const querySnapshot = await get(productsRef);

      if (!querySnapshot.exists()) {
        toast({
          title: t.noProductsToDelete,
          variant: 'default',
        });
        setIsDialogOpen(false);
        setIsDeleting(false);
        return;
      }

      const productsData = querySnapshot.val();
      const deletedCount = Object.keys(productsData).length;

      // Delete all products by removing the entire products node
      await remove(productsRef);

      toast({
        title: t.deleteAllSuccess(deletedCount),
      });
      router.refresh(); // Refresh the page to reflect the changes
    } catch (error: any) {
      console.error('Error deleting all products:', error);
      toast({
        title: t.deleteAllError,
        description: error.message || (lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  if (authIsLoading) {
    return (
      <Button variant="destructive" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
        {t.deleteAllProducts}
      </Button>
    );
  }

  if (!hasPermission('products_delete')) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex items-center">
          <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {t.deleteAllProducts}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
             <ShieldAlert className="mr-2 h-6 w-6 text-destructive rtl:ml-2 rtl:mr-0" />
            {t.confirmDeleteTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.confirmDeleteDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                {t.deleting}
              </>
            ) : (
              t.confirm
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
