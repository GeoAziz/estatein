import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";
import { dashboardPathForRole, useAuth } from "../lib/auth-api";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Properties", to: "/properties" },
  { label: "Services", to: "/services" },
];

export default function Header() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logOut();
    navigate("/");
  }

  return (
    <header className="border-b border-border">
      {bannerOpen && (
        <div className="relative flex items-center justify-center gap-2.5 border-b border-border px-16 py-[18px] text-center">
          <p className="text-sm font-medium text-white sm:text-base">
            <span className="mr-1">✨</span>
            Discover Your Dream Property with Estatein —{" "}
            <Link to="/properties" className="underline underline-offset-2 hover:text-primary-text">
              Learn More
            </Link>
          </p>
          <button
            aria-label="Dismiss banner"
            onClick={() => setBannerOpen(false)}
            className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-white hover:border-primary hover:text-primary-text sm:right-10"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <nav className="flex items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-[162px]">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
          <Sparkles className="text-primary-text" size={22} />
          Estatein
        </Link>

        <div className="hidden items-center gap-[30px] lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-[10px] px-6 py-[14px] text-base font-medium transition ${
                  isActive
                    ? "border border-border text-white"
                    : "text-muted hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `rounded-[10px] border px-6 py-4 text-base font-medium transition ${
                isActive ? "border-primary text-primary-text" : "border-border text-white hover:border-primary hover:text-primary-text"
              }`
            }
          >
            Contact Us
          </NavLink>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPathForRole(user.role)}
                className="flex items-center gap-2 rounded-[10px] bg-primary px-5 py-4 text-base font-medium text-white hover:bg-primary/90"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="flex h-[52px] w-[52px] items-center justify-center rounded-[10px] border border-border text-white hover:border-primary hover:text-primary-text"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-[10px] border border-border px-6 py-4 text-base font-medium text-white hover:border-primary hover:text-primary-text"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-[10px] bg-primary px-6 py-4 text-base font-medium text-white hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border text-white lg:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-nav-menu" className="flex flex-col gap-2 border-t border-border px-6 py-4 lg:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-[10px] px-4 py-3 text-base font-medium ${
                  isActive ? "border border-border text-white" : "text-muted"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="rounded-[10px] border border-border px-4 py-3 text-base font-medium text-white"
          >
            Contact Us
          </NavLink>
          {user ? (
            <>
              <Link
                to={dashboardPathForRole(user.role)}
                onClick={() => setMenuOpen(false)}
                className="rounded-[10px] bg-primary px-4 py-3 text-center text-base font-medium text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="rounded-[10px] border border-border px-4 py-3 text-base font-medium text-white"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-[10px] border border-border px-4 py-3 text-center text-base font-medium text-white"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="rounded-[10px] bg-primary px-4 py-3 text-center text-base font-medium text-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
