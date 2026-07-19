import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";
import { SkeletonStatCard } from "../../../components/Skeleton";
import { useAuth } from "../../../lib/auth-api";
import { apiClient } from "../../../lib/api-client";
import { ADMIN_NAV } from "../../../lib/admin-nav";
import SEO from "../../../components/SEO";

export default function AdminSupport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, activeListings: 0, totalInquiries: 0 });

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

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="System Health" description="Monitor platform metrics and operational status from the Estatein admin support dashboard." />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">System Health</h1>
        <span className="text-sm text-subtle">Platform metrics and operational status</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          : (
              <>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">Total Users</span>
                  <span className="text-2xl font-semibold text-white">{stats.totalUsers}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">Total Listings</span>
                  <span className="text-2xl font-semibold text-white">{stats.totalListings}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">Active Properties</span>
                  <span className="flex items-center gap-2 text-2xl font-semibold text-white">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    {stats.activeListings}
                  </span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">Total Inquiries</span>
                  <span className="text-2xl font-semibold text-white">{stats.totalInquiries}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">Pending Approvals</span>
                  <span className="text-2xl font-semibold text-white">{stats.activeListings > 0 ? Math.round((stats.totalListings - stats.activeListings)) : 0}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
                  <span className="text-sm text-muted">API Status</span>
                  <span className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                    <CheckCircle2 size={18} />
                    Operational
                  </span>
                </div>
              </>
            )}
      </div>
    </DashboardLayout>
  );
}
