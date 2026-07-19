import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Building2, Download, MessageSquare, TrendingUp, Users } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { SkeletonStatCard } from "../../components/Skeleton";
import { apiClient } from "../../lib/api-client";
import { ADMIN_NAV } from "../../lib/admin-nav";
import SEO from "../../components/SEO";

type Tab = "Overview" | "Regional";

const CHART_COLORS = ["#703bf7", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

interface Overview {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyActiveUsers: number;
}

interface RegionalRow {
  county: string;
  propertyCount: number;
  avgPrice: number;
  inquiryCount: number;
}

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [regional, setRegional] = useState<RegionalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResult, regionalResult] = await Promise.allSettled([
        apiClient.getAnalyticsOverview(),
        apiClient.getRegionalTrends(),
      ]);

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      }
      if (regionalResult.status === "fulfilled") {
        setRegional(regionalResult.value?.regions || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await apiClient.exportAnalytics("csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analytics-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const STATS = overview
    ? [
        { label: "Total Listings", value: overview.totalListings, icon: Building2 },
        { label: "Active Listings", value: overview.activeListings, icon: TrendingUp },
        { label: "Total Inquiries", value: overview.totalInquiries, icon: MessageSquare },
        { label: "Monthly Active Users", value: overview.monthlyActiveUsers, icon: Users },
      ]
    : [];

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="Analytics" description="Track platform performance, revenue, and regional trends across the EstateIn marketplace." />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Analytics Overview</h1>
          <p className="text-base text-muted">Platform-wide performance and regional trends.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-[10px] border border-border px-5 py-2.5 text-sm font-medium text-white hover:border-primary hover:text-primary-text disabled:opacity-60"
        >
          <Download size={16} />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        {(["Overview", "Regional"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "border-primary text-primary-text" : "border-transparent text-muted hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
              : STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
                    <stat.icon className="text-primary-text" size={22} />
                    <span className="text-2xl font-semibold text-white">{stat.value.toLocaleString()}</span>
                    <span className="text-sm text-muted">{stat.label}</span>
                  </div>
                ))}
          </div>

          {overview && (
            <div className="mt-8 rounded-xl border border-border p-6 md:p-10">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Total Revenue</h2>
              <p className="mt-2 text-3xl font-semibold text-primary-text">
                KSh {overview.totalRevenue.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-muted">From completed payments (M-Pesa, card, bank transfer)</p>
            </div>
          )}
        </>
      )}

      {tab === "Regional" && (
        <div className="mt-8 flex flex-col gap-8">
          <div className="rounded-xl border border-border p-6 md:p-10">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Properties by County</h2>
            <p className="mt-1 text-sm text-muted">Listing count across top counties</p>
            <div className="mt-6 h-[320px]">
              {loading ? (
                <div className="h-full animate-pulse rounded-lg bg-white/5" />
              ) : regional.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted">No regional data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regional.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="county" stroke="#999999" fontSize={12} />
                    <YAxis stroke="#999999" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 8 }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="propertyCount" fill="#703bf7" radius={[4, 4, 0, 0]} name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border p-6 md:p-10">
              <h2 className="text-xl font-semibold text-white">Inquiry Distribution</h2>
              <div className="mt-6 h-[280px]">
                {regional.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regional.slice(0, 6)}
                        dataKey="inquiryCount"
                        nameKey="county"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => entry.county}
                      >
                        {regional.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border p-6 md:p-10">
              <h2 className="text-xl font-semibold text-white">Regional Breakdown</h2>
              <div className="mt-4 flex flex-col divide-y divide-border">
                {regional.slice(0, 8).map((r) => (
                  <div key={r.county} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-white">{r.county}</span>
                    <div className="flex gap-4 text-muted">
                      <span>{r.propertyCount} listings</span>
                      <span>KSh {r.avgPrice.toLocaleString()} avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
