import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Building2 } from "lucide-react";
import { ROLE_CARDS } from "../constants";

const ICON_MAP = {
  Users: Users,
  ShieldCheck: ShieldCheck,
  Building2: Building2,
};

export function RoleCardsSection() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {ROLE_CARDS.map((role) => {
        const Icon = ICON_MAP[role.icon as keyof typeof ICON_MAP];
        return (
          <Card key={role.title}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-primary" />
                {role.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{role.description}</CardContent>
          </Card>
        );
      })}
    </section>
  );
}
