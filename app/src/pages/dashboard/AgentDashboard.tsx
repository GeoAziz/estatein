import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Calendar,
  Eye,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonRow, SkeletonStatCard } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { apiClient } from "../../lib/api-client";
import { mapInquiry, mapListing, unwrapList, type NormalizedInquiry, type NormalizedListing } from "../../lib/normalizers";

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/agent", icon: LayoutDashboard, end: true },
  { label: "My Listings", to: "/agent/listings", icon: HomeIcon },
  { label: "Inquiries", to: "/agent/messages", icon: MessageSquare },
  { label: "Scheduled Viewings", to: "/dashboard/agent#viewings", icon: Calendar },
  { label: "Analytics", to: "/dashboard/agent#analytics", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/50 text-emerald-400",
  pending: "border-amber-500/50 text-amber-400",
  sold: "border-white/20 text-muted",
  rejected: "border-red-500/50 text-red-400",
};

type Listing = NormalizedListing;
type Inquiry = NormalizedInquiry;

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, forceRerender] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listResult, inqResult] = await Promise.allSettled([
        apiClient.getListings(),
        apiClient.getInquiries(),
      ]);

      if (listResult.status === "fulfilled" && listResult.value) {
        setListings(unwrapList(listResult.value, "listings").map(mapListing));
      }

      if (inqResult.status === "fulfilled" && inqResult.value) {
        setInquiries(unwrapList(inqResult.value, "inquiries").map(mapInquiry));
      }
    } catch {
      // Fall back to empty
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scheduled = inquiries.filter((i) => i.viewingRequested);
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const totalFavorites = listings.reduce((sum, l) => sum + l.favorites, 0);

  const STATS = [
    { label: "Active Listings", value: listings.filter((l) => l.listingStatus === "active").length, icon: Building2 },
    { label: "Total Views", value: totalViews, icon: Eye },
    { label: "Favorites", value: totalFavorites, icon: Heart },
    { label: "Inquiries", value: inquiries.length, icon: MessageSquare },
    { label: "Scheduled Viewings", value: scheduled.length, icon: Calendar },
  ];

  const topListings = [...listings].sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = Math.max(...topListings.map((l) => l.views), 1);

  return (
    <DashboardLayout navItems={NAV}>
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-base text-muted">
            {user?.company ?? "Independent Agent"} {user?.license && `| License: ${user.license}`}
          </p>
        </div>
        <Link
          to="/agent/listings/new"
          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-[14px] text-base font-medium text-white hover:bg-primary/90"
        >
          <Plus size={18} />
          Add New Listing
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
                <stat.icon className="text-primary-text" size={22} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
      </div>

      {/* My Listings */}
      <div className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">My Properties</h2>
          <Link to="/agent/listings" className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
            Manage All Listings
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="p-4 font-medium">Property</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Favorites</th>
                <th className="p-4 font-medium">Inquiries</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : (
                <>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b border-border text-sm last:border-0">
                      <td className="p-4 font-medium text-white">{l.name}</td>
                      <td className="p-4 text-muted">{l.price}</td>
                      <td className="p-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[l.listingStatus] || STATUS_STYLES.pending}`}>
                          {l.listingStatus}
                        </span>
                      </td>
                      <td className="p-4 text-muted">{l.views}</td>
                      <td className="p-4 text-muted">{l.favorites}</td>
                      <td className="p-4 text-muted">{l.inquiries}</td>
                    </tr>
                  ))}
                </>
              )}
              {!loading && listings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No listings yet —{" "}
                    <Link to="/agent/listings/new" className="text-white underline underline-offset-4">
                      add your first property
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiries */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Buyer Inquiries</h2>
        {inquiries.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">No inquiries yet</p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {inquiries.map((i) => {
              const listing = listings.find((l) => l.id === i.listingId);
              return (
                <div key={i.id} className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-white">
                      {i.buyerName} · {listing?.name ?? "Property"}
                    </span>
                    <span className="text-sm text-muted">
                      {i.viewingRequested ? "Schedule Viewing" : "General"} · {new Date(i.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        i.status === "New" ? "border-primary text-primary-text" : "border-border text-muted"
                      }`}
                    >
                      {i.status}
                    </span>
                    <Link
                      to="/agent/messages"
                      onClick={() => apiClient.updateInquiryStatus(i.id, "read").catch(() => {})}
                      className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Viewings */}
      <div id="viewings" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Upcoming Property Tours</h2>
        {scheduled.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-base text-muted">No scheduled viewings</p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {scheduled.map((v) => {
              const listing = listings.find((l) => l.id === v.listingId);
              return (
                <div key={v.id} className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-white">{listing?.name ?? "Property"}</span>
                    <span className="text-sm text-muted">
                      {v.buyerName} · {v.viewingDate} at {v.viewingTime} · {v.contactMethod}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        apiClient.updateViewingStatus(v.id, "Confirmed").catch(() => {});
                        forceRerender((n) => n + 1);
                      }}
                      className="rounded-[10px] border border-primary px-4 py-2.5 text-sm font-medium text-primary-text hover:bg-primary/10"
                    >
                      Confirm
                    </button>
                    <button className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                      Reschedule
                    </button>
                    <button className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-muted hover:border-red-500 hover:text-red-400">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics */}
      <div id="analytics" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">This Month's Activity</h2>
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border p-6">
          {topListings.map((l) => (
            <div key={l.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm text-muted">
                <span className="text-white">{l.name}</span>
                <span>{l.views} views</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(l.views / maxViews) * 100}%` }} />
              </div>
            </div>
          ))}
          {topListings.length === 0 && <p className="text-center text-muted">No listing activity yet</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
