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
import type { MembershipRow } from "../types";

interface RemoveConfirmDialogProps {
  memberToDelete: MembershipRow | null;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onConfirm: () => void;
}

export function RemoveConfirmDialog({
  memberToDelete,
  onOpenChange,
  companyName,
  onConfirm,
}: RemoveConfirmDialogProps) {
  return (
    <AlertDialog open={!!memberToDelete} onOpenChange={(o) => !o && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member?</AlertDialogTitle>
          <AlertDialogDescription>
            This user will lose access to {companyName}. This action can be undone by re-adding them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
