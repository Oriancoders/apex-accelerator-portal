import { format } from "date-fns";
import { Coins, Edit, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleBadgeVariant, roleLabel } from "@/pages/admin/users/roleUtils";
import type { AppRole, Profile } from "@/pages/admin/users/types";

type UsersListCardProps = {
  search: string;
  isLoading: boolean;
  users: Profile[];
  roleByUserId: Map<string, AppRole>;
  onSearchChange: (value: string) => void;
  onOpenUser: (user: Profile) => void;
  getCompanyLabel: (user: Profile) => string;
};

export default function UsersListCard({
  search,
  isLoading,
  users,
  roleByUserId,
  onSearchChange,
  onOpenUser,
  getCompanyLabel,
}: UsersListCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="px-4 sm:px-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-ds-md"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{user.email || "—"}</TableCell>
                      <TableCell className="text-sm">{getCompanyLabel(user)}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(roleByUserId.get(user.user_id))} className="capitalize">
                          {roleLabel(roleByUserId.get(user.user_id))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/10 text-accent">
                          <Coins className="h-3 w-3 mr-1" />
                          {user.credits}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{user.auth_provider || "email"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onOpenUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-2 px-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-ds-md border border-border-subtle hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onOpenUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                    <Badge variant="outline" className="bg-accent/10 text-accent text-xs">
                      <Coins className="h-3 w-3 mr-1" />
                      {user.credits}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={roleBadgeVariant(roleByUserId.get(user.user_id))} className="text-[10px] capitalize">
                      {roleLabel(roleByUserId.get(user.user_id))}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{user.auth_provider || "email"}</Badge>
                    <span className="text-xs text-muted-foreground">{getCompanyLabel(user)}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No users found
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
