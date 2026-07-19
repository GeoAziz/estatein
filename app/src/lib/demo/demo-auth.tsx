// Drop-in replacement for ../auth-api, used only when VITE_DEMO_MODE=true.
// Mirrors AuthProvider/useAuth/ProtectedRoute/dashboardPathForRole's exact
// exported shape so no page needs to change — see api-client.ts and
// auth-api.tsx for the demo-mode swap.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DEMO_CREDENTIALS, DEMO_USERS } from "./demo-data";
import { getSession, setSession } from "./demo-db";

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

const DEMO_ACCOUNTS = [
  { ...DEMO_CREDENTIALS.buyer, userId: "demo-user-buyer" },
  { ...DEMO_CREDENTIALS.agent, userId: "demo-user-agent" },
  { ...DEMO_CREDENTIALS.admin, userId: "demo-user-admin" },
];

function findUserById(id: string): User | undefined {
  return DEMO_USERS.find((u) => u.id === id) as User | undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      const found = findUserById(session.userId);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

  function refresh() {
    if (user) setUser({ ...user });
  }

  async function signUp(input: SignUpInput) {
    // Demo mode has fixed accounts only — sign-up "succeeds" but logs the
    // visitor in as the matching demo role so every flow stays explorable.
    const account = DEMO_ACCOUNTS.find((a) => a.email === DEMO_CREDENTIALS.buyer.email) ?? DEMO_ACCOUNTS[0];
    const found = findUserById(account.userId);
    if (!found) return { ok: false as const, error: "Demo account unavailable" };
    const demoUser: User = { ...found, name: input.name || found.name, role: input.role };
    setSession(found.id);
    setUser(demoUser);
    return { ok: true as const, user: demoUser };
  }

  async function logIn(email: string, password: string): Promise<LoginResult> {
    const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.password !== password) {
      return { ok: false as const, error: "Invalid demo credentials — use one of the accounts shown in the banner above." };
    }
    const found = findUserById(account.userId);
    if (!found) return { ok: false as const, error: "Demo account unavailable" };
    setSession(found.id);
    setUser(found);
    return { ok: true as const, user: found };
  }

  async function verify2FALogin(userId: string, _code: string) {
    const found = findUserById(userId);
    if (!found) return { ok: false as const, error: "Invalid code" };
    setSession(found.id);
    setUser(found);
    return { ok: true as const, user: found };
  }

  async function logOut() {
    setSession(null);
    setUser(undefined);
  }

  function updateUser(patch: Partial<User>) {
    if (user) setUser({ ...user, ...patch });
  }

  const value: AuthContextValue = { user, loading, signUp, logIn, verify2FALogin, logOut, refresh, updateUser };

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
  if (role === "property_manager") return "/dashboard/property-manager";
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
