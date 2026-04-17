import { Building2, Power, PowerOff, Search, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentRow } from "@/pages/admin/agents/types";

type AgentsTableCardProps = {
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  filteredAgents: AgentRow[];
  onManageCompanies: (agent: AgentRow) => void;
  onToggleActive: (agent: AgentRow) => void;
};

export default function AgentsTableCard({
  search,
  onSearchChange,
  isLoading,
  filteredAgents,
  onManageCompanies,
  onToggleActive,
}: AgentsTableCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">All Agents</CardTitle>
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11 rounded-xl"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading agents...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{agent.display_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{agent.email || "No email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.is_active ? "default" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => onManageCompanies(agent)}
                        >
                          <Building2 className="h-4 w-4 mr-1" /> Manage Companies
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => onToggleActive(agent)}
                        >
                          {agent.is_active ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" /> Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
