'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types for responsive table
export interface ResponsiveTableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  className?: string;
  mobileCardClassName?: string;
  emptyMessage?: string;
  lang?: 'ar' | 'en';
  onRowClick?: (item: T) => void;
}

// Mobile card component for table rows
const MobileTableCard = <T,>({ 
  item, 
  columns, 
  className, 
  lang = 'en',
  onClick 
}: {
  item: T;
  columns: ResponsiveTableColumn<T>[];
  className?: string;
  lang?: 'ar' | 'en';
  onClick?: () => void;
}) => {
  const visibleColumns = columns.filter(col => !col.hideOnMobile);
  
  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow duration-200',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {visibleColumns.map((column) => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(item)
            : (item as any)[column.accessor];
          
          const displayValue = column.render ? column.render(value, item) : value;
          const label = column.mobileLabel || column.header;
          
          return (
            <div key={column.key} className="table-mobile-row">
              <span className="table-mobile-label">{label}:</span>
              <span className={cn(
                'table-mobile-value',
                lang === 'ar' ? 'text-left' : 'text-right'
              )}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Desktop table component
const DesktopTable = <T,>({ 
  data, 
  columns, 
  className, 
  lang = 'en',
  onRowClick 
}: {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  className?: string;
  lang?: 'ar' | 'en';
  onRowClick?: (item: T) => void;
}) => {
  return (
    <div className="relative w-full overflow-auto mobile-scroll">
      <table className={cn("w-full caption-bottom text-sm border-collapse table-enhanced", className)}>
        <thead>
          <tr className="border-b-2 border-border bg-muted/30">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "font-semibold text-foreground border-r border-border/60 last:border-r-0 py-3 px-4 text-center",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-border/40 transition-all duration-200 hover:bg-muted/20 hover:shadow-sm",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => {
                const value = typeof column.accessor === 'function' 
                  ? column.accessor(item)
                  : (item as any)[column.accessor];
                
                const displayValue = column.render ? column.render(value, item) : value;
                
                return (
                  <td
                    key={column.key}
                    className={cn(
                      "p-4 align-middle text-center border-r border-border/50 last:border-r-0",
                      column.className
                    )}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main responsive table component
export const ResponsiveTable = <T,>({
  data,
  columns,
  className,
  mobileCardClassName,
  emptyMessage,
  lang = 'en',
  onRowClick
}: ResponsiveTableProps<T>) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {emptyMessage || (lang === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display')}
        </p>
      </div>
    );
  }
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <MobileTableCard
            key={index}
            item={item}
            columns={columns}
            className={mobileCardClassName}
            lang={lang}
            onClick={() => onRowClick?.(item)}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn("rounded-lg border overflow-hidden shadow-lg bg-card", className)}>
      <DesktopTable
        data={data}
        columns={columns}
        lang={lang}
        onRowClick={onRowClick}
      />
    </div>
  );
};

// Export utility function to create columns easily
export const createTableColumn = <T,>(
  key: string,
  header: string,
  accessor: keyof T | ((item: T) => React.ReactNode),
  options?: {
    className?: string;
    mobileLabel?: string;
    hideOnMobile?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
  }
): ResponsiveTableColumn<T> => ({
  key,
  header,
  accessor,
  ...options
});
