import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";
import { SkeletonRow } from "../../../components/Skeleton";
import { useToast } from "../../../lib/toast";
import { useConfirm } from "../../../lib/confirm";
import { apiClient } from "../../../lib/api-client";
import { unwrapList } from "../../../lib/normalizers";
import { ADMIN_NAV } from "../../../lib/admin-nav";
import SEO from "../../../components/SEO";

type PendingListing = {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  property: { address: string; city: string; description?: string; bedrooms?: number; bathrooms?: number; squareFeet?: number; price?: number } | null;
};

type BulkResult = { id: string; success: boolean; error?: string };

export default function AdminPendingListings() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [previewListing, setPreviewListing] = useState<PendingListing | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.getPendingListings();
      if (result) setListings(unwrapList(result, "listings"));
    } catch (error) {
      console.error("Failed to fetch pending listings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = listings.filter((l) => l.status === "pending");
  const filtered = pending.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.user?.name?.toLowerCase().includes(q) || l.property?.address?.toLowerCase().includes(q);
  });

  async function approveListing(id: string) {
    const ok = await confirm({
      title: "Approve listing",
      message: "Approve this listing? It will become visible to buyers.",
      confirmLabel: "Approve",
      danger: false,
    });
    if (!ok) return;
    setApprovingId(id);
    try {
      await apiClient.approveListing(id);
      showToast("success", "Listing approved");
      await fetchData();
      setSelected((s) => s.filter((sid) => sid !== id));
    } catch (error: any) {
      showToast("error", error.message || "Failed to approve listing");
    } finally {
      setApprovingId(null);
    }
  }

  async function rejectListing(id: string) {
    const result = await confirm({
      title: "Reject listing",
      message: "Provide a reason for rejection. The agent will be notified.",
      confirmLabel: "Reject",
      danger: true,
      prompt: { label: "Rejection reason", placeholder: "e.g. Missing photos, inaccurate pricing...", required: true },
    });
    if (!result || typeof result !== "string") return;
    setRejectingId(id);
    try {
      await apiClient.rejectListing(id, result);
      showToast("success", "Listing rejected");
      await fetchData();
      setSelected((s) => s.filter((sid) => sid !== id));
    } catch (error: any) {
      showToast("error", error.message || "Failed to reject listing");
    } finally {
      setRejectingId(null);
    }
  }

  async function bulkApprove() {
    if (selected.length === 0) return;
    const ok = await confirm({
      title: "Approve listings",
      message: `Approve ${selected.length} listing(s)?`,
      confirmLabel: "Approve All",
      danger: false,
    });
    if (!ok) return;

    const results: BulkResult[] = [];
    for (const id of selected) {
      try {
        await apiClient.approveListing(id);
        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message || "Failed" });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);
    setBulkResults(results);

    if (failed.length > 0) {
      showToast("error", `${succeeded}/${selected.length} approved. ${failed.length} failed.`);
    } else {
      showToast("success", `${succeeded} listing(s) approved`);
    }

    await fetchData();
    setSelected([]);
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="Pending Listings" description="Review and approve or reject property listings awaiting approval on Estatein." />
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Pending Listings</h1>
          <span className="text-sm text-subtle">{pending.length} listing(s) awaiting approval</span>
        </div>
        {selected.length > 0 && (
          <button
            onClick={bulkApprove}
            className="flex items-center gap-2 rounded-[10px] border border-emerald-500/50 px-5 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
          >
            Approve Selected ({selected.length})
          </button>
        )}
      </div>

      <div className="mt-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by title, agent, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-md rounded-lg border border-border bg-transparent pl-9 pr-4 text-sm text-white placeholder:text-muted/50 focus:border-primary focus:outline-none"
        />
      </div>

      {bulkResults && bulkResults.some((r) => !r.success) && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">Some approvals failed:</p>
          <ul className="mt-2 space-y-1">
            {bulkResults.filter((r) => !r.success).map((r) => (
              <li key={r.id} className="text-xs text-red-400/80">{r.id.slice(0, 8)}... — {r.error}</li>
            ))}
          </ul>
          <button onClick={() => setBulkResults(null)} className="mt-2 text-xs text-muted hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left" aria-label="Pending listings">
          <thead>
            <tr className="border-b border-border text-sm text-muted">
              <th className="p-4 w-10"></th>
              <th className="p-4 font-medium">Listing</th>
              <th className="p-4 font-medium">Agent</th>
              <th className="p-4 font-medium">Submitted</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            {!loading && filtered.map((l) => {
              const isApproving = approvingId === l.id;
              const isRejecting = rejectingId === l.id;
              return (
                <tr key={l.id} className="border-b border-border text-sm last:border-0">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(l.id)}
                      onChange={(e) => setSelected((s) => e.target.checked ? [...s, l.id] : s.filter((id) => id !== l.id))}
                      className="h-4 w-4 rounded border-border bg-transparent accent-primary"
                    />
                  </td>
                  <td className="p-4">
                    <button onClick={() => setPreviewListing(l)} className="text-left font-medium text-white hover:underline hover:underline-offset-4">
                      {l.title}
                    </button>
                    {l.property && <div className="text-xs text-subtle">{l.property.address}, {l.property.city}</div>}
                  </td>
                  <td className="p-4 text-muted">{l.user?.name ?? "—"}</td>
                  <td className="p-4 text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveListing(l.id)}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-1.5 rounded-[8px] border border-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        {isApproving ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isApproving ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => rejectListing(l.id)}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-1.5 rounded-[8px] border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {isRejecting ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isRejecting ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted">
                {pending.length === 0 ? "Nothing pending — you're all caught up." : "No listings match your search."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {previewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewListing(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-base p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{previewListing.title}</h3>
                {previewListing.property && <p className="text-sm text-muted">{previewListing.property.address}, {previewListing.property.city}</p>}
              </div>
              <button onClick={() => setPreviewListing(null)} className="text-muted hover:text-white"><XCircle size={20} /></button>
            </div>
            <div className="mt-6 space-y-4">
              {previewListing.property?.description && <p className="text-sm text-muted">{previewListing.property.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {previewListing.property?.price != null && <div><span className="text-muted">Price:</span> <span className="text-white font-medium">${previewListing.property.price.toLocaleString()}</span></div>}
                {previewListing.property?.bedrooms != null && <div><span className="text-muted">Beds:</span> <span className="text-white">{previewListing.property.bedrooms}</span></div>}
                {previewListing.property?.bathrooms != null && <div><span className="text-muted">Baths:</span> <span className="text-white">{previewListing.property.bathrooms}</span></div>}
                {previewListing.property?.squareFeet != null && <div><span className="text-muted">Sq Ft:</span> <span className="text-white">{previewListing.property.squareFeet.toLocaleString()}</span></div>}
              </div>
              <div><span className="text-muted text-sm">Agent:</span> <span className="text-sm text-white">{previewListing.user?.name ?? "—"}</span></div>
              <div><span className="text-muted text-sm">Submitted:</span> <span className="text-sm text-white">{new Date(previewListing.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setPreviewListing(null); approveListing(previewListing.id); }} className="flex items-center gap-2 rounded-[10px] border border-emerald-500/50 px-5 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10">Approve</button>
              <button onClick={() => { setPreviewListing(null); rejectListing(previewListing.id); }} className="flex items-center gap-2 rounded-[10px] border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10">Reject</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
