import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import TicketDetailsPanel from "@/pages/admin/tickets/TicketDetailsPanel";
import type { TicketType } from "@/pages/admin/tickets/types";

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Ticket not found");
      return data as TicketType;
    },
  });

  const refreshAndSync = async () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-ticket", id] });
    await refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/admin/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to tickets
          </Button>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="h-7 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-56 bg-muted animate-pulse rounded-xl" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <p className="text-sm text-destructive font-medium">Unable to load ticket details.</p>
            <Button
              variant="outline"
              className="rounded-xl mt-3"
              onClick={async () => {
                const result = await refetch();
                if (result.error) toast.error("Unable to load ticket details.");
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {ticket && <TicketDetailsPanel ticket={ticket} onRefresh={refreshAndSync} onClose={() => navigate("/admin/tickets")} />}
      </div>
    </AdminLayout>
  );
}
