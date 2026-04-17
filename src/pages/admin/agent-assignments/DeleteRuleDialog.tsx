import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RuleRow } from "@/pages/admin/agent-assignments/types";

type DeleteRuleDialogProps = {
  ruleToDelete: RuleRow | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
};

export default function DeleteRuleDialog({ ruleToDelete, onOpenChange, onDelete }: DeleteRuleDialogProps) {
  return (
    <AlertDialog open={!!ruleToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete commission rule?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Rule
            <span className="font-semibold text-foreground"> {ruleToDelete?.rule_name || "Unnamed"}</span>
            will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (ruleToDelete) {
                onDelete(ruleToDelete.id);
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
