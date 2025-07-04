import type { ReactNode } from 'react';
import React from 'react'; // Import React for React.memo

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

// Wrap PageTitle with React.memo
const PageTitleComponent = ({ children, className }: PageTitleProps) => {
  return (
    <h1 className={`font-headline text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-4 sm:mb-6 lg:mb-8 leading-tight ${className || ''}`}>
      {children}
    </h1>
  );
};

PageTitleComponent.displayName = 'PageTitle';
export const PageTitle = React.memo(PageTitleComponent);
