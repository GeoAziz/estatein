import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Sparkles, X, type LucideIcon } from "lucide-react";
import { useAuth } from "../lib/auth-api";

export type NavItem = { label: string; to: string; icon: LucideIcon; end?: boolean };

function isHashLink(to: string) {
  return to.includes("#");
}

function getHashId(to: string) {
  const idx = to.indexOf("#");
  return idx >= 0 ? to.slice(idx + 1) : null;
}

function getPath(to: string) {
  const idx = to.indexOf("#");
  return idx >= 0 ? to.slice(0, idx) : to;
}

export default function DashboardLayout({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: ReactNode;
}) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  function handleLogout() {
    logOut();
    navigate("/");
  }

  function scrollToHash(to: string) {
    const hashId = getHashId(to);
    if (!hashId) return;
    const el = document.getElementById(hashId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(hashId);
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    const timer = setTimeout(() => {
      navItems.forEach((item) => {
        const hashId = getHashId(item.to);
        if (hashId) {
          const el = document.getElementById(hashId);
          if (el) observer.observe(el);
        }
      });
    }, 100);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [children, navItems]);

  return (
    <div className="flex min-h-screen flex-col bg-base text-white">
      <a href="#dashboard-main" className="skip-link">
        Skip to content
      </a>
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="dashboard-nav-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border text-white lg:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="text-primary-text" size={20} />
            Estatein
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-white hover:border-primary">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold text-primary-text">
              {user?.name?.[0] ?? "?"}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs capitalize text-muted">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-white hover:border-primary hover:text-primary-text"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[9] bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex flex-1">
        <aside
          id="dashboard-nav-menu"
          className={`${menuOpen ? "flex" : "hidden"} w-60 shrink-0 flex-col gap-1 border-r border-border p-4 lg:flex ${menuOpen ? "fixed left-0 top-[73px] z-10 h-[calc(100vh-73px)] bg-base" : ""}`}
        >
          {navItems.map((item) => {
            const hashId = getHashId(item.to);
            const navPath = getPath(item.to);
            const isCurrentPath = pathname === navPath || pathname.startsWith(navPath + "/");
            const isHashActive = hashId && isCurrentPath && activeSection === hashId;

            if (isHashLink(item.to)) {
              return (
                <button
                  key={item.to}
                  onClick={() => {
                    setMenuOpen(false);
                    if (isCurrentPath) {
                      scrollToHash(item.to);
                    } else {
                      navigate(item.to);
                    }
                  }}
                  className={`flex items-center gap-3 rounded-[10px] px-4 py-3 text-left text-sm font-medium transition ${
                    isHashActive ? "border border-border bg-white/5 text-white" : "text-muted hover:text-white"
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {item.label}
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium transition ${
                    isActive ? "border border-border bg-white/5 text-white" : "text-muted hover:text-white"
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </aside>

        <main id="dashboard-main" key={pathname} className="animate-page-fade min-w-0 flex-1 px-6 py-10 md:px-10">{children}</main>
      </div>
    </div>
  );
}
