import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Turnstile } from "@/components/security/Turnstile";

export function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  captchaRequired,
  captchaVerified,
  onSubmit,
  onForgot,
  onCaptchaToken,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  captchaRequired: boolean;
  captchaVerified: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onCaptchaToken: (token: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="signin-email"
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={onForgot}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10 pr-11 h-12 rounded-ds-md text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={1024}
              autoComplete="current-password"
              required
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
        </div>
      </div>

      <Turnstile onToken={onCaptchaToken} />

      <Button
        type="submit"
        className="w-full h-13 rounded-ds-md text-sm font-semibold shadow-glow mt-1"
        disabled={loading || (captchaRequired && !captchaVerified)}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Signing in...
          </span>
        ) : captchaRequired && !captchaVerified ? "Complete CAPTCHA" : "Sign In"}
      </Button>
    </motion.form>
  );
}
