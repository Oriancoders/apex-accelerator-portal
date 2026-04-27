import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import { MAX_RECENT_TICKETS } from "../constants";

interface RecentTicketsTableProps {
  tickets: any[];
}

export function RecentTicketsTable({ tickets }: RecentTicketsTableProps) {
  if (tickets.length === 0) return null;

  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" /> Recent Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Credits</th>
            </tr>
          </thead>
          <tbody>
            {tickets.slice(0, MAX_RECENT_TICKETS).map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground truncate max-w-[180px]">{t.title}</p>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{t.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right font-medium">{t.credit_cost ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
