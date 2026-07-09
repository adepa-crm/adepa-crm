import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Tenant, type User } from "./api";

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  setSession: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("adepa_token"));
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then(({ user, tenant }) => {
        setUser(user);
        setTenant(tenant);
      })
      .catch(() => {
        localStorage.removeItem("adepa_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function setSession(newToken: string, newUser: User, newTenant: Tenant) {
    localStorage.setItem("adepa_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setTenant(newTenant);
  }

  function logout() {
    localStorage.removeItem("adepa_token");
    setToken(null);
    setUser(null);
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, tenant, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
