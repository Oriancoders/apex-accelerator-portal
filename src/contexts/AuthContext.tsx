import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { RECOVERY_INTENT_KEY, supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    // Prevent fetching the same profile twice
    if (currentUserIdRef.current === userId) return;
    currentUserIdRef.current = userId;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) {
      currentUserIdRef.current = null; // Reset to force refresh
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isSubscribed) return;

        if (event === "PASSWORD_RECOVERY") {
          try {
            sessionStorage.setItem(RECOVERY_INTENT_KEY, "true");
          } catch {
            // Session storage can be unavailable in strict browser privacy modes.
          }

          if (window.location.pathname !== "/reset-password") {
            window.location.replace("/reset-password");
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            if (isSubscribed) fetchProfile(session.user.id);
          }, 0);
        } else {
          currentUserIdRef.current = null;
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSubscribed) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isGuest, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
