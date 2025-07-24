
import React, { useState } from 'react'; // Import React
import type { User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Settings, Briefcase, ShieldCheck, ShieldQuestion, Store, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ref, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { useRouter } from 'next/navigation';

interface UserCardProps {
  user: User;
  lang: string;
  onUserDeleted?: () => void;
}

// Wrap component with React.memo
const UserCard = React.memo(function UserCard({ user, lang: propLang, onUserDeleted }: UserCardProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const t = {
    manageUser: lang === 'ar' ? 'إدارة المستخدم' : 'Manage User',
    deleteUser: lang === 'ar' ? 'حذف المستخدم' : 'Delete User',
    username: lang === 'ar' ? 'اسم المستخدم' : 'Username',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    seller: lang === 'ar' ? 'بائع (للتتبع)' : 'Seller (Tracking)',
    systemUser: lang === 'ar' ? 'مستخدم نظام' : 'System User',
    permissionsNotSet: lang === 'ar' ? 'الصلاحيات غير محددة' : 'Permissions not set',
    noBranchAssigned: lang === 'ar' ? 'لم يتم تعيين فرع' : 'No branch assigned',
    deleteConfirmTitle: lang === 'ar' ? 'تأكيد حذف المستخدم' : 'Confirm User Deletion',
    deleteConfirmDescription: lang === 'ar'
      ? `هل أنت متأكد من حذف المستخدم "${user.fullName}"؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`,
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    userDeletedSuccess: lang === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully',
    userDeleteError: lang === 'ar' ? 'فشل في حذف المستخدم' : 'Failed to delete user',
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const userRef = ref(database, `users/${user.id}`);
      await remove(userRef);

      toast({
        title: t.userDeletedSuccess,
        description: `${user.fullName} ${lang === 'ar' ? 'تم حذفه من النظام.' : 'has been removed from the system.'}`,
      });

      // Call the callback to refresh the user list
      if (onUserDeleted) {
        onUserDeleted();
      }

      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: t.userDeleteError,
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const displayRoleOrType = () => {
    // Check for admin/manager permissions first
    if (user.permissions?.includes('users_manage')) {
       return (
        <Badge variant="default" className="capitalize">
          <ShieldCheck className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
          {lang === 'ar' ? 'مسؤول/مدير' : 'Admin/Manager'}
        </Badge>
      );
    }

    // Check for cashier-like permissions
    if (user.permissions?.includes('payments_record') || user.permissions?.includes('orders_add')) {
        return (
         <Badge variant="secondary" className="capitalize">
           <ShieldQuestion className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
           {lang === 'ar' ? 'كاشير' : 'Cashier'}
         </Badge>
       );
     }

    // Show seller badge if user is marked as seller
    if (user.isSeller) {
      return (
        <Badge variant="outline" className="capitalize">
          <Briefcase className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
          {t.seller}
        </Badge>
      );
    }

    // Default system user
    return (
        <Badge variant="outline" className="capitalize">
          <UserCircle className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
          {t.systemUser}
        </Badge>
      );
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl flex items-center">
                <UserCircle className="h-6 w-6 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                {user.fullName}
            </CardTitle>
            {displayRoleOrType()}
        </div>
        <CardDescription>
          {t.username}: @{user.username || (lang === 'ar' ? 'غير متوفر' : 'N/A')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">ID: {user.id}</p>
        {user.branchName && (
          <div className="flex items-center">
            <Store className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
            <span>{t.branch}: {user.branchName}</span>
          </div>
        )}
        {!user.branchName && (
            <div className="flex items-center">
                <Store className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground italic">{t.noBranchAssigned}</span>
            </div>
        )}
        {user.permissions && user.permissions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'صلاحيات رئيسية: ' : 'Key Permissions: '}
            {user.permissions.includes('users_manage') ? (lang === 'ar' ? 'إدارة المستخدمين، ' : 'Manage Users, ') : ''}
            {user.permissions.includes('products_edit') ? (lang === 'ar' ? 'إدارة المنتجات، ' : 'Manage Products, ') : ''}
            {user.permissions.length > 2 ? '...' : ''}
          </div>
        )}
         {(!user.permissions || user.permissions.length === 0) && (
            <p className="text-xs text-muted-foreground italic">{t.permissionsNotSet}</p>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex gap-2">
        <Button asChild variant="outline" className="flex-1 hover:bg-accent hover:text-accent-foreground">
          <Link href={`/${lang}/users/${user.id}/edit`}>
            <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.manageUser}
          </Link>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="px-3"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {lang === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t.delete}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});

export { UserCard };
