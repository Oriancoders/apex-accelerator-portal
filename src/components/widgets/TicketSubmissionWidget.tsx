import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function TicketSubmissionWidget() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="widget-card border-2 border-primary/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
          <PlusCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Submit a Service Request</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Need Salesforce maintenance, a new feature, integration, or customization? Submit a ticket and our experts will review it.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate("/tickets/new")}
          className="gap-2 shadow-primary"
        >
          Create Ticket
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          You have <span className="font-semibold text-accent">{profile?.credits ?? 0} credits</span> available
        </p>
      </div>
    </motion.div>
  );
}
