
import React from 'react'; // Import React
import type { User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Settings, Briefcase, ShieldCheck, ShieldQuestion, Store } from 'lucide-react';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface UserCardProps {
  user: User;
  lang: string;
}

// Wrap component with React.memo
const UserCard = React.memo(function UserCard({ user, lang: propLang }: UserCardProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';

  const t = {
    manageUser: lang === 'ar' ? 'إدارة المستخدم' : 'Manage User',
    username: lang === 'ar' ? 'اسم المستخدم' : 'Username',
    branch: lang === 'ar' ? 'الفرع' : 'Branch',
    seller: lang === 'ar' ? 'بائع (للتتبع)' : 'Seller (Tracking)',
    systemUser: lang === 'ar' ? 'مستخدم نظام' : 'System User',
    permissionsNotSet: lang === 'ar' ? 'الصلاحيات غير محددة' : 'Permissions not set',
    noBranchAssigned: lang === 'ar' ? 'لم يتم تعيين فرع' : 'No branch assigned',
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
            {user.permissions.includes('products_manage') ? (lang === 'ar' ? 'إدارة المنتجات، ' : 'Manage Products, ') : ''}
            {user.permissions.length > 2 ? '...' : ''}
          </div>
        )}
         {(!user.permissions || user.permissions.length === 0) && (
            <p className="text-xs text-muted-foreground italic">{t.permissionsNotSet}</p>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
          <Link href={`/${lang}/users/${user.id}/edit`}>
            <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t.manageUser}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

export { UserCard };
