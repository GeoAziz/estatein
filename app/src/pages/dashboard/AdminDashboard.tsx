import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  LayoutDashboard,
  Settings as SettingsIcon,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonRow, SkeletonStatCard } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { apiClient } from "../../lib/api-client";
import { unwrapList } from "../../lib/normalizers";

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
  { label: "Pending Listings", to: "/admin/dashboard#pending", icon: Clock },
  { label: "Users", to: "/admin/dashboard#users", icon: Users },
  { label: "Reported Listings", to: "/admin/dashboard#reported", icon: Flag },
  { label: "Support Tickets", to: "/admin/dashboard#support", icon: Ticket },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

type PendingListing = {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  property: { address: string; city: string } | null;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type ReportedItem = {
  id: string;
  subject: string;
  reason: string;
  status: string;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, activeListings: 0 });

  const fetchData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    try {
      const [listResult, userResult, statsResult] = await Promise.allSettled([
        apiClient.getPendingListings(),
        apiClient.getAdminUsers(),
        apiClient.getAdminStats(),
      ]);

      if (listResult.status === "fulfilled" && listResult.value) {
        setListings(unwrapList(listResult.value, "listings"));
      }

      if (userResult.status === "fulfilled" && userResult.value) {
        setUsers(unwrapList(userResult.value, "users"));
      }

      if (statsResult.status === "fulfilled" && statsResult.value) {
        setStats(statsResult.value);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pending = listings.filter((l) => l.status === "pending");
  const reported: ReportedItem[] = [];

  async function approveListing(id: string) {
    try {
      await apiClient.approveListing(id);
      showToast("success", "Listing approved");
      await fetchData();
      setSelected((s) => s.filter((sid) => sid !== id));
    } catch (error: any) {
      showToast("error", error.message || "Failed to approve listing");
    }
  }

  async function rejectListing(id: string) {
    const ok = await confirm({
      title: "Reject listing",
      message: "Reject this listing? The agent will be notified.",
      confirmLabel: "Reject",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.rejectListing(id);
      showToast("success", "Listing rejected");
      await fetchData();
      setSelected((s) => s.filter((sid) => sid !== id));
    } catch (error: any) {
      showToast("error", error.message || "Failed to reject listing");
    }
  }

  async function bulkApprove() {
    if (selected.length === 0) return;
    const ok = await confirm({
      title: "Approve listings",
      message: `Approve ${selected.length} listing(s)?`,
      confirmLabel: "Approve",
      danger: false,
    });
    if (!ok) return;

    let approved = 0;
    for (const id of selected) {
      try {
        await apiClient.approveListing(id);
        approved++;
      } catch (error) {
        console.error(`Failed to approve listing ${id}:`, error);
      }
    }

    showToast("success", `${approved}/${selected.length} listings approved`);
    await fetchData();
    setSelected([]);
  }

  const STATS = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Total Listings", value: stats.totalListings, icon: Building2 },
    { label: "Pending Approval", value: pending.length, icon: Clock, urgent: pending.length > 0 },
    { label: "Reported Listings", value: reported.length, icon: Flag, urgent: reported.length > 0 },
    { label: "Today's Revenue", value: "$0", icon: DollarSign },
    { label: "Active Properties", value: stats.activeListings, icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout navItems={NAV}>
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Admin Dashboard</h1>
          <span className="text-sm text-subtle">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
        <div className="flex gap-3">
          <button className="rounded-[10px] border border-border px-5 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
            View Platform Stats
          </button>
          <button className="rounded-[10px] bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90">
            Send Announcement
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <div
                key={stat.label}
                className={`flex flex-col gap-3 rounded-xl border p-6 ${stat.urgent ? "border-red-500/50" : "border-border"}`}
              >
                <stat.icon className={stat.urgent ? "text-red-400" : "text-primary-text"} size={20} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
      </div>

      {/* Pending Listings */}
      <div id="pending" className="mt-12 scroll-mt-24">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Listings Awaiting Approval</h2>
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">{selected.length} selected</span>
              <button
                onClick={bulkApprove}
                className="rounded-[10px] border border-emerald-500/50 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
              >
                Approve Selected
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="p-4"></th>
                <th className="p-4 font-medium">Address</th>
                <th className="p-4 font-medium">Agent</th>
                <th className="p-4 font-medium">Uploaded</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              {!loading && pending.map((l) => {
                return (
                  <tr key={l.id} className="border-b border-border text-sm last:border-0">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(l.id)}
                        onChange={(e) =>
                          setSelected((s) => (e.target.checked ? [...s, l.id] : s.filter((id) => id !== l.id)))
                        }
                        className="h-4 w-4 rounded border-border bg-transparent accent-primary"
                      />
                    </td>
                    <td className="p-4 font-medium text-white">
                      {l.title}
                      {l.property && <div className="text-xs text-subtle">{l.property.address}, {l.property.city}</div>}
                    </td>
                    <td className="p-4 text-muted">{l.user?.name ?? "—"}</td>
                    <td className="p-4 text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveListing(l.id)}
                          className="rounded-[8px] border border-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectListing(l.id)}
                          className="rounded-[8px] border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && pending.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    Nothing pending — you're all caught up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reported */}
      <div id="reported" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Reported Listings/Users</h2>
        <div className="mt-6 flex flex-col gap-3">
          {reported.length === 0 && (
            <div className="rounded-xl border border-border p-8 text-center text-muted">
              No reports right now.
            </div>
          )}
          {reported.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-red-400" size={18} />
                <div className="flex flex-col">
                  <span className="text-base font-medium text-white">{r.subject}</span>
                  <span className="text-sm text-muted">{r.reason}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-amber-500/50 px-3 py-1 text-xs font-medium text-amber-400">
                  {r.status}
                </span>
                <button className="rounded-[10px] border border-border px-4 py-2 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                  Investigate
                </button>
                <button className="rounded-[10px] border border-emerald-500/50 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10">
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div id="users" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Recent Users</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border text-sm last:border-0">
                  <td className="p-4 font-medium text-white">{u.name}</td>
                  <td className="p-4 text-muted">{u.email}</td>
                  <td className="p-4 capitalize text-muted">{u.role}</td>
                  <td className="p-4 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        u.isActive
                          ? "border-emerald-500/50 text-emerald-400"
                          : "border-red-500/50 text-red-400"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div id="support" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">System Health</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Database Size</span>
            <span className="text-lg font-semibold text-white">248 MB</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">API Uptime</span>
            <span className="flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 size={16} className="text-emerald-400" />
              99.98%
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Last Backup</span>
            <span className="flex items-center gap-2 text-lg font-semibold text-white">
              <XCircle size={16} className="text-muted" />
              6 hours ago
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
