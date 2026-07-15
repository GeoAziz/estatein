import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, MailCheck, Sparkles } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-base px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="text-primary-text" size={22} />
            Estatein
          </Link>
        </div>

        {!sent ? (
          <div className="flex flex-col gap-6 rounded-xl border border-border p-6 text-center md:p-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-white">Reset Your Password</h1>
              <p className="text-base text-muted">Enter your email address</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Email</span>
                <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 focus-within:border-primary">
                  <Mail size={18} className="shrink-0 text-subtle" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
                  />
                </div>
              </label>
              <button
                type="submit"
                className="w-full rounded-[10px] bg-primary px-6 py-[16px] text-base font-medium text-white hover:bg-primary/90"
              >
                Reset Password
              </button>
            </form>
            <Link to="/login" className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
              Back to Login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-10 text-center">
            <MailCheck className="text-primary-text" size={44} />
            <h1 className="text-2xl font-semibold text-white">Check Your Email</h1>
            <p className="text-base text-muted">
              We've sent password reset instructions to <span className="text-white">{email}</span>
            </p>
            <p className="text-sm text-muted">Click the link in your email to reset your password.</p>
            <Link
              to="/login"
              className="mt-2 w-full rounded-[10px] bg-primary px-6 py-[14px] text-center text-base font-medium text-white hover:bg-primary/90"
            >
              Back to Login
            </Link>
            <p className="text-sm text-subtle">
              Didn't receive an email? Check spam or{" "}
              <button onClick={() => setSent(false)} className="text-white underline underline-offset-4 hover:text-primary-text">
                try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
