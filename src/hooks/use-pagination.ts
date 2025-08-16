import { useState, useMemo } from "react";

interface UsePaginationProps {
  totalItems: number;
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination({ 
  totalItems, 
  initialPageSize = 15,
  initialPage = 1 
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const paginatedRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return { start, end };
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Reset to first page when changing page size
    setCurrentPage(1);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedRange,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
  };
}