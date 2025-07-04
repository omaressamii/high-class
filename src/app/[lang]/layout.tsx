/**
 * @file src/app/[lang]/layout.tsx
 * @description This is the root layout file for the application.
 * It wraps all pages and provides the basic HTML structure,
 * including language settings (lang) and text direction (dir: rtl/ltr).
 * It imports global styles (globals.css) and loads web fonts used in the application.
 * It displays the SiteHeader and Toaster component permanently on all pages.
 * 
 * @param {object} props - Properties passed to the component.
 * @param {React.ReactNode} props.children - The content of the current page to be displayed within this layout.
 * @param {object} props.params - Object containing dynamic route parameters.
 * @param {string} props.params.lang - The current language code (e.g., "ar", "en") extracted from the path.
 * @returns {JSX.Element} JSX element representing the entire page structure.
 */
'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import '../globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from "next-themes";
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import React from 'react';

const RootLayoutComponent = ({
  children,
  params: routeParamsProp
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) => {
  const paramsFromHook = useParams();
  const lang = paramsFromHook.lang as string;
  const effectiveLang = useMemo(() => lang === 'en' ? 'en' : 'ar', [lang]);

  // Memoize body className to prevent recalculation
  const bodyClassName = useMemo(() =>
    `font-body antialiased min-h-screen flex flex-col ${effectiveLang === 'ar' ? 'font-arabic' : ''}`,
    [effectiveLang]
  );

  return (
    <html lang={effectiveLang} dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <title>ClasicStore - Wedding Rentals & Sales</title>
        <meta name="description" content="Manage your wedding suits and dresses rentals and sales with ClasicStore." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={bodyClassName}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TopProgressBar />
            <SiteHeader lang={effectiveLang} />
            <main className="flex-grow px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
              {children}
            </main>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

RootLayoutComponent.displayName = 'RootLayout';
export default React.memo(RootLayoutComponent);
