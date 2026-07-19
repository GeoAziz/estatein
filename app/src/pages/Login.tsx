import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth, dashboardPathForRole } from "../lib/auth-api";
import { apiClient } from "../lib/api-client";
import SEO from "../components/SEO";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const { logIn, verify2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await logIn(email, password);
      if (result.ok === "requires2FA") {
        setPendingUserId(result.userId);
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate(from ?? dashboardPathForRole(result.user.role));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e: FormEvent) {
    e.preventDefault();
    if (!pendingUserId) return;
    setError("");
    setLoading(true);
    try {
      const result = await verify2FALogin(pendingUserId, twoFactorCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate(from ?? dashboardPathForRole(result.user.role));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyBackupCode(e: FormEvent) {
    e.preventDefault();
    if (!pendingUserId) return;
    setError("");
    setLoading(true);
    try {
      const result = await apiClient.verifyBackupCode(pendingUserId, backupCode);
      // Full navigation so AuthProvider re-fetches the session from the new cookie.
      window.location.href = from ?? dashboardPathForRole(result.user.role as any);
    } catch (err: any) {
      setError(err.message || "Invalid backup code");
      setLoading(false);
    }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiClient.requestOtpLogin(email);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtpLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiClient.verifyOtpLogin(email, otpCode);
      // Full navigation (not client-side routing) so AuthProvider re-fetches
      // the session from the new cookie rather than staying logged out.
      window.location.href = from ?? dashboardPathForRole(result.user.role as any);
    } catch (err: any) {
      setError(err.message || "Invalid code");
      setLoading(false);
    }
  }

  if (pendingUserId) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-base px-6 py-16">
        <SEO title="Two-Factor Verification" description="Enter your two-factor authentication code to finish logging in." />
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <ShieldCheck className="text-primary-text" size={32} />
            <h1 className="text-2xl font-semibold text-white">Two-Factor Verification</h1>
            <p className="text-base text-muted">
              {useBackupCode
                ? "Enter one of your unused backup codes."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          {useBackupCode ? (
            <form onSubmit={handleVerifyBackupCode} className="flex flex-col gap-5 rounded-xl border border-border p-6 md:p-8">
              <input
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8))}
                placeholder="A1B2C3D4"
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:tracking-normal placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || backupCode.length !== 8}
                className="w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & Log In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setUseBackupCode(false);
                  setBackupCode("");
                }}
                className="text-center text-sm text-muted hover:text-white"
              >
                Use authenticator code instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="flex flex-col gap-5 rounded-xl border border-border p-6 md:p-8">
              <input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & Log In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setUseBackupCode(true);
                  setTwoFactorCode("");
                }}
                className="text-center text-sm text-muted hover:text-white"
              >
                Use a backup code instead
              </button>
              <button type="button" onClick={() => setPendingUserId(null)} className="text-center text-sm text-muted hover:text-white">
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (useOtpLogin) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-base px-6 py-16">
        <SEO title="Log In with a Code" description="Log in to your Estatein account with a one-time code sent to your phone." />
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <ShieldCheck className="text-primary-text" size={32} />
            <h1 className="text-2xl font-semibold text-white">Log In with a Code</h1>
            <p className="text-base text-muted">
              {otpSent ? "Enter the 6-digit code sent to your registered phone number." : "Enter your email and we'll text you a one-time code."}
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          <form onSubmit={otpSent ? handleVerifyOtpLogin : handleSendOtp} className="flex flex-col gap-5 rounded-xl border border-border p-6 md:p-8">
            {!otpSent ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Email</span>
                <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 focus-within:border-primary">
                  <Mail size={18} className="shrink-0 text-subtle" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
                  />
                </div>
              </label>
            ) : (
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            )}
            <button
              type="submit"
              disabled={loading || (otpSent && otpCode.length !== 6)}
              className="w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Please wait…" : otpSent ? "Verify & Log In" : "Send Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setUseOtpLogin(false);
                setOtpSent(false);
                setOtpCode("");
              }}
              className="text-center text-sm text-muted hover:text-white"
            >
              Back to password login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-base px-6 py-16">
      <SEO title="Log In" description="Log in to your Estatein account to manage listings, favorites, inquiries, and scheduled viewings." />
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="text-primary-text" size={22} />
            Estatein
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-white">Welcome Back</h1>
            <p className="text-base text-muted">Log in to your account</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border p-6 md:p-8">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Email</span>
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 focus-within:border-primary">
              <Mail size={18} className="shrink-0 text-subtle" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Password</span>
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 focus-within:border-primary">
              <Lock size={18} className="shrink-0 text-subtle" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-subtle hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded border-border bg-transparent accent-primary"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-muted hover:text-primary-text">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setUseOtpLogin(true);
            }}
            className="text-center text-sm text-muted hover:text-white"
          >
            Log in with a one-time code instead
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-sm text-subtle">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted">Don't have an account?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="flex-1 rounded-[10px] border border-border px-6 py-3 text-center text-base font-medium text-white hover:border-primary hover:text-primary-text"
            >
              Sign Up as Buyer
            </Link>
            <Link
              to="/signup?role=agent"
              className="flex-1 rounded-[10px] border border-border px-6 py-3 text-center text-base font-medium text-white hover:border-primary hover:text-primary-text"
            >
              Sign Up as Agent
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-subtle">
          Demo accounts — buyer@estatein.com · agent@estatein.com · admin@estatein.com (password: Password1)
        </p>
      </div>
    </div>
  );
}
