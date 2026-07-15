import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiClient } from "./api-client";

export type Role = "buyer" | "agent" | "admin";

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
  createdAt?: string;
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

type AuthContextValue = {
  user: User | undefined;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn: (email: string, password: string) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  refresh: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  async function logIn(email: string, password: string) {
    try {
      const result = await apiClient.login(email, password);
      setUser(result.user as User);
      return { ok: true as const, user: result.user as User };
    } catch (error: any) {
      return { ok: false as const, error: error.message || "Login failed" };
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
    logOut,
    refresh,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function dashboardPathForRole(role: Role) {
  if (role === "agent") return "/dashboard/agent";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard/buyer";
}

export function ProtectedRoute({ allow, children }: { allow?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
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
