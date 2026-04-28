import { useCallback, useEffect, useMemo, useState } from "react";

type PaginationOptions = {
  pageSize?: number;
  resetKey?: string | number;
};

export function usePagination<T>(items: T[], { pageSize = 5, resetKey }: PaginationOptions = {}) {
  const [page, setPageState] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPageState(1);
  }, [pageSize, resetKey]);

  useEffect(() => {
    setPageState((value) => Math.min(Math.max(value, 1), totalPages));
  }, [totalPages]);

  const setPage = useCallback(
    (nextPage: number | ((currentPage: number) => number)) => {
      setPageState((value) => {
        const resolvedPage = typeof nextPage === "function" ? nextPage(value) : nextPage;
        return Math.min(Math.max(resolvedPage, 1), totalPages);
      });
    },
    [totalPages]
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    page: currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    setPage,
  };
}
