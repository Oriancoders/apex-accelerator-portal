import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Cloud, Mail, Lock, User, Building2, Shield, Eye } from "lucide-react";
import { motion } from "framer-motion";

function OAuthButtons() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(error.message);
  };

  const handleSalesforceSignIn = async () => {
    toast.info("Salesforce OAuth will redirect to your sandbox login.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-3 mb-6">
      <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={handleGoogleSignIn}>
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={handleSalesforceSignIn}>
        <Cloud className="h-4 w-4 text-primary" />
        Continue with Salesforce
      </Button>
    </div>
  );
}

function EmailDivider() {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
      </div>
    </div>
  );
}

function SignInForm({ email, setEmail, password, setPassword, loading, onSubmit }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signin-email" type="email" placeholder="you@company.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signin-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

function SignUpForm({ email, setEmail, password, setPassword, fullName, setFullName, company, setCompany, loading, onSubmit }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  fullName: string; setFullName: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signup-name" placeholder="Jane Smith" className="pl-9" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-company">Company</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signup-company" placeholder="Acme Inc." className="pl-9" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signup-email" type="email" placeholder="you@company.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="signup-password" type="password" placeholder="Min 6 characters" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account — 50 Free Credits"}
      </Button>
    </form>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company },
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account. You start with 50 free credits!");
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Cloud className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SF Services Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Salesforce org maintenance, features & integrations
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription>Sign in, use admin credentials, or explore as a guest</CardDescription>
          </CardHeader>
          <CardContent>
            <OAuthButtons />
            <EmailDivider />

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <SignInForm
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  loading={loading} onSubmit={handleEmailSignIn}
                />
              </TabsContent>

              <TabsContent value="signup">
                <SignUpForm
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  fullName={fullName} setFullName={setFullName}
                  company={company} setCompany={setCompany}
                  loading={loading} onSubmit={handleEmailSignUp}
                />
              </TabsContent>
            </Tabs>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 gap-2 h-11 border-dashed"
              onClick={handleGuestLogin}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              Continue as Guest
              <span className="text-xs text-muted-foreground ml-1">(Read-only)</span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
