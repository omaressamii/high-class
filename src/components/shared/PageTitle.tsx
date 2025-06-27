import type { ReactNode } from 'react';
import React from 'react'; // Import React for React.memo

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

// Wrap PageTitle with React.memo
const PageTitleComponent = ({ children, className }: PageTitleProps) => {
  return (
    <h1 className={`font-headline text-3xl font-bold text-primary mb-8 ${className || ''}`}>
      {children}
    </h1>
  );
};

PageTitleComponent.displayName = 'PageTitle';
export const PageTitle = React.memo(PageTitleComponent);
