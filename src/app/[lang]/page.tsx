
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import Image from 'next/image';

export default async function SplashPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const effectiveLang = lang === 'en' ? 'en' : 'ar';
  const companyName = "هاى كلاس"; // High Class
  const welcomeMessage = effectiveLang === 'ar' ? `مرحباً بكم في ${companyName}` : `Welcome to ${companyName}`;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/logo.png"
          alt={effectiveLang === 'ar' ? 'خلفية شعار هاى كلاس' : 'High Class Background Logo'}
          fill
          className="opacity-10 object-contain"
          sizes="100vw"
          data-ai-hint="high class logo"
          priority
        />
      </div>
      
      <h1 className="font-headline text-6xl md:text-8xl font-bold text-primary mb-6 tracking-tight z-10">
        {companyName}
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground font-body z-10">
        {welcomeMessage}
      </p>
    </div>
  );
}
