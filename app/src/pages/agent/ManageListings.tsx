import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Calendar,
  Copy,
  Eye,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonRow } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { apiClient } from "../../lib/api-client";
import { mapListing, unwrapList, type NormalizedListing } from "../../lib/normalizers";

type AgentListing = NormalizedListing;

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/agent", icon: LayoutDashboard },
  { label: "My Listings", to: "/agent/listings", icon: HomeIcon, end: true },
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

const SORTS = ["Most Recent", "Most Views", "Most Favorites", "Price High to Low", "Price Low to High"] as const;

function priceToNumber(price: string) {
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}

export default function ManageListings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [status, setStatus] = useState<"All" | "active" | "pending" | "sold">("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Most Recent");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  async function fetchListings() {
    if (!user) return;
    setLoading(true);
    try {
      const result = await apiClient.getListings();
      const items = unwrapList(result, "listings");
      setListings(items.map(mapListing));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  const filtered = useMemo(() => {
    let list = listings.filter((l) => (status === "All" ? true : l.listingStatus === status));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => l.name.toLowerCase().includes(q) || l.street.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
    switch (sort) {
      case "Most Views":
        list = [...list].sort((a, b) => b.views - a.views);
        break;
      case "Most Favorites":
        list = [...list].sort((a, b) => b.favorites - a.favorites);
        break;
      case "Price High to Low":
        list = [...list].sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price));
        break;
      case "Price Low to High":
        list = [...list].sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
        break;
      default:
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [listings, status, search, sort]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  async function handleDelete(id: string) {
    const listing = listings.find((l) => l.id === id);
    const ok = await confirm({
      title: "Delete this listing?",
      message: `"${listing?.name ?? "This listing"}" will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setSelected((s) => s.filter((sid) => sid !== id));
      showToast("success", "Listing deleted");
    } catch {
      showToast("error", "Failed to delete listing");
    }
  }

  async function handleMarkSold(id: string) {
    const l = listings.find((x) => x.id === id);
    if (!l) return;
    const ok = await confirm({
      title: "Mark as sold?",
      message: `Move "${l.name}" to Sold? It will no longer appear as active.`,
      confirmLabel: "Mark as Sold",
      danger: false,
    });
    if (!ok) return;
    try {
      await apiClient.updateListing(id, { listingStatus: "sold", status: "sold" });
      setListings((prev) => prev.map((x) => x.id === id ? { ...x, listingStatus: "sold" } : x));
      showToast("success", "Listing marked as sold");
    } catch {
      showToast("error", "Failed to update listing");
    }
  }

  async function handleDuplicate(id: string) {
    const l = listings.find((x) => x.id === id);
    if (!l) return;
    try {
      const result = await apiClient.createListing({
        ...l,
        id: undefined,
        name: `${l.name} (Copy)`,
        listingStatus: "pending",
      });
      if (result?.listing) {
        setListings((prev) => [mapListing(result.listing), ...prev]);
      }
      showToast("success", "Listing duplicated");
    } catch {
      showToast("error", "Failed to duplicate listing");
    }
  }

  async function bulkDelete() {
    const ok = await confirm({
      title: `Delete ${selected.length} listings?`,
      message: "These listings will be permanently removed. This can't be undone.",
      confirmLabel: "Delete All",
      danger: true,
    });
    if (!ok) return;
    try {
      await Promise.all(selected.map((id) => apiClient.deleteListing(id)));
      setListings((prev) => prev.filter((l) => !selected.includes(l.id)));
      setSelected([]);
      showToast("success", "Selected listings deleted");
    } catch {
      showToast("error", "Failed to delete some listings");
    }
  }

  async function bulkMarkSold() {
    const ok = await confirm({
      title: `Mark ${selected.length} listings as sold?`,
      message: "These listings will move to Sold status.",
      confirmLabel: "Mark as Sold",
      danger: false,
    });
    if (!ok) return;
    try {
      await Promise.all(selected.map((id) => apiClient.updateListing(id, { listingStatus: "sold", status: "sold" })));
      setListings((prev) => prev.map((l) => selected.includes(l.id) ? { ...l, listingStatus: "sold" } : l));
      setSelected([]);
      showToast("success", "Selected listings marked as sold");
    } catch {
      showToast("error", "Failed to update some listings");
    }
  }

  return (
    <DashboardLayout navItems={NAV}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">My Listings</h1>
        <Link
          to="/agent/listings/new"
          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus size={16} />
          Add New Property
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            {["All", "active", "pending", "sold"].map((s) => (
              <option key={s} value={s} className="bg-base text-white capitalize">
                {s === "All" ? "All Statuses" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s} className="bg-base text-white">
                {s}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address or property name"
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2 rounded-lg border border-border p-1">
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "list" ? "bg-primary text-white" : "text-muted"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "grid" ? "bg-primary text-white" : "text-muted"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-5 py-3">
          <span className="text-sm text-white">{selected.length} listings selected</span>
          <div className="flex gap-3">
            <button onClick={bulkMarkSold} className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
              Mark as Sold
            </button>
            <button onClick={bulkDelete} className="text-sm font-medium text-red-400 underline underline-offset-4">
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[880px] text-left">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={10} />
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-border p-16 text-center">
          <Building2 className="text-subtle" size={40} />
          <h2 className="text-xl font-semibold text-white">No listings yet</h2>
          <p className="text-base text-muted">Start by adding your first property</p>
          <Link to="/agent/listings/new" className="rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90">
            + Add New Listing
          </Link>
        </div>
      ) : view === "list" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="p-4"></th>
                <th className="p-4 font-medium">Photo</th>
                <th className="p-4 font-medium">Address</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Favorites</th>
                <th className="p-4 font-medium">Inquiries</th>
                <th className="p-4 font-medium">Listed</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((l) => (
                <tr key={l.id} className="border-b border-border text-sm last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(l.id)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, l.id] : s.filter((id) => id !== l.id)))}
                      className="h-4 w-4 rounded border-border bg-transparent accent-primary"
                    />
                  </td>
                  <td className="p-4">
                    {l.photos[0] ? (
                      <img src={l.photos[0]} alt={l.name} className="h-12 w-16 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-md border border-border text-subtle">
                        <HomeIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-white">
                    {l.name}
                    <div className="text-xs text-subtle">{l.street}, {l.city}</div>
                  </td>
                  <td className="p-4 text-muted">{l.price}</td>
                  <td className="p-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[l.listingStatus] ?? STATUS_STYLES.pending}`}>
                      {l.listingStatus}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    <span className="flex items-center gap-1"><Eye size={14} />{l.views}</span>
                  </td>
                  <td className="p-4 text-muted">
                    <span className="flex items-center gap-1"><Heart size={14} />{l.favorites}</span>
                  </td>
                  <td className="p-4 text-muted">
                    <span className="flex items-center gap-1"><MessageSquare size={14} />{l.inquiries}</span>
                  </td>
                  <td className="p-4 text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/agent/listings/${l.id}/edit`} className="text-xs font-medium text-white underline underline-offset-4 hover:text-primary-text">
                        Edit
                      </Link>
                      <Link to="/dashboard/agent#analytics" className="text-xs font-medium text-muted underline underline-offset-4 hover:text-white">
                        Analytics
                      </Link>
                      <button onClick={() => handleMarkSold(l.id)} className="text-xs font-medium text-muted underline underline-offset-4 hover:text-white">
                        Mark Sold
                      </button>
                      <button onClick={() => handleDuplicate(l.id)} aria-label="Duplicate" className="flex h-8 w-8 items-center justify-center text-muted hover:text-white">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center text-muted hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((l) => (
            <div key={l.id} className="group relative flex flex-col gap-4 rounded-xl border border-border p-4">
              {l.photos[0] ? (
                <img src={l.photos[0]} alt={l.name} className="h-[160px] w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-[160px] w-full items-center justify-center rounded-lg border border-border text-subtle">
                  <HomeIcon size={28} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[l.listingStatus] ?? STATUS_STYLES.pending}`}>
                  {l.listingStatus}
                </span>
                <span className="text-lg font-semibold text-white">{l.name}</span>
                <span className="text-sm text-muted">{l.price} · {l.beds} bd · {l.baths} ba</span>
              </div>
              <div className="flex gap-2">
                <Link to={`/agent/listings/${l.id}/edit`} className="flex-1 rounded-[10px] border border-border py-2 text-center text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(l.id)}
                  aria-label="Delete listing"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-border text-muted hover:border-red-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-8 flex items-center justify-between text-sm text-muted">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} properties
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1.5 text-white">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
