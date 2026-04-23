import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService, clearSession, getStoredSession, saveSession } from "../services/api";
import type { AuthSession, LoginPayload, RegisterPayload } from "../types/domain";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedSession = getStoredSession();

    if (storedSession?.token) {
      setSession(storedSession);
    }

    setIsBootstrapping(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isBootstrapping,
      async login(payload) {
        const response = await authService.login(payload);
        saveSession(response);
        setSession(response);
      },
      async register(payload) {
        const response = await authService.register(payload);
        saveSession(response);
        setSession(response);
      },
      logout() {
        clearSession();
        setSession(null);
      }
    }),
    [isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
