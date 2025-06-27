'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string; // Base path, e.g., /products
  children: ReactNode;
};

const NavLinkComponent = ({ href, children, className, ...props }: NavLinkProps) => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoize the localized href to avoid recalculation
  const localizedHref = React.useMemo(() => {
    return href === '/' ? `/${lang}` : `/${lang}${href.startsWith('/') ? href : `/${href}`}`;
  }, [href, lang]);

  // Memoize the active state check
  const isActive = React.useMemo(() => {
    return pathname === localizedHref || (href !== "/" && pathname.startsWith(localizedHref + '/'));
  }, [pathname, localizedHref, href]);

  // Memoize the className to avoid recalculation
  const linkClassName = React.useMemo(() => {
    return cn(
      'text-sm font-medium transition-all duration-200 hover:text-primary relative flex items-center gap-2',
      isActive ? 'text-primary font-bold' : 'text-muted-foreground',
      isNavigating && 'opacity-70',
      className
    );
  }, [isActive, isNavigating, className]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (pathname === localizedHref) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);

    // Reset navigation state after a delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
  }, [pathname, localizedHref]);

  return (
    <Link
      href={localizedHref}
      className={linkClassName}
      onClick={handleClick}
      {...props}
    >
      {isNavigating && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {children}
    </Link>
  );
};

NavLinkComponent.displayName = 'NavLink';
export const NavLink = React.memo(NavLinkComponent);
