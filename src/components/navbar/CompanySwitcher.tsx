import { Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Membership } from "./types";

type CompanySwitcherProps = {
  memberships: Membership[];
  activeCompanyName?: string | null;
  isPending: boolean;
  onSwitch: (companyId: string) => void;
};

export default function CompanySwitcher({ memberships, activeCompanyName, isPending, onSwitch }: CompanySwitcherProps) {
  if (memberships.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:inline-flex h-9 rounded-lg gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          <span className="max-w-[130px] truncate">{activeCompanyName || "Company"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-ds-md">
        <div className="px-3 py-2 text-xs text-muted-foreground">Switch Active Company</div>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.company_id}
            className="h-10 cursor-pointer"
            disabled={m.is_primary || isPending}
            onClick={() => onSwitch(m.company_id)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{m.companies?.name || m.company_id}</span>
            {m.is_primary && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
