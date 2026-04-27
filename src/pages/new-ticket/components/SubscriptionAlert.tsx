import { Badge } from "@/components/ui/badge";

export function SubscriptionAlert() {
  return (
    <div className="rounded-ds-md border border-green-500/20 bg-green-500/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Subscription Active</Badge>
        <p className="text-xs text-muted-foreground">
          This ticket will skip credit approval and go directly to admin assignment.
        </p>
      </div>
    </div>
  );
}
