
'use client';

import Link from 'next/link';
import { NavLink } from './NavLink';
import { ThemeToggleButton } from './ThemeToggleButton';
import { LogIn, LogOut, Users as UsersIcon, BarChartHorizontalBig, Banknote, LayoutDashboard, ShoppingBag, Users, ListOrdered, Shirt, Feather, Undo2, UserCircle, Store, PackageSearch, CalendarCheck } from 'lucide-react';
import type { PermissionString } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useOptimizedAuth } from '@/hooks/use-optimized-auth';
import { useNavigationPrefetch } from '@/hooks/use-navigation-prefetch';
import { Button } from '@/components/ui/button';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface NavLinkItem {
  href: string;
  en: string;
  ar: string;
  icon: React.ElementType;
  requiredPermission?: PermissionString | PermissionString[]; 
}

interface SiteHeaderProps {
  lang: string;
}

const SiteHeaderComponent = ({ lang }: SiteHeaderProps) => {
  const { logout } = useAuth(); // Keep original for logout function
  const { isAuthenticated, isLoading, user: currentUser, checkPermission, commonPermissions } = useOptimizedAuth();
  const { prefetchCommonRoutes } = useNavigationPrefetch();
  const effectiveLang = lang as 'ar' | 'en';

  // Prefetch common routes when user is authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      prefetchCommonRoutes(effectiveLang);
    }
  }, [isAuthenticated, isLoading, effectiveLang, prefetchCommonRoutes]);

  // Memoize navigation links to avoid recreation on every render
  const navLinks: NavLinkItem[] = React.useMemo(() => [
    { href: "/dashboard", en: "Dashboard", ar: "لوحة التحكم", icon: LayoutDashboard, requiredPermission: "dashboard_view" },
    { href: "/products", en: "Products", ar: "المنتجات", icon: ShoppingBag, requiredPermission: 'products_view' },
    { href: "/products/availability", en: "Availability", ar: "توفر المنتج", icon: CalendarCheck, requiredPermission: 'products_availability_view' },
    { href: "/customers", en: "Customers", ar: "العملاء", icon: Users, requiredPermission: 'customers_view' },
    { href: "/orders", en: "Orders", ar: "الطلبات", icon: ListOrdered, requiredPermission: 'orders_view' },
    { href: "/orders/prepare", en: "Prepare Orders", ar: "تجهيز الطلبات", icon: PackageSearch, requiredPermission: 'orders_prepare' },
    { href: "/returns/receive", en: "Returns", ar: "المرتجعات", icon: Undo2, requiredPermission: 'returns_receive' },
    { href: "/financials", en: "Financials", ar: "المالية", icon: Banknote, requiredPermission: 'financials_view' },
    { href: "/reports", en: "Reports", ar: "التقارير", icon: BarChartHorizontalBig, requiredPermission: 'reports_view' },
    { href: "/users", en: "Users", ar: "المستخدمين", icon: UsersIcon, requiredPermission: 'users_view' },
    { href: "/branches", en: "Branches", ar: "الفروع", icon: Store, requiredPermission: 'branches_manage' },
  ], []);

  // Memoize static values
  const siteName = React.useMemo(() => "هاى كلاس", []);
  const homeAriaLabel = React.useMemo(() =>
    lang === 'ar' ? `${siteName} - الصفحة الرئيسية` : `${siteName} - Home`,
    [lang, siteName]
  );
  const dashboardAriaLabel = React.useMemo(() =>
    currentUser?.branchName
      ? `${siteName} (${currentUser.branchName}) - ${lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}`
      : homeAriaLabel,
    [currentUser?.branchName, siteName, lang, homeAriaLabel]
  );


  // Memoize permission check function using optimized auth
  const userHasPermissionForLink = React.useCallback((link: NavLinkItem): boolean => {
    if (!link.requiredPermission) return true;
    if (Array.isArray(link.requiredPermission)) {
      return checkPermission.hasAll(link.requiredPermission);
    }
    return checkPermission.has(link.requiredPermission);
  }, [checkPermission]);

  // Memoize filtered navigation links with optimized permissions
  const filteredNavLinks = React.useMemo(() => {
    if (isLoading || !isAuthenticated) return [];

    return navLinks.filter(link => {
      // Use pre-computed common permissions for better performance
      switch (link.href) {
        case "/dashboard": return commonPermissions.canViewDashboard;
        case "/products": return commonPermissions.canViewProducts;
        case "/products/availability": return commonPermissions.canViewProductAvailability;
        case "/customers": return commonPermissions.canViewCustomers;
        case "/orders": return commonPermissions.canViewOrders;
        case "/orders/prepare": return commonPermissions.canPrepareOrders;
        case "/returns/receive": return commonPermissions.canReceiveReturns;
        case "/financials": return commonPermissions.canViewFinancials;
        case "/reports": return commonPermissions.canViewReports;
        case "/users": return commonPermissions.canViewUsers;
        case "/branches": return commonPermissions.canManageBranches;
        default: return userHasPermissionForLink(link);
      }
    });
  }, [navLinks, isLoading, isAuthenticated, commonPermissions, userHasPermissionForLink]);


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-16 items-center justify-between">
        <Link href={lang === 'ar' ? '/ar' : '/en'} className="flex items-center gap-2" aria-label={homeAriaLabel}>
          <Shirt className="h-6 w-6 text-primary" />
          <Feather className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold text-primary">
            {siteName}
            {currentUser && currentUser.branchName && !currentUser.permissions?.includes('view_all_branches') && (
              <span className="text-base font-medium text-muted-foreground ml-1 rtl:mr-1 rtl:ml-0">
                ({currentUser.branchName})
              </span>
            )}
             {currentUser && currentUser.permissions?.includes('view_all_branches') && (
              <span className="text-base font-medium text-muted-foreground ml-1 rtl:mr-1 rtl:ml-0">
                ({lang === 'ar' ? 'جميع الفروع' : 'All Branches'})
              </span>
            )}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-3 md:gap-5">
          {currentUser && filteredNavLinks.map(link => (
            <NavLink key={link.href} href={link.href} className="flex items-center gap-1">
              {link.icon && <link.icon className="h-4 w-4" />}
              <span className={link.icon ? '' : ''}>{lang === 'ar' ? link.ar : link.en}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggleButton lang={effectiveLang} /> 
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : currentUser ? (
            <DropdownMenu dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-3">
                  <UserCircle className="h-5 w-5" />
                  <span className="hidden md:inline">{currentUser.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{lang === 'ar' ? 'حسابي' : 'My Account'}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground -mt-2">{currentUser.username}</DropdownMenuLabel>
                {currentUser.branchName && !currentUser.permissions?.includes('view_all_branches') && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{lang === 'ar' ? 'الفرع:' : 'Branch:'} {currentUser.branchName}</DropdownMenuLabel>}
                {currentUser.permissions?.includes('view_all_branches') && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{lang === 'ar' ? 'الوصول:' : 'Access:'} {lang === 'ar' ? 'جميع الفروع' : 'All Branches'}</DropdownMenuLabel>}
                <DropdownMenuSeparator />
                <div className="md:hidden">
                  {filteredNavLinks.map(link => (
                    <DropdownMenuItem key={`mobile-${link.href}`} asChild>
                      <NavLink href={link.href} className="w-full justify-start">
                        {link.icon && <link.icon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />}
                        {lang === 'ar' ? link.ar : link.en}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <NavLink href="/login" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

SiteHeaderComponent.displayName = 'SiteHeader';
export const SiteHeader = React.memo(SiteHeaderComponent);
