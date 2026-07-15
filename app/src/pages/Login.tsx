import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth, dashboardPathForRole } from "../lib/auth-api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { logIn } = useAuth();
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
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate(from ?? dashboardPathForRole(result.user.role));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-base px-6 py-16">
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
