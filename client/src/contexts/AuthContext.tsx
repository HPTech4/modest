import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  verificationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function verifyAdministrator(userId: string): Promise<{ allowed: boolean; error?: string }> {
  if (!supabase) return { allowed: false, error: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { allowed: false, error: "We could not verify administrator access. Check the Supabase setup and try again." };
  return { allowed: Boolean(data) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const applySession = useCallback(async (session: Session | null) => {
    setUser(session?.user ?? null);
    setIsAdmin(false);
    setVerificationError(null);
    if (!session?.user || !supabase) return;
    const verification = await verifyAdministrator(session.user.id);
    setIsAdmin(verification.allowed);
    setVerificationError(verification.error ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) setVerificationError("Your session could not be restored. Please sign in again.");
      await applySession(data.session);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setLoading(true);
      void applySession(session).finally(() => { if (active) setLoading(false); });
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured. Follow the setup guide first.");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign-in did not return a user.");
    const verification = await verifyAdministrator(data.user.id);
    if (!verification.allowed) {
      await supabase.auth.signOut();
      throw new Error(verification.error ?? "This account is not configured as the store administrator.");
    }
    setUser(data.user);
    setIsAdmin(true);
    setVerificationError(null);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, isAdmin, verificationError, signIn, signOut }), [user, loading, isAdmin, verificationError, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
