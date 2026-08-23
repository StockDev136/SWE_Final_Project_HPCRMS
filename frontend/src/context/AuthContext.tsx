import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AuthResponse } from "../types";
import { STORAGE_KEY } from "../api/client";

interface AuthUser { email: string; role: string; token: string; }
interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);
  function login(data: AuthResponse) {
    const authUser = { email: data.email, role: data.role, token: data.token };
    // Write synchronously here, not just via the effect below — the effect
    // runs after this function returns, which is too late for code that
    // calls login() and immediately makes an authenticated API request in
    // the same tick (e.g. auto-completing a pending reservation right after
    // login). Without this, that follow-up request goes out with no token.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }
  function logout() { setUser(null); }
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
