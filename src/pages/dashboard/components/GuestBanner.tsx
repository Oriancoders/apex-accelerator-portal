import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stagger } from "../constants";

export function GuestBanner() {
  const navigate = useNavigate();
  return (
    <motion.div
      {...stagger.item}
      className="relative overflow-hidden rounded-ds-xl border border-border-subtle bg-gradient-to-r from-primary/10 via-card to-accent/10 p-5 sm:p-8 shadow-soft"
    >
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Get Full Access</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Sign up to submit tasks, track ticket progress, chat with experts, and start with 50 free credits.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto gap-2 h-12 rounded-ds-md font-semibold shadow-glow flex-shrink-0"
          onClick={() => navigate("/auth")}
        >
          Sign Up Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
