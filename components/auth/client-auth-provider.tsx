"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export type ClientAuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<User | null>;
};

export const ClientAuthContext =
  createContext<ClientAuthContextValue | null>(null);

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let supabase: SupabaseClient;

    try {
      supabase = createClient();
      supabaseRef.current = supabase;
    } catch (configurationError) {
      const message =
        configurationError instanceof Error
          ? configurationError.message
          : "Authentication is not configured.";
      queueMicrotask(() => {
        if (isActive) {
          setError(message);
          setIsLoading(false);
        }
      });
      return () => {
        isActive = false;
      };
    }

    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!isActive) {
        return;
      }

      setUser(data.user);
      setError(authError?.message ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      setUser(session?.user ?? null);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
      if (supabaseRef.current === supabase) {
        supabaseRef.current = null;
      }
    };
  }, []);

  const refreshSession = useCallback(async () => {
    setError(null);
    const supabase = supabaseRef.current;
    if (!supabase) {
      setError("Authentication is not configured.");
      return null;
    }

    const { data, error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      setError(refreshError.message);
      setUser(null);
      return null;
    }

    const refreshedUser = data.user ?? null;
    setUser(refreshedUser);
    return refreshedUser;
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error, refreshSession }),
    [error, isLoading, refreshSession, user],
  );

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}
