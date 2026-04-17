import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Cloud, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { getUserFacingError } from "@/lib/errors";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordStrong = Object.values(passwordRules).every(Boolean);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    // Also check hash for type=recovery
    if (window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!passwordStrong) {
      toast.error("Please use a strong password that meets all criteria");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(getUserFacingError(error, "Unable to update password right now."));
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
    setLoading(false);
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
            <h1 className="text-2xl font-bold text-foreground">CustomerPortol</h1>
          </div>
        </div>

        <Card className="border-border shadow-lg">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Use a strong password"
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={10}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1">
                    <p className={passwordRules.minLength ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>At least 10 characters</p>
                    <p className={passwordRules.uppercase ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>One uppercase letter</p>
                    <p className={passwordRules.lowercase ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>One lowercase letter</p>
                    <p className={passwordRules.number ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>One number</p>
                    <p className={passwordRules.special ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>One special character</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      className="pl-9 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={10}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !passwordStrong}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
