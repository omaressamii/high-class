"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ref, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface DeleteProductButtonProps {
  productId: string;
  lang: 'ar' | 'en';
  className?: string;
}

export const DeleteProductButton: React.FC<DeleteProductButtonProps> = ({ productId, lang, className }) => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const t = {
    delete: lang === 'ar' ? 'حذف المنتج' : 'Delete Product',
    confirm: lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
    confirmMsg: lang === 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this product? This action cannot be undone.',
    success: lang === 'ar' ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.',
    error: lang === 'ar' ? 'فشل حذف المنتج.' : 'Failed to delete product.'
  };

  if (!hasPermission('products_delete')) return null;

  const handleDelete = async () => {
    if (!window.confirm(t.confirmMsg)) return;
    setLoading(true);
    try {
      await remove(ref(database, `products/${productId}`));
  toast({ title: t.success });
  // Refresh the page after successful deletion
  window.location.reload();
    } catch (e) {
      toast({ title: t.error, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={loading} className={className}>
      {t.delete}
    </Button>
  );
};
