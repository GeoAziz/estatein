import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Users,
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";
import { SkeletonStatCard } from "../../../components/Skeleton";
import { useAuth } from "../../../lib/auth-api";
import { apiClient } from "../../../lib/api-client";
import { ADMIN_NAV } from "../../../lib/admin-nav";
import SEO from "../../../components/SEO";

export default function AdminOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, activeListings: 0, pendingApprovals: 0, totalInquiries: 0 });

  const fetchStats = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    try {
      const result = await apiClient.getAdminStats();
      if (result) setStats(result);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const STATS = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary-text" },
    { label: "Total Listings", value: stats.totalListings, icon: Building2, color: "text-blue-400" },
    { label: "Pending Approval", value: stats.pendingApprovals, icon: Clock, color: stats.pendingApprovals > 0 ? "text-amber-400" : "text-primary-text", urgent: stats.pendingApprovals > 0 },
    { label: "Reported", value: 0, icon: Flag, color: "text-rose-400" },
    { label: "Active Properties", value: stats.activeListings, icon: CheckCircle2, color: "text-emerald-400" },
  ];

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="Admin Dashboard" description="View platform-wide stats on users, listings, and inquiries from the Estatein admin overview dashboard." />
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Admin Dashboard</h1>
          <span className="text-sm text-subtle">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
        <button
          onClick={() => navigate("/admin/dashboard/analytics")}
          className="flex items-center gap-2 rounded-[10px] border border-border px-5 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text"
        >
          <Eye size={16} />
          View Platform Stats
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <button
                key={stat.label}
                onClick={() => {
                  if (stat.label === "Pending Approval") navigate("/admin/dashboard/pending");
                  if (stat.label === "Total Users") navigate("/admin/dashboard/users");
                  if (stat.label === "Active Properties") navigate("/admin/dashboard/support");
                }}
                className={`flex flex-col gap-3 rounded-xl border p-6 text-left transition hover:border-white/20 ${stat.urgent ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}
              >
                <stat.icon className={stat.color} size={20} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </button>
            ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/admin/dashboard/pending")}
          className="flex items-center gap-4 rounded-xl border border-border p-6 text-left transition hover:border-white/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock size={22} className="text-amber-400" />
          </div>
          <div>
            <span className="text-base font-medium text-white">Review Pending Listings</span>
            <span className="block text-sm text-muted">{stats.pendingApprovals} awaiting approval</span>
          </div>
        </button>
        <button
          onClick={() => navigate("/admin/dashboard/users")}
          className="flex items-center gap-4 rounded-xl border border-border p-6 text-left transition hover:border-white/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Users size={22} className="text-primary-text" />
          </div>
          <div>
            <span className="text-base font-medium text-white">Manage Users</span>
            <span className="block text-sm text-muted">{stats.totalUsers} registered users</span>
          </div>
        </button>
      </div>
    </DashboardLayout>
  );
}
