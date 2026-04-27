import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { getUserFacingError } from "@/lib/errors";
import { getRateLimitStatus, recordAuthFailure, clearAuthRateLimit, formatRetryTime } from "./rateLimiter";
import { emailSchema } from "@/lib/validation";
import { Turnstile } from "@/components/security/Turnstile";

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const status = getRateLimitStatus("reset");
    if (status.blocked) {
      setBlockedUntil(Date.now() + status.retryAfterSeconds * 1000);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const status = getRateLimitStatus("reset");
    if (status.blocked) {
      toast.error(`Too many reset attempts. Try again in ${formatRetryTime(status.retryAfterSeconds)}.`);
      setBlockedUntil(Date.now() + status.retryAfterSeconds * 1000);
      return;
    }

    if (captchaRequired && !captchaToken) {
      toast.error("Please complete the CAPTCHA before requesting a reset link.");
      return;
    }

    const normalizedEmail = emailSchema.safeParse(email);
    if (!normalizedEmail.success) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.functions.invoke("auth-guard", {
      body: {
        action: "reset",
        email: normalizedEmail.data,
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      },
    });

    if (error) {
      const limiter = recordAuthFailure("reset");
      if (limiter.blocked) {
        setBlockedUntil(Date.now() + limiter.retryAfterSeconds * 1000);
      }
      toast.error(getUserFacingError(error, "Unable to send reset link right now."));
    } else {
      clearAuthRateLimit("reset");
      setSent(true);
      toast.success("Password reset link sent.");
    }
    setLoading(false);
  };

  const resetRetrySeconds = blockedUntil > Date.now() ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {sent ? (
        <div className="text-center py-6 space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))] mx-auto" />
          </motion.div>
          <p className="text-base font-semibold text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
            We sent a reset link to <span className="font-medium text-foreground">{email}</span>
          </p>
          <Button variant="ghost" className="mt-2 gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Reset your password</h3>
            <p className="text-sm text-muted-foreground">Enter your email and we will send a reset link.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  id="reset-email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10 h-12 rounded-ds-md text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <Turnstile onToken={setCaptchaToken} />
            <Button
              type="submit"
              className="w-full h-12 rounded-ds-md text-sm font-semibold shadow-glow"
              disabled={loading || resetRetrySeconds > 0 || (captchaRequired && !captchaToken)}
            >
              {loading
                ? "Sending..."
                : resetRetrySeconds > 0
                  ? `Try again in ${formatRetryTime(resetRetrySeconds)}`
                  : captchaRequired && !captchaToken
                    ? "Complete CAPTCHA"
                    : "Send Reset Link"}
            </Button>
            {resetRetrySeconds > 0 && (
              <p className="text-xs text-destructive">Too many reset requests. Please wait before trying again.</p>
            )}
          </form>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            onClick={onBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </button>
        </div>
      )}
    </motion.div>
  );
}
