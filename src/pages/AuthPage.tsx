import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Cloud, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserFacingError } from "@/lib/errors";

type AuthRateLimitKind = "signin" | "signup" | "reset";

type AuthRateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
};

type AuthRateLimitState = {
  attempts: number[];
  blockedUntil?: number;
};

const AUTH_RATE_LIMIT_CONFIG: Record<AuthRateLimitKind, AuthRateLimitConfig> = {
  signin: { maxAttempts: 5, windowMs: 60_000, lockMs: 5 * 60_000 },
  signup: { maxAttempts: 4, windowMs: 5 * 60_000, lockMs: 10 * 60_000 },
  reset: { maxAttempts: 3, windowMs: 5 * 60_000, lockMs: 10 * 60_000 },
};

const AUTH_RATE_LIMIT_STORAGE_KEY = "auth-rate-limit-v1";

function readAuthRateLimits(): Record<AuthRateLimitKind, AuthRateLimitState> {
  if (typeof window === "undefined") {
    return { signin: { attempts: [] }, signup: { attempts: [] }, reset: { attempts: [] } };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return { signin: { attempts: [] }, signup: { attempts: [] }, reset: { attempts: [] } };
    }
    const parsed = JSON.parse(raw) as Partial<Record<AuthRateLimitKind, AuthRateLimitState>>;
    return {
      signin: { attempts: parsed.signin?.attempts ?? [], blockedUntil: parsed.signin?.blockedUntil },
      signup: { attempts: parsed.signup?.attempts ?? [], blockedUntil: parsed.signup?.blockedUntil },
      reset: { attempts: parsed.reset?.attempts ?? [], blockedUntil: parsed.reset?.blockedUntil },
    };
  } catch {
    return { signin: { attempts: [] }, signup: { attempts: [] }, reset: { attempts: [] } };
  }
}

function writeAuthRateLimits(next: Record<AuthRateLimitKind, AuthRateLimitState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_RATE_LIMIT_STORAGE_KEY, JSON.stringify(next));
}

function getRateLimitStatus(kind: AuthRateLimitKind): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const all = readAuthRateLimits();
  const config = AUTH_RATE_LIMIT_CONFIG[kind];
  const current = all[kind] ?? { attempts: [] };
  const attempts = (current.attempts ?? []).filter((ts) => now - ts <= config.windowMs);

  all[kind] = {
    attempts,
    blockedUntil: current.blockedUntil,
  };
  writeAuthRateLimits(all);

  if ((current.blockedUntil ?? 0) > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(((current.blockedUntil ?? 0) - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function recordAuthFailure(kind: AuthRateLimitKind): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const all = readAuthRateLimits();
  const config = AUTH_RATE_LIMIT_CONFIG[kind];
  const current = all[kind] ?? { attempts: [] };
  const attempts = (current.attempts ?? []).filter((ts) => now - ts <= config.windowMs);
  attempts.push(now);

  let blockedUntil = current.blockedUntil;
  if (attempts.length >= config.maxAttempts) {
    blockedUntil = now + config.lockMs;
  }

  all[kind] = { attempts, blockedUntil };
  writeAuthRateLimits(all);

  if ((blockedUntil ?? 0) > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(((blockedUntil ?? 0) - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function clearAuthRateLimit(kind: AuthRateLimitKind) {
  const all = readAuthRateLimits();
  all[kind] = { attempts: [], blockedUntil: undefined };
  writeAuthRateLimits(all);
}

function isStrongPassword(password: string) {
  return {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function formatRetryTime(totalSeconds: number) {
  if (totalSeconds <= 60) return `${totalSeconds}s`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes}m`;
}

/*
 * HCI Principles Applied:
 *
 * FITTS'S LAW: Primary CTA buttons are full-width (large target area),
 *   tall (h-12/h-13), reducing movement time. Most important actions placed
 *   closest to form inputs (minimal cursor travel).
 *
 * HICK'S LAW: Reduced initial choices — default view shows Sign In only.
 *   OAuth grouped visually separate from email. Progressive disclosure for
 *   Sign Up (shown on toggle, not competing tab). Forgot password is inline.
 *
 * KLM (Keystroke-Level Model): Auto-focus on first input reduces pointing time.
 *   Tab order flows naturally (email → password → submit). Enter submits forms.
 *   Minimal clicks to complete any flow.
 *
 * CHUNKING (Miller's Law): Content grouped into 3 visual chunks:
 *   1. Brand header  2. OAuth quick-access  3. Email form
 *   Sign Up groups fields into "Identity" and "Credentials" sections.
 *
 * GESTALT - Proximity: Related fields grouped tightly with consistent spacing.
 * GESTALT - Similarity: All inputs share identical styling/height.
 * GESTALT - Common Region: Card boundary creates clear form region.
 * GESTALT - Figure/Ground: Subtle background vs. elevated white card.
 *
 * PROGRESSIVE DISCLOSURE: Sign Up fields hidden until needed.
 *   Forgot password shown inline to avoid page navigation (reduces cognitive load).
 *
 * FEEDBACK: Loading states on all buttons, success animations,
 *   toast notifications for errors/success, visual state transitions.
 */

// ─── OAuth Quick Access (Chunked as "fastest path") ───────────────────────────

function OAuthButtons() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(getUserFacingError(error, "Unable to sign in with Google right now."));
  };

  return (
    <div className="space-y-2.5">
      {/* Fitts's Law: Large touch targets (h-12), full width */}
      <Button
        variant="outline"
        className="w-full justify-center gap-3 h-12 text-sm font-medium rounded-xl border-border hover:bg-muted/50 transition-all duration-200"
        onClick={handleGoogleSignIn}
      >
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>
    </div>
  );
}

// ─── Divider (Gestalt: clear visual separation between chunks) ────────────────

function Divider({ text }: { text: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wider">
        <span className="bg-card px-3 text-muted-foreground font-medium">{text}</span>
      </div>
    </div>
  );
}

// ─── Forgot Password (Progressive Disclosure — inline, no page change) ────────

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // KLM: Auto-focus reduces pointing time
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
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

    setLoading(true);
    const { error } = await supabase.functions.invoke("auth-guard", {
      body: {
        action: "reset",
        email,
        redirectTo: `${window.location.origin}/reset-password`,
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
      toast.success("Password reset link sent!");
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
          {/* Chunking: Clear context header */}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Reset your password</h3>
            <p className="text-sm text-muted-foreground">Enter your email and we'll send a reset link</p>
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
                  className="pl-10 h-12 rounded-xl text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Fitts's Law: Large primary button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-semibold shadow-[var(--shadow-primary)]"
              disabled={loading || resetRetrySeconds > 0}
            >
              {loading ? "Sending…" : resetRetrySeconds > 0 ? `Try again in ${formatRetryTime(resetRetrySeconds)}` : "Send Reset Link"}
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

// ─── Sign In Form (Primary path — minimal fields, KLM-optimized) ─────────────

function SignInForm({ email, setEmail, password, setPassword, loading, onSubmit, onForgot }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean; onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  // KLM: Auto-focus first field
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Chunk 1: Credentials — tightly grouped (Gestalt: Proximity) */}
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
              className="pl-10 h-12 rounded-xl text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
            {/* Fitts's Law: Forgot link near password — short cursor distance */}
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
              placeholder="••••••••"
              className="pl-10 pr-11 h-12 rounded-xl text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

      {/* Chunk 2: Action — Fitts's Law: tallest button, full width, high contrast */}
      <Button
        type="submit"
        className="w-full h-13 rounded-xl text-sm font-semibold shadow-[var(--shadow-primary)] mt-1"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Signing in…
          </span>
        ) : "Sign In"}
      </Button>
    </motion.form>
  );
}

// ─── Sign Up Form (Progressive disclosure, chunked fields) ────────────────────

function SignUpForm({ email, setEmail, password, setPassword, fullName, setFullName, loading, onSubmit }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  fullName: string; setFullName: (v: string) => void;
  loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRules = isStrongPassword(password);
  const passwordStrong = Object.values(passwordRules).every(Boolean);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Chunk 1: Identity (Chunking — group name + company) */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Info</legend>
        <div className="space-y-1.5">
          <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="signup-name"
              placeholder="Jane Smith"
              className="pl-10 h-12 rounded-xl text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Chunk 2: Credentials (Chunking — group email + password) */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Credentials</legend>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="you@company.com"
              className="pl-10 h-12 rounded-xl text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Use a strong password"
              className="pl-10 pr-11 h-12 rounded-xl text-sm"
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
      </fieldset>

      {/* Chunk 3: CTA with value proposition (Fitts's Law + incentive) */}
      <Button
        type="submit"
        className="w-full h-13 rounded-xl text-sm font-semibold shadow-[var(--shadow-primary)]"
        disabled={loading || !passwordStrong}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Creating account…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create Account — 50 Free Credits
          </span>
        )}
      </Button>
    </motion.form>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────

type AuthView = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signinBlockedUntil, setSigninBlockedUntil] = useState(0);
  const [signupBlockedUntil, setSignupBlockedUntil] = useState(0);
  // Hick's Law: One view at a time, no competing tabs
  const [view, setView] = useState<AuthView>("signin");

  useEffect(() => {
    const signinStatus = getRateLimitStatus("signin");
    if (signinStatus.blocked) {
      setSigninBlockedUntil(Date.now() + signinStatus.retryAfterSeconds * 1000);
    }

    const signupStatus = getRateLimitStatus("signup");
    if (signupStatus.blocked) {
      setSignupBlockedUntil(Date.now() + signupStatus.retryAfterSeconds * 1000);
    }
  }, []);

  const getPostLoginPath = async (userId: string): Promise<string> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const role = data?.role as string | undefined;

    if (role === "admin") return "/admin";
    if (role === "agent") {
      const { data: agentProfile } = await supabase
        .from("agents")
        .select("id, is_active")
        .eq("user_id", userId)
        .maybeSingle();

      if (agentProfile?.is_active) return "/agent/dashboard";
    }
    return "/dashboard";
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const limitStatus = getRateLimitStatus("signin");
    if (limitStatus.blocked) {
      toast.error(`Too many sign in attempts. Try again in ${formatRetryTime(limitStatus.retryAfterSeconds)}.`);
      setSigninBlockedUntil(Date.now() + limitStatus.retryAfterSeconds * 1000);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("auth-guard", {
      body: {
        action: "signin",
        email,
        password,
      },
    });

    if (error) {
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordRules = isStrongPassword(password);
    const passwordStrong = Object.values(passwordRules).every(Boolean);
    if (!passwordStrong) {
      toast.error("Please use a stronger password that meets all criteria.");
      return;
    }

    const limitStatus = getRateLimitStatus("signup");
    if (limitStatus.blocked) {
      toast.error(`Too many sign up attempts. Try again in ${formatRetryTime(limitStatus.retryAfterSeconds)}.`);
      setSignupBlockedUntil(Date.now() + limitStatus.retryAfterSeconds * 1000);
      return;
    }

    setLoading(true);
    const { error } = await supabase.functions.invoke("auth-guard", {
      body: {
        action: "signup",
        email,
        password,
        fullName,
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      const limiter = recordAuthFailure("signup");
      if (limiter.blocked) {
        setSignupBlockedUntil(Date.now() + limiter.retryAfterSeconds * 1000);
      }
      toast.error(getUserFacingError(error, "Sign up failed. Please try again."));
    } else {
      clearAuthRateLimit("signup");
      toast.success("Check your email to confirm your account. You start with 50 free credits!");
    }
    setLoading(false);
  };

  const signinRetrySeconds = signinBlockedUntil > Date.now() ? Math.ceil((signinBlockedUntil - Date.now()) / 1000) : 0;
  const signupRetrySeconds = signupBlockedUntil > Date.now() ? Math.ceil((signupBlockedUntil - Date.now()) / 1000) : 0;

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Figure/Ground: Subtle ambient shapes create depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Chunk 1: Brand Identity — clear, scannable */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2.5 mb-3"
          >
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[var(--shadow-primary)]">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">CustomerPortol</h1>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Ticket-based delivery with pay-as-you-go credits
          </p>
        </div>

        {/* Chunk 2: Auth Card — Gestalt Common Region */}
        <Card className="border-border shadow-[var(--shadow-xl)] rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* Chunk 2a: OAuth — fastest path, always visible */}
            {view !== "forgot" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <OAuthButtons />
                <Divider text="or continue with email" />
              </motion.div>
            )}

            {/* Chunk 2b: Dynamic form area — one view at a time (Hick's Law) */}
            <AnimatePresence mode="wait">
              {view === "signin" && (
                <div key="signin" className="space-y-2">
                  <SignInForm
                    email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    loading={loading || signinRetrySeconds > 0}
                    onSubmit={handleEmailSignIn}
                    onForgot={() => setView("forgot")}
                  />
                  {signinRetrySeconds > 0 && (
                    <p className="text-xs text-destructive">Sign in temporarily locked. Try again in {formatRetryTime(signinRetrySeconds)}.</p>
                  )}
                </div>
              )}
              {view === "signup" && (
                <div key="signup" className="space-y-2">
                  <SignUpForm
                    email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    fullName={fullName} setFullName={setFullName}
                    loading={loading || signupRetrySeconds > 0}
                    onSubmit={handleEmailSignUp}
                  />
                  {signupRetrySeconds > 0 && (
                    <p className="text-xs text-destructive">Sign up temporarily locked. Try again in {formatRetryTime(signupRetrySeconds)}.</p>
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

            {/* Chunk 2c: View switcher — secondary action, lower visual weight */}
            {view !== "forgot" && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {view === "signin" ? "Don't have an account?" : "Already have an account?"}
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    onClick={() => setView(view === "signin" ? "signup" : "signin")}
                  >
                    {view === "signin" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>
            )}

            {/* Chunk 3: Guest — lowest priority, dashed border signals optionality */}
            <Divider text="or" />
            <Button
              variant="outline"
              className="w-full h-11 gap-2 rounded-xl border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              onClick={handleGuestLogin}
            >
              <Eye className="h-4 w-4" />
              Continue as Guest
              <span className="text-xs opacity-70">(Read-only)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Trust signal — reduces cognitive friction */}
        <p className="text-center text-xs text-muted-foreground mt-5 opacity-70">
          Your data is encrypted and secure
        </p>
      </motion.div>
    </div>
  );
}
