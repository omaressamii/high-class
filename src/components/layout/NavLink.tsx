'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string; // Base path, e.g., /products
  children: ReactNode;
};

export function NavLink({ href, children, className, ...props }: NavLinkProps) {
  const pathname = usePathname(); // e.g., /ar/products or /en/products
  const params = useParams(); // { lang: "ar" } or { lang: "en" }
  const lang = params.lang as string;

  // Construct the localized href for the Link component
  // Ensure href like "/" becomes "/[lang]" and "/products" becomes "/[lang]/products"
  const localizedHref = href === '/' ? `/${lang}` : `/${lang}${href.startsWith('/') ? href : `/${href}`}`;
  
  // For isActive check, compare against the full pathname
  // A link is active if the current pathname is exactly the localized href,
  // or if it's not the root and the current pathname starts with the localized href + a trailing slash (for nested routes)
  const isActive = pathname === localizedHref || (href !== "/" && pathname.startsWith(localizedHref + '/'));

  return (
    <Link
      href={localizedHref} // Use localized href for the Link
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        isActive ? 'text-primary font-bold' : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
