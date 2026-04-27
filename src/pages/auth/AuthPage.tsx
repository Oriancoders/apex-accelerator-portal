import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Cloud } from "lucide-react";
import { getUserFacingError } from "@/lib/errors";
import { getRateLimitStatus, recordAuthFailure, clearAuthRateLimit, formatRetryTime } from "./rateLimiter";
import { SignInForm } from "./SignInForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { AuthFlowBackdrop } from "./AuthFlowBackdrop";
import { getPostLoginPath } from "./utils";
import type { AuthView } from "./types";
import { emailSchema } from "@/lib/validation";

export default function AuthPage() {
  const navigate = useNavigate();
  const captchaRequired = Boolean((import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim());
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [signinBlockedUntil, setSigninBlockedUntil] = useState(0);
  const [view, setView] = useState<AuthView>("signin");

  const updateEmail = (value: string) => {
    setEmail(value);
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  };

  useEffect(() => {
    const signinStatus = getRateLimitStatus("signin");
    if (signinStatus.blocked) {
      setSigninBlockedUntil(Date.now() + signinStatus.retryAfterSeconds * 1000);
    }
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const limitStatus = getRateLimitStatus("signin");
    if (limitStatus.blocked) {
      toast.error(`Too many sign in attempts. Try again in ${formatRetryTime(limitStatus.retryAfterSeconds)}.`);
      setSigninBlockedUntil(Date.now() + limitStatus.retryAfterSeconds * 1000);
      return;
    }

    if (captchaRequired && !captchaToken) {
      toast.error("Please complete the CAPTCHA before signing in.");
      return;
    }

    const normalizedEmail = emailSchema.safeParse(email);
    if (!normalizedEmail.success || password.length < 1 || password.length > 1024) {
      toast.error("Enter a valid email and password.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("auth-guard", {
      body: {
        action: "signin",
        email: normalizedEmail.data,
        password,
        captchaToken,
      },
    });

    if (error) {
      setCaptchaToken("");
      setCaptchaResetKey((key) => key + 1);
      const limiter = recordAuthFailure("signin");
      if (limiter.blocked) {
        setSigninBlockedUntil(Date.now() + limiter.retryAfterSeconds * 1000);
      }
      toast.error(getUserFacingError(error, "Sign in failed. Please try again."));
    } else {
      const accessToken = (data as any)?.session?.access_token as string | undefined;
      const refreshToken = (data as any)?.session?.refresh_token as string | undefined;

      if (!accessToken || !refreshToken) {
        toast.error("Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        toast.error("Unable to complete sign in right now.");
        setLoading(false);
        return;
      }

      clearAuthRateLimit("signin");
      const userId = (data as any)?.user?.id as string | undefined;
      const postLoginPath = userId ? await getPostLoginPath(userId) : "/dashboard";
      navigate(postLoginPath);
    }
    setLoading(false);
  };

  const signinRetrySeconds = signinBlockedUntil > Date.now() ? Math.ceil((signinBlockedUntil - Date.now()) / 1000) : 0;

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] p-4 text-white sm:p-6 lg:p-8">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.14),transparent_34%),linear-gradient(135deg,rgba(7,17,31,1),rgba(12,24,42,1)_52%,rgba(5,19,30,1))]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-6xl items-center gap-8 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.1fr_440px]">
        <AuthFlowBackdrop />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[440px]"
        >
          <div className="mb-7 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-3 inline-flex items-center gap-2.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 shadow-[0_18px_50px_rgba(16,185,129,0.35)]">
                <Cloud className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Customer Connect</h1>
            </motion.div>
            <p className="text-sm text-slate-300">
              Sign in with the account created by your admin or partner.
            </p>
          </div>

          <Card className="overflow-hidden rounded-[24px] border-white/10 bg-white/[0.08] shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {view === "signin" && (
                  <div key="signin" className="space-y-2">
                    <SignInForm
                      email={email}
                      setEmail={updateEmail}
                      password={password}
                      setPassword={updatePassword}
                      loading={loading || signinRetrySeconds > 0}
                      captchaRequired={captchaRequired}
                      captchaVerified={Boolean(captchaToken)}
                      onSubmit={handleEmailSignIn}
                      onForgot={() => setView("forgot")}
                      onCaptchaToken={setCaptchaToken}
                      captchaResetKey={captchaResetKey}
                    />
                    {signinRetrySeconds > 0 && (
                      <p className="text-xs text-destructive">Sign in temporarily locked. Try again in {formatRetryTime(signinRetrySeconds)}.</p>
                    )}
                  </div>
                )}
                {view === "forgot" && (
                  <ForgotPasswordForm
                    key="forgot"
                    onBack={() => setView("signin")}
                  />
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-5 opacity-70">
            New users are onboarded by an admin or partner.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
