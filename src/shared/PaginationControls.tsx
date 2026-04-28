import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
};

function getVisiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function PaginationControls({
  page,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className={cn("flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-xs text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-ds-md px-2 sm:px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <span className="text-xs text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {visiblePages.map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === page ? "default" : "outline"}
              size="sm"
              className="h-9 w-9 rounded-ds-md p-0"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-ds-md px-2 sm:px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}
