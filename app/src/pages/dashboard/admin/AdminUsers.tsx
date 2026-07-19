import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";
import { SkeletonRow } from "../../../components/Skeleton";
import { useToast } from "../../../lib/toast";
import { useConfirm } from "../../../lib/confirm";
import { apiClient } from "../../../lib/api-client";
import { unwrapList } from "../../../lib/normalizers";
import { ADMIN_NAV } from "../../../lib/admin-nav";
import SEO from "../../../components/SEO";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
};

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
      if (roleFilter) params.role = roleFilter;
      const result = await apiClient.getAdminUsers(params);
      if (result) {
        setUsers(unwrapList(result, "users"));
        setTotal(result.total ?? unwrapList(result, "users").length);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  async function toggleUserStatus(u: AdminUser) {
    const newStatus = u.isActive ? "suspended" : "active";
    const action = u.isActive ? "Suspend" : "Activate";
    const ok = await confirm({
      title: `${action} user`,
      message: `${action} ${u.name}? ${u.isActive ? "They will lose access to the platform." : "They will regain access."}`,
      confirmLabel: action,
      danger: u.isActive,
    });
    if (!ok) return;
    try {
      await apiClient.updateUserStatus(u.id, newStatus);
      showToast("success", `User ${newStatus}`);
      await fetchData();
    } catch (error: any) {
      showToast("error", error.message || "Failed to update user");
    }
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="User Management" description="View, search, and manage registered Estatein users from the admin dashboard." />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">User Management</h1>
        <span className="text-sm text-subtle">{total} registered users</span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-transparent pl-9 pr-4 text-sm text-white placeholder:text-muted/50 focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-transparent px-3 text-sm text-white focus:border-primary focus:outline-none"
        >
          <option value="" className="bg-base">All Roles</option>
          <option value="buyer" className="bg-base">Buyers</option>
          <option value="agent" className="bg-base">Agents</option>
          <option value="admin" className="bg-base">Admins</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left" aria-label="Platform users">
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
            {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            {!loading && filtered.map((u) => (
              <tr key={u.id} className="border-b border-border text-sm last:border-0">
                <td className="p-4 font-medium text-white">{u.name}</td>
                <td className="p-4 text-muted">{u.email}</td>
                <td className="p-4 capitalize text-muted">{u.role}</td>
                <td className="p-4 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${u.isActive ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-400"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleUserStatus(u)}
                    className={`text-sm font-medium underline underline-offset-4 ${u.isActive ? "text-white hover:text-red-400" : "text-emerald-400 hover:text-emerald-300"}`}
                  >
                    {u.isActive ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted">
                {users.length === 0 ? "No users found." : "No users match your search."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-white disabled:opacity-40 hover:border-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-muted">Page {page}</span>
            <button
              onClick={() => setPage((p) => (p * PAGE_SIZE < total ? p + 1 : p))}
              disabled={page * PAGE_SIZE >= total}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-white disabled:opacity-40 hover:border-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
