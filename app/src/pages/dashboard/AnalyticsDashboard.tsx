import { LayoutDashboard, Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";

const NAV: NavItem[] = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard, end: true },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: TrendingUp },
];

const STATS = [
  { label: "Total Views", value: "12,847", icon: Eye, accent: "text-primary-text" },
  { label: "Favorites", value: "1,203", icon: Heart, accent: "text-rose-400" },
  { label: "Inquiries", value: "386", icon: MessageSquare, accent: "text-emerald-400" },
  { label: "Conversion Rate", value: "3.2%", icon: TrendingUp, accent: "text-amber-400" },
];

const BAR_DATA = [
  { label: "Seaside Serenity Villa", views: 4250, color: "bg-primary" },
  { label: "Metropolitan Haven", views: 3180, color: "bg-blue-500" },
  { label: "Rustic Retreat Cottage", views: 2417, color: "bg-emerald-500" },
  { label: "Mountain View Lodge", views: 1890, color: "bg-amber-500" },
  { label: "Lakeside Retreat", views: 1110, color: "bg-rose-500" },
];

const MAX_VIEWS = Math.max(...BAR_DATA.map((d) => d.views));

const MONTHLY = [
  { label: "Jan", value: 820 },
  { label: "Feb", value: 910 },
  { label: "Mar", value: 1340 },
  { label: "Apr", value: 1120 },
  { label: "May", value: 1560 },
  { label: "Jun", value: 1480 },
  { label: "Jul", value: 1890 },
  { label: "Aug", value: 2100 },
  { label: "Sep", value: 1760 },
  { label: "Oct", value: 1420 },
  { label: "Nov", value: 1280 },
  { label: "Dec", value: 1620 },
];

const MAX_MONTHLY = Math.max(...MONTHLY.map((m) => m.value));

export default function AnalyticsDashboard() {
  return (
    <DashboardLayout navItems={NAV}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Analytics Overview</h1>
        <p className="text-base text-muted">Track your property performance and engagement metrics.</p>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
            <stat.icon className={stat.accent} size={22} />
            <span className="text-2xl font-semibold text-white">{stat.value}</span>
            <span className="text-sm text-muted">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Property Views Chart */}
      <div className="mt-8 rounded-xl border border-border p-6 md:p-10">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Property Views</h2>
        <p className="mt-1 text-sm text-muted">Views per listing this month</p>
        <div className="mt-8 flex flex-col gap-5">
          {BAR_DATA.map((item) => (
            <div key={item.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{item.label}</span>
                <span className="text-sm font-medium text-muted">{item.views.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                  style={{ width: `${(item.views / MAX_VIEWS) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="mt-8 rounded-xl border border-border p-6 md:p-10">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Monthly Trends</h2>
        <p className="mt-1 text-sm text-muted">Total views across all listings per month</p>
        <div className="mt-8 flex items-end gap-2" style={{ height: "200px" }}>
          {MONTHLY.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full flex justify-center">
                <div
                  className="w-full rounded-t-lg bg-primary/80 transition-all duration-500"
                  style={{ height: `${(m.value / MAX_MONTHLY) * 160}px` }}
                  title={`${m.label}: ${m.value.toLocaleString()} views`}
                />
              </div>
              <span className="text-[10px] text-muted sm:text-xs">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
