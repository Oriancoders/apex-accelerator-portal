import { format } from "date-fns";
import { Coins, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { typeLabels } from "@/pages/admin/credits/data";
import type { Transaction } from "@/pages/admin/credits/types";

type TransactionsTableCardProps = {
  search: string;
  typeFilter: string;
  isLoading: boolean;
  transactions: Transaction[];
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
};

export default function TransactionsTableCard({
  search,
  typeFilter,
  isLoading,
  transactions,
  onSearchChange,
  onTypeFilterChange,
}: TransactionsTableCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description or user ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 rounded-ds-md"
            />
          </div>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-ds-md">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="deduction">Deduction</SelectItem>
              <SelectItem value="admin_credit">Admin Credit</SelectItem>
              <SelectItem value="admin_debit">Admin Debit</SelectItem>
              <SelectItem value="signup_bonus">Signup Bonus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const typeInfo = typeLabels[tx.type] || {
                      label: tx.type,
                      color: "bg-muted text-muted-foreground",
                      icon: Coins,
                    };
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${
                            tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {tx.user_id.slice(0, 8)}...
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="sm:hidden space-y-2 px-4">
              {transactions.map((tx) => {
                const typeInfo = typeLabels[tx.type] || {
                  label: tx.type,
                  color: "bg-muted text-muted-foreground",
                  icon: Coins,
                };
                return (
                  <div key={tx.id} className="p-4 rounded-ds-md border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${typeInfo.color} text-[10px]`}>
                        {typeInfo.label}
                      </Badge>
                      <span
                        className={`text-sm font-bold ${
                          tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-2 line-clamp-2">{tx.description || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No transactions found
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
