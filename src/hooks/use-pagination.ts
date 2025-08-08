import { useState, useMemo } from 'react';

export interface PaginationConfig {
  itemsPerPage: number;
  initialPage?: number;
}

export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  paginatedItems: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  getPageNumbers: () => number[];
}

export function usePagination<T>(
  items: T[],
  config: PaginationConfig
): PaginationResult<T> {
  const { itemsPerPage, initialPage = 1 } = config;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Ensure current page is within valid range
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    const hasNextPage = validCurrentPage < totalPages;
    const hasPreviousPage = validCurrentPage > 1;

    return {
      totalItems,
      totalPages,
      paginatedItems,
      hasNextPage,
      hasPreviousPage,
      validCurrentPage,
    };
  }, [items, itemsPerPage, currentPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  };

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(paginationData.totalPages);
  };

  const getPageNumbers = () => {
    const { totalPages, validCurrentPage } = paginationData;
    const pageNumbers: number[] = [];
    
    // Show max 5 page numbers around current page
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, validCurrentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return {
    currentPage: paginationData.validCurrentPage,
    totalPages: paginationData.totalPages,
    totalItems: paginationData.totalItems,
    itemsPerPage,
    paginatedItems: paginationData.paginatedItems,
    hasNextPage: paginationData.hasNextPage,
    hasPreviousPage: paginationData.hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    getPageNumbers,
  };
}
