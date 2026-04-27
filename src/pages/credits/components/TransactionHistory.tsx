import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { CreditTransaction } from "../types";

interface TransactionHistoryProps {
  transactions: CreditTransaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function TransactionHistory({
  transactions,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  isLoading,
  onPageChange,
}: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <div className="py-8 text-center text-muted-foreground">
          No transactions yet. Purchase credits to get started!
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {tx.description || tx.type}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={`inline-flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {isPositive ? "+" : ""}{tx.amount}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
