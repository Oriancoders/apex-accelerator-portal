import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRight } from "lucide-react";

export default function TicketSubmissionWidget() {
  const navigate = useNavigate();
  const { profile, isGuest } = useAuth();
  const { activeCompany } = useAgentTenant();
  const { role } = useUserRole();

  const newTicketPath =
    (role === "company_admin" || role === "member") && activeCompany?.slug
      ? `/${activeCompany.slug}/tickets/new`
      : "/tickets/new";

  return (
    <div className="widget-card border-2 border-primary/20 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative p-5 sm:p-6 text-center space-y-4 flex flex-col items-center justify-center h-full">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-ds-lg bg-primary/10">
          <PlusCircle className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">Submit a Service Request</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Need maintenance, a new feature, integration, or customization? Our experts will review it.
          </p>
        </div>
        {isGuest ? (
          <>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="gap-2 h-12 rounded-ds-md w-full sm:w-auto"
            >
              Sign In to Create Tickets
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-warning">
              Guest users cannot create tickets.
            </p>
          </>
        ) : (
          <>
            {/* Fitts's Law: Large primary CTA */}
            <Button
              size="lg"
              onClick={() => navigate(newTicketPath)}
              className="gap-2 h-12 rounded-ds-md w-full sm:w-auto shadow-glow font-semibold"
            >
              Create Ticket
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              You have <span className="font-bold text-accent">{profile?.credits ?? 0} credits</span> available
            </p>
          </>
        )}
      </div>
    </div>
  );
}
