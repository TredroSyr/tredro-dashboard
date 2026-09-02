"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTablePaginationProps {
  pagination?: { page: number; totalPages: number };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function DataTablePagination({
  pagination,
  onPageChange,
  isLoading,
}: DataTablePaginationProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Skeleton className="h-8 w-20" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }

  if (!pagination) return null;

  const { page: currentPage, totalPages } = pagination;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const renderPageButtons = () => {
    if (totalPages <= 0) return null;
    const pages: React.ReactNode[] = [];
    const maxVisible = 5;

    pages.push(
      <Button
        key="page-1"
        variant={currentPage === 1 ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8 text-sm"
        onClick={() => goToPage(1)}
      >
        1
      </Button>,
    );

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) endPage = Math.min(totalPages - 1, maxVisible - 1);
    else if (currentPage >= totalPages - 2)
      startPage = Math.max(2, totalPages - maxVisible + 2);

    if (startPage > 2) {
      pages.push(
        <span
          key="ellipsis-1"
          className="px-2 flex items-center text-gray-400 text-sm"
        >
          ...
        </span>,
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8 text-sm"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>,
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <span
          key="ellipsis-2"
          className="px-2 flex items-center text-gray-400 text-sm"
        >
          ...
        </span>,
      );
    }

    if (totalPages > 1) {
      pages.push(
        <Button
          key={`page-${totalPages}`}
          variant={currentPage === totalPages ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8 text-sm"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>,
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ArrowRight className="me-2 h-4 w-4" />
        السابق
      </Button>

      <div className="flex items-center gap-1">{renderPageButtons()}</div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        التالي
        <ArrowLeft className="ms-2 h-4 w-4" />
      </Button>
    </div>
  );
}
