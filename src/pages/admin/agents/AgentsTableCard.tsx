import { Building2, Filter, Power, PowerOff, Search, Shield, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { AgentRow } from "@/pages/admin/agents/types";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/shared/PaginationControls";
import type { AgentStatusFilter } from "@/pages/admin/agents/useAdminAgentsPage";

const AGENT_PAGE_SIZE = 5;

type AgentsTableCardProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: AgentStatusFilter;
  onStatusFilterChange: (value: AgentStatusFilter) => void;
  isLoading: boolean;
  filteredAgents: AgentRow[];
  onManageCompanies: (agent: AgentRow) => void;
  onToggleActive: (agent: AgentRow) => void;
  onDeleteAgent: (agent: AgentRow) => void;
  deletePending: boolean;
};

export default function AgentsTableCard({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  filteredAgents,
  onManageCompanies,
  onToggleActive,
  onDeleteAgent,
  deletePending,
}: AgentsTableCardProps) {
  const {
    page,
    setPage,
    pageSize,
    paginatedItems: visibleAgents,
  } = usePagination(filteredAgents, { pageSize: AGENT_PAGE_SIZE, resetKey: `${search}:${statusFilter}` });

  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">All Agents</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 h-11 rounded-ds-md"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as AgentStatusFilter)}>
            <SelectTrigger className="h-11 rounded-ds-md sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
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
                {visibleAgents.map((agent) => (
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
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => onDeleteAgent(agent)}
                          disabled={deletePending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
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
            <PaginationControls
              page={page}
              totalItems={filteredAgents.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="agents"
              className="mt-4"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
