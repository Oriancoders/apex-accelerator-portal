import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        window.setTimeout(() => {
          window.history.replaceState(null, document.title, "/reset-password");
        }, 0);
      }
    });
    if (window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
      window.setTimeout(() => {
        window.history.replaceState(null, document.title, "/reset-password");
      }, 0);
    }
    return () => subscription.unsubscribe();
  }, []);

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
            {!isRecovery ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This page is only accessible from a password reset email link.
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")}>
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
