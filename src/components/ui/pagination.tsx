import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  getPageNumbers: () => number[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  lang: 'ar' | 'en';
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onFirstPage,
  onLastPage,
  getPageNumbers,
  hasNextPage,
  hasPreviousPage,
  lang,
  className,
}: PaginationProps) {
  const isRTL = lang === 'ar';
  
  const t = {
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    to: lang === 'ar' ? 'إلى' : 'to',
    of: lang === 'ar' ? 'من' : 'of',
    results: lang === 'ar' ? 'نتيجة' : 'results',
    previous: lang === 'ar' ? 'السابق' : 'Previous',
    next: lang === 'ar' ? 'التالي' : 'Next',
    first: lang === 'ar' ? 'الأول' : 'First',
    last: lang === 'ar' ? 'الأخير' : 'Last',
    page: lang === 'ar' ? 'صفحة' : 'Page',
  };

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Results info */}
      <div className="text-sm text-muted-foreground text-center">
        {t.showing} {startItem} {t.to} {endItem} {t.of} {totalItems} {t.results}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* First page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFirstPage}
          disabled={!hasPreviousPage}
          className="hidden sm:flex"
          title={t.first}
        >
          {isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          title={t.previous}
        >
          {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <span className="hidden sm:inline ml-2 rtl:mr-2 rtl:ml-0">{t.previous}</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                "min-w-[40px]",
                pageNumber === currentPage && "bg-primary text-primary-foreground"
              )}
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          title={t.next}
        >
          <span className="hidden sm:inline mr-2 rtl:ml-2 rtl:mr-0">{t.next}</span>
          {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLastPage}
          disabled={!hasNextPage}
          className="hidden sm:flex"
          title={t.last}
        >
          {isRTL ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile page info */}
      <div className="text-xs text-muted-foreground text-center sm:hidden">
        {t.page} {currentPage} {t.of} {totalPages}
      </div>
    </div>
  );
}
