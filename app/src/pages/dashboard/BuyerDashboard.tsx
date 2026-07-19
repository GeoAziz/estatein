import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Calendar,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonStatCard } from "../../components/Skeleton";
import BlurImage from "../../components/BlurImage";
import { useAuth } from "../../lib/auth-api";
import { apiClient } from "../../lib/api-client";
import { mapInquiry, unwrapList, type NormalizedInquiry } from "../../lib/normalizers";
import SEO from "../../components/SEO";

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/buyer", icon: LayoutDashboard, end: true },
  { label: "My Favorites", to: "/dashboard/buyer#favorites", icon: Heart },
  { label: "Saved Searches", to: "/dashboard/buyer#searches", icon: Bookmark },
  { label: "My Inquiries", to: "/dashboard/buyer#inquiries", icon: MessageSquare },
  { label: "Scheduled Viewings", to: "/dashboard/buyer#viewings", icon: Calendar },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

type FavoriteProperty = {
  id: string;
  slug: string;
  name: string;
  price: string;
  beds: number;
  baths: number;
  image: string;
  location: string;
};

type Inquiry = NormalizedInquiry;

type SavedSearch = {
  id: string;
  name: string;
  filters: string;
  lastSearched: string;
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [, forceRerender] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [favResult, inqResult, searchResult] = await Promise.allSettled([
        apiClient.getFavorites(),
        apiClient.getInquiries(),
        apiClient.getSavedSearches(),
      ]);

      if (favResult.status === "fulfilled" && favResult.value) {
        const favs = unwrapList(favResult.value, "favorites");
        setFavorites(favs.map((f: any) => ({
          id: f.id || f.propertyId,
          slug: f.slug || f.propertySlug || f.id,
          name: f.name || f.property?.name || "Property",
          price: f.price || f.property?.price ? `$${Number(f.price || f.property?.price).toLocaleString()}` : "",
          beds: f.beds || f.property?.bedrooms || 0,
          baths: f.baths || f.property?.bathrooms || 0,
          image: f.image || f.property?.images?.[0] || "",
          location: f.location || f.property?.city || "",
        })));
      }

      if (inqResult.status === "fulfilled" && inqResult.value) {
        setInquiries(unwrapList(inqResult.value, "inquiries").map(mapInquiry));
      }

      if (searchResult.status === "fulfilled" && searchResult.value) {
        setSavedSearches(unwrapList(searchResult.value, "savedSearches"));
      }
    } catch {
      // Fall back to empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scheduled = useMemo(() => inquiries.filter((i) => i.viewingRequested), [inquiries]);

  const STATS = [
    { label: "Properties Saved", value: favorites.length, icon: Heart, accent: "text-primary-text" },
    { label: "Messages Received", value: inquiries.length, icon: MessageSquare, accent: "text-blue-400" },
    { label: "Upcoming Tours", value: scheduled.length, icon: Calendar, accent: "text-amber-400" },
    { label: "Alerts Active", value: savedSearches.length, icon: Bookmark, accent: "text-emerald-400" },
  ];

  async function handleDeleteSearch(id: string) {
    try {
      await apiClient.deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      forceRerender((n) => n + 1);
    } catch {
      // ignore
    }
  }

  async function handleCancelViewing(id: string) {
    try {
      await apiClient.updateViewingStatus(id, "cancelled");
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, viewingStatus: "cancelled" } : i)));
    } catch {
      // Best-effort — dashboard state re-syncs on next fetch either way.
    }
  }

  function startReschedule(id: string, currentDate?: string, currentTime?: string) {
    setReschedulingId(id);
    setRescheduleDate(currentDate ?? "");
    setRescheduleTime(currentTime ?? "");
  }

  async function submitReschedule(id: string) {
    if (!rescheduleDate || !rescheduleTime) return;
    try {
      await apiClient.rescheduleViewing(id, rescheduleDate, rescheduleTime);
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, viewingDate: rescheduleDate, viewingTime: rescheduleTime, viewingStatus: "requested" } : i
        )
      );
      setReschedulingId(null);
    } catch {
      // Leave the inline form open so the buyer can retry.
    }
  }

  return (
    <DashboardLayout navItems={NAV}>
      <SEO title="Buyer Dashboard" description="Manage your favorites, saved searches, inquiries, and scheduled viewings from your Estatein buyer dashboard." />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome back, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-base text-muted">Here's what's happening with your properties.</p>
        <span className="mt-1 text-sm text-subtle">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
                <stat.icon className={stat.accent} size={22} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
      </div>

      {/* Favorites */}
      <div id="favorites" className="mt-12 scroll-mt-24">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Your Favorite Properties</h2>
          <Link to="/properties" className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
            View All Favorites
          </Link>
        </div>
        {favorites.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">
            No favorites yet. Start browsing properties!
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((p) => (
              <div key={p.id} className="group flex flex-col gap-4 rounded-xl border border-border p-4 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_rgba(112,59,247,0.35)]">
                <div className="overflow-hidden rounded-lg">
                  {p.image ? (
                    <BlurImage src={p.image} alt={p.name} className="h-[160px] w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="flex h-[160px] w-full items-center justify-center bg-white/5 text-subtle">No Image</div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-white">{p.name}</span>
                  <span className="text-sm text-muted">{p.price} · {p.beds} bd · {p.baths} ba</span>
                </div>
                <Link
                  to={`/properties/${p.slug}`}
                  className="rounded-[10px] border border-border py-2.5 text-center text-sm font-medium text-white hover:border-primary hover:text-primary-text"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Viewings */}
      <div id="viewings" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Upcoming Viewings</h2>
        {scheduled.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">No scheduled viewings</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {scheduled.map((v) => (
              <div key={v.id} className="flex flex-col gap-4 rounded-xl border border-border p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {v.property?.image && (
                      <img src={v.property.image} alt={v.property.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-white">{v.property?.name ?? "Property"}</span>
                      <span className="text-sm text-muted">
                        {v.viewingDate} at {v.viewingTime}
                        {v.viewingStatus && (
                          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                            {v.viewingStatus}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startReschedule(v.id, v.viewingDate, v.viewingTime)}
                      className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-white hover:border-primary hover:text-primary-text"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelViewing(v.id)}
                      disabled={v.viewingStatus === "cancelled"}
                      className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-muted hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {reschedulingId === v.id && (
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-white/[0.02] p-4 sm:flex-row sm:items-end">
                    <label className="flex flex-1 flex-col gap-1.5">
                      <span className="text-xs text-muted">New date</span>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="h-11 rounded-lg border border-border bg-transparent px-3 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-1 flex-col gap-1.5">
                      <span className="text-xs text-muted">New time</span>
                      <input
                        type="text"
                        placeholder="e.g. 2:00 PM"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="h-11 rounded-lg border border-border bg-transparent px-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitReschedule(v.id)}
                        disabled={!rescheduleDate || !rescheduleTime}
                        className="h-11 rounded-[10px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="h-11 rounded-[10px] border border-border px-4 text-sm font-medium text-white hover:border-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inquiries */}
      <div id="inquiries" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Your Messages</h2>
        {inquiries.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">No messages yet</p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {inquiries.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-5">
                <div className="flex flex-col">
                  <span className="text-base font-medium text-white">{i.property?.name ?? "Property"}</span>
                  <span className="text-sm text-muted">Agent · {new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    i.status === "New" ? "border-primary text-primary-text" : "border-border text-muted"
                  }`}
                >
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Searches */}
      <div id="searches" className="mt-12 scroll-mt-24">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Your Saved Searches</h2>
          <Link
            to="/properties"
            className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-white hover:border-primary hover:text-primary-text"
          >
            Create New Search
          </Link>
        </div>
        {savedSearches.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">No saved searches yet</p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {savedSearches.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-base font-medium text-white">{s.name}</span>
                  <span className="text-sm text-muted">{s.filters}</span>
                  <span className="text-xs text-subtle">Last searched {new Date(s.lastSearched).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link to="/properties" className="font-medium text-white underline underline-offset-4 hover:text-primary-text">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteSearch(s.id)}
                    className="font-medium text-muted underline underline-offset-4 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
