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
  onConfirm: () => void;
}

export function RemoveConfirmDialog({ memberToDelete, onOpenChange, onConfirm }: RemoveConfirmDialogProps) {
  return (
    <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Company Member?</AlertDialogTitle>
          <AlertDialogDescription>
            This user will lose access to your active company workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Remove Member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
