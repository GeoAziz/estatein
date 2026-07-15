import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Building2, CheckCircle2, Eye, EyeOff, Heart, LineChart, MessageCircle, Search, Sparkles } from "lucide-react";
import { useAuth, dashboardPathForRole } from "../lib/auth-api";
import { apiClient } from "../lib/api-client";
import Confetti from "../components/Confetti";

const BUYER_BENEFITS = [
  { icon: Search, text: "Browse 10,000+ Properties" },
  { icon: Heart, text: "Save Favorites & Get Alerts" },
  { icon: MessageCircle, text: "Connect with Agents Instantly" },
];

const AGENT_BENEFITS = [
  { icon: Building2, text: "Manage Multiple Listings" },
  { icon: Bell, text: "Get Buyer Inquiries Instantly" },
  { icon: LineChart, text: "Track Performance & Stats" },
];

function passwordStrength(pw: string): { label: string; pct: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", pct: 33, color: "bg-red-500" };
  if (score <= 3) return { label: "Medium", pct: 66, color: "bg-yellow-500" };
  return { label: "Strong", pct: 100, color: "bg-primary" };
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function SignUp() {
  const [params] = useSearchParams();
  const initialRole: "buyer" | "agent" = params.get("role") === "agent" ? "agent" : "buyer";
  const plan = params.get("plan");
  const planLabel = plan ? PLAN_LABELS[plan] : undefined;
  const [role, setRole] = useState<"buyer" | "agent">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [license, setLicense] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [subscribe, setSubscribe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const strength = passwordStrength(password);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "This field is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter valid email";
    if (!phone.trim()) next.phone = "This field is required";
    if (!(password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password))) {
      next.password = "Minimum 8 characters, 1 uppercase, 1 number";
    }
    if (password !== confirmPassword) next.confirmPassword = "Passwords must match";
    if (!agree) next.agree = "This field is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    const result = await signUp({
      name,
      email,
      password,
      phone: `${countryCode} ${phone}`,
      role,
      company: company || undefined,
      license: license || undefined,
      licenseState: licenseState || undefined,
    });

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    if (plan) apiClient.trackEvent("plan_selected", { plan, role });
    setSuccess(true);
    setTimeout(() => navigate(dashboardPathForRole(result.user.role)), 3000);
  }

  if (success) {
    return (
      <div className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden bg-base px-6 py-16">
        <Confetti />
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border p-10 text-center">
          <CheckCircle2 className="text-primary-text" size={48} />
          <h1 className="text-2xl font-semibold text-white">
            {role === "agent" ? "Welcome to Estatein Agent Portal!" : "Welcome to Estatein!"}
          </h1>
          <p className="text-base text-muted">Check your email to verify your account.</p>
          {planLabel && (
            <p className="text-sm text-muted">
              You started the <span className="font-semibold text-white">{planLabel}</span> plan's 14-day free trial — our team will follow up to set up billing before it ends.
            </p>
          )}
          <button
            onClick={() => navigate("/")}
            className="mt-2 rounded-[10px] bg-primary px-6 py-[14px] text-base font-medium text-white hover:bg-primary/90"
          >
            Go to Home
          </button>
          <span className="text-sm text-subtle">Redirecting automatically…</span>
        </div>
      </div>
    );
  }

  const benefits = role === "agent" ? AGENT_BENEFITS : BUYER_BENEFITS;

  return (
    <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 bg-base lg:grid-cols-2">
      {/* Left */}
      <div className="hidden flex-col justify-between border-r border-border p-16 lg:flex">
        <div className="flex flex-col gap-10">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="text-primary-text" size={22} />
            Estatein
          </Link>
          <div className="flex flex-col gap-8">
            <h1 className="text-4xl font-semibold leading-tight text-white">
              {role === "agent" ? "List Properties & Grow Your Business" : "Find Your Dream Home"}
            </h1>
            <div className="flex flex-col gap-6">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-border text-primary-text">
                    <Icon size={22} />
                  </span>
                  <span className="text-lg text-white">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-base text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-white underline underline-offset-4 hover:text-primary-text">
            Log In
          </Link>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center px-6 py-12 md:px-10">
        <div className="flex w-full max-w-lg flex-col gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white lg:hidden">
            <Sparkles className="text-primary-text" size={22} />
            Estatein
          </Link>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-white">
              {role === "agent" ? "Create Agent Account" : "Create Your Account"}
            </h2>
            <p className="text-base text-muted">
              {role === "agent" ? "Start listing properties today" : "Join thousands of buyers finding their perfect home"}
            </p>
          </div>

          <div className="inline-flex w-fit gap-2 rounded-xl border border-border p-1.5">
            {(["buyer", "agent"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-[10px] px-5 py-2.5 text-sm font-medium transition ${
                  role === r ? "bg-primary text-white" : "text-muted hover:text-white"
                }`}
              >
                {r === "buyer" ? "I'm Buying" : "I'm Renting / Selling"}
              </button>
            ))}
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {submitError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Full Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Enter your full name"
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Phone Number</span>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-lg border border-border bg-transparent px-3 py-3 text-base text-white focus:outline-none"
                >
                  {["+254", "+1", "+44", "+91", "+27"].map((c) => (
                    <option key={c} value={c} className="bg-base text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="712 345 678"
                  className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                />
              </div>
              {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
            </label>

            {role === "agent" && (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-muted">Company / Brokerage Name (optional)</span>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    type="text"
                    placeholder="Enter brokerage name"
                    className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted">Agent License Number (optional)</span>
                    <input
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      type="text"
                      placeholder="License number"
                      className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted">License State/Region (optional)</span>
                    <select
                      value={licenseState}
                      onChange={(e) => setLicenseState(e.target.value)}
                      className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white focus:outline-none"
                    >
                      <option value="" className="bg-base text-subtle">
                        Select
                      </option>
                      {["California", "New York", "Texas", "Vermont", "Florida"].map((s) => (
                        <option key={s} value={s} className="bg-base text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Password</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full rounded-lg border border-border bg-transparent px-4 py-3 pr-11 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-subtle hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                  </div>
                  <span className="shrink-0 text-xs text-muted">{strength.label}</span>
                </div>
              )}
              {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Confirm Password</span>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-border bg-transparent px-4 py-3 pr-11 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-subtle hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-xs text-red-400">{errors.confirmPassword}</span>}
            </label>

            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border bg-transparent accent-primary"
              />
              I agree to{" "}
              <Link to="/terms" className="text-white underline underline-offset-2 hover:text-primary-text">
                Terms &amp; Conditions
              </Link>
            </label>
            {errors.agree && <span className="text-xs text-red-400">{errors.agree}</span>}

            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border bg-transparent accent-primary"
              />
              Subscribe to property alerts
            </label>

            <button
              type="submit"
              className="mt-2 w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90"
            >
              Sign Up
            </button>
            <p className="text-center text-sm text-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-white underline underline-offset-4 hover:text-primary-text">
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
