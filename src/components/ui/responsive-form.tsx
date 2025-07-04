'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types for responsive form
export interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  lang?: 'ar' | 'en';
  onSubmit?: (e: React.FormEvent) => void;
}

export interface ResponsiveFormRowProps {
  children: React.ReactNode;
  className?: string;
  lang?: 'ar' | 'en';
}

export interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  className?: string;
  lang?: 'ar' | 'en';
  align?: 'left' | 'right' | 'center';
}

// Form row component that stacks on mobile
export const ResponsiveFormRow = ({ 
  children, 
  className, 
  lang = 'en' 
}: ResponsiveFormRowProps) => {
  return (
    <div className={cn(
      'form-row',
      lang === 'ar' && 'rtl',
      className
    )}>
      {children}
    </div>
  );
};

// Form actions component with mobile-friendly button layout
export const ResponsiveFormActions = ({ 
  children, 
  className, 
  lang = 'en',
  align = 'right'
}: ResponsiveFormActionsProps) => {
  const alignmentClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center'
  };
  
  return (
    <div className={cn(
      'btn-group-mobile',
      alignmentClasses[align],
      lang === 'ar' && 'rtl',
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-responsive button component
export const ResponsiveButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    fullWidthOnMobile?: boolean;
  }
>(({ className, fullWidthOnMobile = true, ...props }, ref) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return (
    <Button
      ref={ref}
      className={cn(
        fullWidthOnMobile && isMobile && 'w-full',
        'min-h-[44px]', // Ensure proper touch target
        className
      )}
      {...props}
    />
  );
});

ResponsiveButton.displayName = 'ResponsiveButton';

// Main responsive form component
export const ResponsiveForm = ({ 
  children, 
  className, 
  title, 
  description, 
  lang = 'en',
  onSubmit 
}: ResponsiveFormProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const formContent = (
    <form 
      onSubmit={onSubmit}
      className={cn(
        'form-mobile',
        className
      )}
    >
      {children}
    </form>
  );
  
  // On mobile, wrap in a card for better visual separation
  if (isMobile && (title || description)) {
    return (
      <Card className="shadow-lg">
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && (
              <CardTitle className="text-lg font-semibold">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </CardHeader>
        )}
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {formContent}
    </div>
  );
};

// Form field wrapper with mobile-optimized spacing
export const ResponsiveFormField = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={cn('form-group', className)}>
      {children}
    </div>
  );
};

// Mobile-optimized input wrapper
export const ResponsiveInputWrapper = ({ 
  children, 
  label, 
  error, 
  required = false,
  className 
}: { 
  children: React.ReactNode; 
  label?: string;
  error?: string;
  required?: boolean;
  className?: string; 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

// Responsive dialog/modal content wrapper
export const ResponsiveDialogContent = ({ 
  children, 
  className,
  maxWidth = 'md'
}: { 
  children: React.ReactNode; 
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  
  return (
    <div className={cn(
      'w-full mx-auto p-4 sm:p-6',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};
