import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiClient } from "./api-client";
import * as demoAuth from "./demo/demo-auth";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export type Role = "buyer" | "agent" | "admin" | "developer" | "property_manager";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  company?: string;
  license?: string;
  licenseState?: string;
  bio?: string;
  serviceAreas?: string[];
  verified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  agent?: { id: string };
  notifications?: {
    emailInquiries: boolean;
    emailViewings: boolean;
    emailMessages: boolean;
    emailListingApproved: boolean;
    emailDigest: boolean;
    pushInquiries: boolean;
    pushMessages: boolean;
    pushViewings: boolean;
  };
  privacy?: {
    showProfile: boolean;
    showPhone: boolean;
    allowWhatsapp: boolean;
    promoEmails: boolean;
  };
}

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  company?: string;
  license?: string;
  licenseState?: string;
};

type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: string }
  | { ok: "requires2FA"; userId: string };

type AuthContextValue = {
  user: User | undefined;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn: (email: string, password: string) => Promise<LoginResult>;
  verify2FALogin: (userId: string, code: string) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  refresh: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function RealAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The access token lives in an httpOnly cookie, invisible to JS, so the
    // only way to know if a session already exists is to ask the backend.
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const result = await apiClient.getMe();
      setUser(result.user as User);
    } catch {
      // No valid session cookie — user is logged out.
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    if (user) {
      setUser({ ...user });
    }
  }

  async function signUp(input: SignUpInput) {
    try {
      const result = await apiClient.register({
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone,
        role: input.role,
        company: input.company,
        license: input.license,
        licenseState: input.licenseState,
      });
      setUser(result.user as User);
      return { ok: true as const, user: result.user as User };
    } catch (error: any) {
      return { ok: false as const, error: error.message || "Sign up failed" };
    }
  }

  async function logIn(email: string, password: string): Promise<LoginResult> {
    try {
      const result = await apiClient.login(email, password);
      if ("requires2FA" in result) {
        return { ok: "requires2FA" as const, userId: result.userId };
      }
      setUser(result.user as User);
      return { ok: true as const, user: result.user as User };
    } catch (error: any) {
      return { ok: false as const, error: error.message || "Login failed" };
    }
  }

  async function verify2FALogin(userId: string, code: string) {
    try {
      const result = await apiClient.verifyLogin2FA(userId, code);
      setUser(result.user as User);
      return { ok: true as const, user: result.user as User };
    } catch (error: any) {
      return { ok: false as const, error: error.message || "Invalid code" };
    }
  }

  async function logOut() {
    try {
      await apiClient.logout();
    } catch {
      // Server-side logout can fail (e.g. already-expired token); local state
      // is cleared regardless, so there's nothing more for callers to do.
    } finally {
      setUser(undefined);
    }
  }

  function updateUser(patch: Partial<User>) {
    if (user) {
      setUser({ ...user, ...patch });
    }
  }

  const value: AuthContextValue = {
    user,
    loading,
    signUp,
    logIn,
    verify2FALogin,
    logOut,
    refresh,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useRealAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function dashboardPathForRole(role: Role) {
  if (role === "agent") return "/dashboard/agent";
  if (role === "admin") return "/admin/dashboard";
  if (role === "property_manager") return "/dashboard/property-manager";
  // developer role deferred to v2 — fall back to buyer dashboard
  return "/dashboard/buyer";
}

function RealProtectedRoute({ allow, children }: { allow?: Role[]; children: ReactNode }) {
  const { user, loading } = useRealAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

// In demo mode (VITE_DEMO_MODE=true) there is no backend/session cookie to
// talk to — demoAuth (src/lib/demo/demo-auth.tsx) is a localStorage-backed
// replacement implementing this same AuthProvider/useAuth/ProtectedRoute
// shape, used for the static Vercel demo build.
export const AuthProvider: typeof RealAuthProvider = DEMO_MODE ? (demoAuth.AuthProvider as any) : RealAuthProvider;
export const useAuth: typeof useRealAuth = DEMO_MODE ? (demoAuth.useAuth as any) : useRealAuth;
export const ProtectedRoute: typeof RealProtectedRoute = DEMO_MODE ? (demoAuth.ProtectedRoute as any) : RealProtectedRoute;
