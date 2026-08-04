import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/endpoints";
import { TOKEN_KEY } from "../api/client";
import type { AuthSession, User } from "../types/api";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) { setUser(null); return; }
    const profile = await api.me();
    setUser(profile);
  }, []);
  useEffect(() => {
    refreshUser().catch(logout).finally(() => setLoading(false));
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [logout, refreshUser]);
  const login = useCallback((session: AuthSession) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setUser(session.user);
  }, []);
  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [user, loading, login, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
