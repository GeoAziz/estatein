import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Facebook, Instagram, Linkedin, Twitter } from "./SocialIcons";

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Browse Properties", to: "/properties" },
      { label: "For Sale", to: "/properties/for-sale" },
      { label: "For Rent", to: "/properties/for-rent" },
      { label: "New Construction", to: "/properties/new-construction" },
      { label: "Market Trends", to: "/market-trends" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Buying Guide", to: "/buying-guide" },
      { label: "Selling Guide", to: "/selling-guide" },
      { label: "Rental Guide", to: "/rental-guide" },
      { label: "Mortgage Calculator", to: "/mortgage-calculator" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Services", to: "/services" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "Support", to: "/support" },
      { label: "Sitemap", to: "/sitemap" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign Up", to: "/signup" },
      { label: "Log In", to: "/login" },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/estatein" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/estatein" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/estatein" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/estatein" },
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscribed) {
      const timer = setTimeout(() => setSubscribed(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [subscribed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col gap-16 px-6 py-16 md:px-10 lg:flex-row lg:justify-between lg:px-[162px] lg:py-24">
        <div className="flex max-w-[423px] flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="text-primary-text" size={22} />
            Estatein
          </Link>
          <p className="text-base leading-relaxed text-muted">
            Your journey to finding the perfect property begins here. Subscribe for the latest
            listings and real estate insights.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2.5 rounded-xl border border-border px-6 py-[18px]">
              <label htmlFor="footer-email" className="sr-only">
                Email Address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter Your Email"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
                disabled={loading}
                className="w-full bg-transparent text-base text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                disabled={loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            {error && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </form>
          {subscribed && (
            <p className="text-sm text-primary-text" role="status">
              ✓ Check your inbox for confirmation
            </p>
          )}
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:gap-[50px]">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-5">
              <h3 className="text-lg font-medium text-white">{col.title}</h3>
              <div className="flex flex-col gap-4">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-base text-muted transition-colors hover:text-primary-text focus:outline-none focus:text-primary-text"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex max-w-content flex-col-reverse items-center justify-between gap-6 border-t border-border px-6 py-6 md:px-10 md:flex-row lg:px-[162px]">
        <div className="flex flex-col items-center gap-2 text-sm text-white md:flex-row md:gap-9">
          <span>@{new Date().getFullYear()} Estatein. All Rights Reserved.</span>
          <Link to="/terms" className="transition-colors hover:text-primary-text focus:outline-none focus:text-primary-text">
            Terms &amp; Conditions
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          {SOCIALS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit our ${label} page (opens in new window)`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-white transition-colors hover:border-primary hover:text-primary-text hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-transparent"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
