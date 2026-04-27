import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-5">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-ds-md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
