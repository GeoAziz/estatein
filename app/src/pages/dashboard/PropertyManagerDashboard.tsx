import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  ShieldAlert,
  Trash2,
  Users,
  Wrench,
  X,
  LayoutDashboard,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonRow, SkeletonStatCard } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { unwrapList } from "../../lib/normalizers";
import { useModalA11y } from "../../lib/useModalA11y";
import SEO from "../../components/SEO";

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/property-manager", icon: LayoutDashboard, end: true },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

const CURRENCIES = ["KSH", "USD", "EUR", "GBP"] as const;
const TENANT_STATUSES = ["active", "inactive", "pending", "evicted"] as const;
const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const MAINTENANCE_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const STATUS_FLOW = ["open", "in_progress", "resolved", "closed"] as const;

const TENANT_STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/50 text-emerald-400",
  pending: "border-amber-500/50 text-amber-400",
  inactive: "border-white/20 text-muted",
  evicted: "border-red-500/50 text-red-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "border-white/20 text-muted",
  medium: "border-blue-500/50 text-blue-400",
  high: "border-amber-500/50 text-amber-400",
  urgent: "border-red-500/50 text-red-400",
};

const MAINTENANCE_STATUS_STYLES: Record<string, string> = {
  open: "border-amber-500/50 text-amber-400",
  in_progress: "border-blue-500/50 text-blue-400",
  resolved: "border-emerald-500/50 text-emerald-400",
  closed: "border-white/20 text-muted",
};

type Tenant = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyId: string;
  propertyAddress: string;
  landlordId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  currency: string;
  securityDeposit: number | null;
  status: string;
  paymentDay: number;
  notes: string;
};

type MaintenanceRequest = {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyAddress: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
};

function toDateInput(v?: string | null) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function mapTenant(t: any): Tenant {
  return {
    id: t.id,
    userId: t.userId || t.user?.id || "",
    userName: t.user?.name || "",
    userEmail: t.user?.email || "",
    propertyId: t.propertyId || "",
    propertyAddress: t.property?.address || "",
    landlordId: t.landlordId || "",
    leaseStartDate: toDateInput(t.leaseStartDate),
    leaseEndDate: toDateInput(t.leaseEndDate),
    monthlyRent: t.monthlyRent ?? 0,
    currency: t.currency || "KSH",
    securityDeposit: t.securityDeposit ?? null,
    status: t.status || "active",
    paymentDay: t.paymentDay ?? 1,
    notes: t.notes || "",
  };
}

function mapMaintenanceRequest(r: any): MaintenanceRequest {
  return {
    id: r.id,
    tenantId: r.tenantId || r.tenant?.id || "",
    tenantName: r.tenant?.user?.name || "",
    propertyId: r.propertyId || "",
    propertyAddress: r.property?.address || "",
    title: r.title || "",
    description: r.description || "",
    category: r.category || "",
    priority: r.priority || "medium",
    status: r.status || "open",
    createdAt: r.createdAt || new Date().toISOString(),
    resolvedAt: r.resolvedAt || null,
  };
}

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) return "N/A";
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function nextStatus(current: string): string | null {
  const idx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export default function PropertyManagerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState<"tenants" | "maintenance">("tenants");
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  const [tenantModal, setTenantModal] = useState<{ open: boolean; editing: Tenant | null }>({ open: false, editing: null });
  const [requestModal, setRequestModal] = useState<{ open: boolean; editing: MaintenanceRequest | null }>({ open: false, editing: null });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tenantResult, requestResult] = await Promise.allSettled([
        apiClient.getTenants(),
        apiClient.getMaintenanceRequests(),
      ]);

      if (tenantResult.status === "fulfilled" && tenantResult.value) {
        const all = unwrapList(tenantResult.value, "tenants").map(mapTenant);
        setTenants(all.filter((t) => t.landlordId === user.id));
      }

      if (requestResult.status === "fulfilled" && requestResult.value) {
        const all = unwrapList(requestResult.value, "requests").map(mapMaintenanceRequest);
        setRequests(all);
      }
    } catch {
      // fall back to empty
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tenantIds = new Set(tenants.map((t) => t.id));
  const myRequests = requests.filter((r) => tenantIds.has(r.tenantId));

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const openRequests = myRequests.filter((r) => r.status === "open").length;
  const urgentCount = myRequests.filter((r) => r.priority === "urgent" || r.priority === "high").length;

  const STATS = [
    { label: "Active Tenants", value: activeTenants, icon: Users },
    { label: "Total Tenants", value: tenants.length, icon: ClipboardList },
    { label: "Open Maintenance Requests", value: openRequests, icon: Wrench },
    { label: "Urgent / High Priority", value: urgentCount, icon: ShieldAlert },
  ];

  // --- Tenant CRUD ---
  async function handleSaveTenant(payload: any) {
    try {
      if (tenantModal.editing) {
        const result = await apiClient.updateTenant(tenantModal.editing.id, payload);
        const updated = mapTenant(result?.tenant ?? result);
        setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showToast("success", "Tenant updated");
      } else {
        const result = await apiClient.createTenant(payload);
        const created = mapTenant(result?.tenant ?? result);
        setTenants((prev) => [created, ...prev]);
        showToast("success", "Tenant added");
      }
      setTenantModal({ open: false, editing: null });
    } catch (error: any) {
      showToast("error", error?.message || "Failed to save tenant");
    }
  }

  async function handleDeleteTenant(tenant: Tenant) {
    const ok = await confirm({
      title: "Remove this tenant?",
      message: `Tenant record ${tenant.userName || tenant.userId} will be permanently removed.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteTenant(tenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
      showToast("success", "Tenant removed");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to remove tenant");
    }
  }

  // --- Maintenance CRUD ---
  async function handleSaveRequest(payload: any) {
    try {
      if (requestModal.editing) {
        const result = await apiClient.updateMaintenanceRequest(requestModal.editing.id, payload);
        const updated = mapMaintenanceRequest(result?.request ?? result);
        setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showToast("success", "Maintenance request updated");
      } else {
        const result = await apiClient.createMaintenanceRequest(payload);
        const created = mapMaintenanceRequest(result?.request ?? result);
        setRequests((prev) => [created, ...prev]);
        showToast("success", "Maintenance request created");
      }
      setRequestModal({ open: false, editing: null });
    } catch (error: any) {
      showToast("error", error?.message || "Failed to save maintenance request");
    }
  }

  async function handleDeleteRequest(request: MaintenanceRequest) {
    const ok = await confirm({
      title: "Delete this request?",
      message: `"${request.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteMaintenanceRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      showToast("success", "Maintenance request deleted");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to delete maintenance request");
    }
  }

  async function handleAdvanceStatus(request: MaintenanceRequest) {
    const next = nextStatus(request.status);
    if (!next) return;
    try {
      const result = await apiClient.updateMaintenanceRequest(request.id, { status: next });
      const updated = mapMaintenanceRequest(result?.request ?? result);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast("success", `Marked as ${next.replace(/_/g, " ")}`);
    } catch (error: any) {
      showToast("error", error?.message || "Failed to update status");
    }
  }

  return (
    <DashboardLayout navItems={NAV}>
      <SEO title="Property Manager Dashboard" description="Manage tenants, leases, and maintenance requests across your managed properties on Estatein." />
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-base text-muted">Manage your tenants and maintenance requests.</p>
        </div>
        <button
          onClick={() =>
            tab === "tenants"
              ? setTenantModal({ open: true, editing: null })
              : setRequestModal({ open: true, editing: null })
          }
          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-[14px] text-base font-medium text-white hover:bg-primary/90"
        >
          <Plus size={18} />
          {tab === "tenants" ? "New Tenant" : "New Request"}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
                <stat.icon className="text-primary-text" size={22} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
      </div>

      <div className="mt-8 flex gap-2 rounded-lg border border-border p-1 w-fit">
        <button
          onClick={() => setTab("tenants")}
          className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "tenants" ? "bg-primary text-white" : "text-muted hover:text-white"}`}
        >
          Tenants
        </button>
        <button
          onClick={() => setTab("maintenance")}
          className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "maintenance" ? "bg-primary text-white" : "text-muted hover:text-white"}`}
        >
          Maintenance Requests
        </button>
      </div>

      {tab === "tenants" && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="p-4 font-medium">Tenant</th>
                <th className="p-4 font-medium">Property</th>
                <th className="p-4 font-medium">Lease</th>
                <th className="p-4 font-medium">Rent</th>
                <th className="p-4 font-medium">Payment Day</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">No tenants yet — add your first tenant.</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="border-b border-border text-sm last:border-0">
                    <td className="p-4 font-medium text-white">
                      {t.userName || t.userId}
                      {t.userEmail && <div className="text-xs text-subtle">{t.userEmail}</div>}
                    </td>
                    <td className="p-4 text-muted">{t.propertyAddress || t.propertyId || "-"}</td>
                    <td className="p-4 text-muted">
                      {t.leaseStartDate || "-"} → {t.leaseEndDate || "Ongoing"}
                    </td>
                    <td className="p-4 text-muted">{formatMoney(t.monthlyRent, t.currency)}</td>
                    <td className="p-4 text-muted">Day {t.paymentDay}</td>
                    <td className="p-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${TENANT_STATUS_STYLES[t.status] || TENANT_STATUS_STYLES.active}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => setTenantModal({ open: true, editing: t })} className="text-xs font-medium text-white underline underline-offset-4 hover:text-primary-text">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteTenant(t)} aria-label="Remove tenant" className="flex h-8 w-8 items-center justify-center text-muted hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "maintenance" && (
        <div className="mt-6 flex flex-col gap-3">
          {loading ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-left">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
                </tbody>
              </table>
            </div>
          ) : myRequests.length === 0 ? (
            <p className="rounded-xl border border-border p-10 text-center text-base text-muted">No maintenance requests yet.</p>
          ) : (
            myRequests.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium text-white">{r.title}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.medium}`}>
                      {r.priority === "urgent" && <AlertTriangle className="mr-1 inline" size={12} />}
                      {r.priority}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${MAINTENANCE_STATUS_STYLES[r.status] || MAINTENANCE_STATUS_STYLES.open}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-sm text-muted">{r.description}</span>
                  <span className="text-xs text-subtle">
                    {r.tenantName || r.tenantId} · {r.propertyAddress || r.propertyId || "No property"} · {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {nextStatus(r.status) && (
                    <button
                      onClick={() => handleAdvanceStatus(r)}
                      className="rounded-[10px] border border-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary/10"
                    >
                      Mark {nextStatus(r.status)?.replace(/_/g, " ")}
                    </button>
                  )}
                  <button onClick={() => setRequestModal({ open: true, editing: r })} className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteRequest(r)} aria-label="Delete request" className="flex h-9 w-9 items-center justify-center text-muted hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tenantModal.open && (
        <TenantFormModal
          initial={tenantModal.editing}
          onClose={() => setTenantModal({ open: false, editing: null })}
          onSubmit={handleSaveTenant}
        />
      )}
      {requestModal.open && (
        <RequestFormModal
          initial={requestModal.editing}
          tenants={tenants}
          onClose={() => setRequestModal({ open: false, editing: null })}
          onSubmit={handleSaveRequest}
        />
      )}
    </DashboardLayout>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(dialogRef, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border border-border bg-base p-6 shadow-2xl focus:outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center text-subtle hover:text-white">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = "h-11 rounded-lg border border-border bg-transparent px-4 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-sm text-muted";

function TenantFormModal({ initial, onClose, onSubmit }: { initial: Tenant | null; onClose: () => void; onSubmit: (payload: any) => Promise<void> }) {
  const [userId, setUserId] = useState(initial?.userId ?? "");
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? "");
  const [leaseStartDate, setLeaseStartDate] = useState(initial?.leaseStartDate ?? "");
  const [leaseEndDate, setLeaseEndDate] = useState(initial?.leaseEndDate ?? "");
  const [monthlyRent, setMonthlyRent] = useState(String(initial?.monthlyRent ?? ""));
  const [currency, setCurrency] = useState(initial?.currency ?? "KSH");
  const [securityDeposit, setSecurityDeposit] = useState(String(initial?.securityDeposit ?? ""));
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [paymentDay, setPaymentDay] = useState(String(initial?.paymentDay ?? "1"));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isValid = (initial || userId.trim().length > 0) && leaseStartDate.trim().length > 0 && monthlyRent.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const payload: any = {
      propertyId: propertyId.trim() || undefined,
      leaseStartDate,
      leaseEndDate: leaseEndDate || undefined,
      monthlyRent: Number(monthlyRent),
      currency,
      securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
      paymentDay: paymentDay ? Number(paymentDay) : undefined,
      notes: notes.trim() || undefined,
    };
    if (!initial) payload.userId = userId.trim();
    if (initial) payload.status = status;
    await onSubmit(payload);
    setSubmitting(false);
  }

  return (
    <ModalShell title={initial ? "Edit Tenant" : "New Tenant"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!initial && (
          <label className={labelClass}>
            <span className={labelTextClass}>Tenant User ID *</span>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass} placeholder="Existing user's ID" required />
          </label>
        )}
        <label className={labelClass}>
          <span className={labelTextClass}>Property ID</span>
          <input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass} placeholder="Optional" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Lease Start *</span>
            <input type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Lease End</span>
            <input type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Monthly Rent *</span>
            <input type="number" min={0} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-base text-white">{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Security Deposit</span>
            <input type="number" min={0} value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Payment Day</span>
            <input type="number" min={1} max={31} value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} className={inputClass} />
          </label>
        </div>
        {initial && (
          <label className={labelClass}>
            <span className={labelTextClass}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {TENANT_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-base text-white capitalize">{s}</option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          <span className={labelTextClass}>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none" />
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text">
            Cancel
          </button>
          <button type="submit" disabled={!isValid || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {initial ? "Save Changes" : "Add Tenant"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function RequestFormModal({
  initial,
  tenants,
  onClose,
  onSubmit,
}: {
  initial: MaintenanceRequest | null;
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [tenantId, setTenantId] = useState(initial?.tenantId ?? tenants[0]?.id ?? "");
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "medium");
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [submitting, setSubmitting] = useState(false);

  const isValid = tenantId.trim().length > 0 && title.trim().length > 0 && description.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const payload: any = {
      tenantId,
      propertyId: propertyId.trim() || undefined,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
      priority,
    };
    if (initial) payload.status = status;
    await onSubmit(payload);
    setSubmitting(false);
  }

  return (
    <ModalShell title={initial ? "Edit Maintenance Request" : "New Maintenance Request"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Tenant *</span>
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={inputClass} required disabled={Boolean(initial)}>
            {tenants.length === 0 && <option value="">No tenants available</option>}
            {tenants.map((t) => (
              <option key={t.id} value={t.id} className="bg-base text-white">
                {t.userName || t.userId}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Property ID</span>
          <input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass} placeholder="Optional" />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Title *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Description *</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className="resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Category</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Plumbing, Electrical..." />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-base text-white capitalize">{p}</option>
              ))}
            </select>
          </label>
        </div>
        {initial && (
          <label className={labelClass}>
            <span className={labelTextClass}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-base text-white capitalize">{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text">
            Cancel
          </button>
          <button type="submit" disabled={!isValid || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {initial ? "Save Changes" : "Create Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
