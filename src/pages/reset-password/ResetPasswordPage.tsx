import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { motion } from "framer-motion";
import { RECOVERY_INTENT_KEY, getRecoveryUrlDebugInfo, supabase } from "@/integrations/supabase/client";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

type RecoveryStatus = "checking" | "ready" | "invalid";

function getRecoveryParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return {
    type: searchParams.get("type") || hashParams.get("type"),
    code: searchParams.get("code") || hashParams.get("code"),
    tokenHash: searchParams.get("token_hash") || hashParams.get("token_hash"),
    accessToken: searchParams.get("access_token") || hashParams.get("access_token"),
    refreshToken: searchParams.get("refresh_token") || hashParams.get("refresh_token"),
    hasRecoveryParams:
      searchParams.get("type") === "recovery" ||
      hashParams.get("type") === "recovery" ||
      searchParams.has("code") ||
      searchParams.has("token_hash") ||
      hashParams.has("access_token"),
  };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("checking");

  useEffect(() => {
    const rememberRecovery = () => {
      setRecoveryStatus("ready");
      try {
        sessionStorage.setItem(RECOVERY_INTENT_KEY, "true");
      } catch {
        // Session storage can be unavailable in strict browser privacy modes.
      }
      window.setTimeout(() => {
        window.history.replaceState(null, document.title, "/reset-password");
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        rememberRecovery();
      }
    });

    async function bootstrapRecovery() {
      const recoveryParams = getRecoveryParams();
      console.info("[password-reset-debug]", {
        stage: "reset-page-bootstrap",
        ...getRecoveryUrlDebugInfo(window.location.href),
      });

      try {
        if (recoveryParams.accessToken && recoveryParams.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: recoveryParams.accessToken,
            refresh_token: recoveryParams.refreshToken,
          });
          if (error) throw error;
          rememberRecovery();
          return;
        }

        if (recoveryParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(recoveryParams.code);
          if (error) throw error;
          rememberRecovery();
          return;
        }

        if (recoveryParams.tokenHash && recoveryParams.type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: recoveryParams.tokenHash,
            type: "recovery",
          });
          if (error) throw error;
          rememberRecovery();
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        let rememberedRecovery = false;
        try {
          rememberedRecovery = sessionStorage.getItem(RECOVERY_INTENT_KEY) === "true";
        } catch {
          rememberedRecovery = false;
        }

        if (session?.user && rememberedRecovery) {
          setRecoveryStatus("ready");
          return;
        }

        if (recoveryParams.hasRecoveryParams) {
          setRecoveryStatus("ready");
          return;
        }

        setRecoveryStatus("invalid");
      } catch (error) {
        console.error("Password recovery bootstrap failed:", error);
        setRecoveryStatus("invalid");
      }
    }

    void bootstrapRecovery();

    return () => subscription.unsubscribe();
  }, []);

  const goToSignIn = () => {
    try {
      sessionStorage.removeItem(RECOVERY_INTENT_KEY);
    } catch {
      // Session storage can be unavailable in strict browser privacy modes.
    }
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Cloud className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Customer Connect</h1>
          </div>
        </div>

        <Card className="border-border-subtle shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            {recoveryStatus === "checking" ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Preparing your password reset...</p>
              </div>
            ) : recoveryStatus === "invalid" ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid, expired, or already used. Please request a new password reset email.
                </p>
                <Button variant="outline" onClick={goToSignIn}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <ResetPasswordForm onSuccess={() => navigate("/dashboard")} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
