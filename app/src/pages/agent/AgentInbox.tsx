import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveIcon,
  BarChart3,
  Calendar,
  Home as HomeIcon,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonListItem } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { timeAgo, MAX_REPLY_LENGTH } from "../../lib/validation";
import { apiClient } from "../../lib/api-client";
import { mapInquiry, unwrapList, type NormalizedInquiry } from "../../lib/normalizers";

type Inquiry = NormalizedInquiry & {
  thread: { sender: "buyer" | "agent"; text: string; at: string }[];
};

type Listing = {
  id: string;
  name: string;
};

function buildNav(unread: number): NavItem[] {
  return [
    { label: "Dashboard", to: "/dashboard/agent", icon: LayoutDashboard },
    { label: "My Listings", to: "/agent/listings", icon: HomeIcon },
    { label: unread > 0 ? `Inquiries (${unread})` : "Inquiries", to: "/agent/messages", icon: MessageSquare, end: true },
    { label: "Scheduled Viewings", to: "/dashboard/agent#viewings", icon: Calendar },
    { label: "Analytics", to: "/dashboard/agent#analytics", icon: BarChart3 },
    { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
  ];
}

const TABS = ["All", "New", "Replied"] as const;

export default function AgentInbox() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [inqResult, listResult] = await Promise.allSettled([
        apiClient.getInquiries(),
        apiClient.getListings(),
      ]);

      if (listResult.status === "fulfilled" && listResult.value) {
        const items = unwrapList(listResult.value, "listings");
        setListings(items.map((l: any) => ({ id: l.id, name: l.name || l.title || "Property" })));
      }

      if (inqResult.status === "fulfilled" && inqResult.value) {
        const items = unwrapList(inqResult.value, "inquiries");
        const mapped: Inquiry[] = items.map((i: any) => {
          const base = mapInquiry(i);
          return {
            ...base,
            thread: i.thread || [{ sender: "buyer" as const, text: base.message, at: base.createdAt }],
          };
        });
        setInquiries(mapped);
        if (mapped.length > 0) setActiveId(mapped[0].id);
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

  const filtered = useMemo(() => {
    let list = inquiries;
    if (tab !== "All") list = list.filter((i) => i.status === tab);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((i) => i.buyerName.toLowerCase().includes(q));
    return list;
  }, [inquiries, tab, search]);

  const active = inquiries.find((i) => i.id === activeId) ?? filtered[0];
  const activeListing = active ? listings.find((l) => l.id === active.listingId) ?? active.property : undefined;
  const unreadCount = inquiries.filter((i) => !i.read).length;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.thread.length]);

  async function handleReply() {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      await apiClient.replyToInquiry(active.id, reply.trim());
      setReply("");
      setSending(false);
      // Add reply locally
      setInquiries((prev) => prev.map((i) =>
        i.id === active.id
          ? {
              ...i,
              status: "Replied",
              thread: [...i.thread, { sender: "agent" as const, text: reply.trim(), at: new Date().toISOString() }],
            }
          : i
      ));
      showToast("success", "Message sent");
    } catch {
      setSending(false);
      showToast("error", "Failed to send reply");
    }
  }

  function handleMarkRead(id: string, read: boolean) {
    apiClient.updateInquiryStatus(id, read ? "read" : "unread").catch(() => {});
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, read } : i));
  }

  async function handleDeleteConversation(id: string) {
    const ok = await confirm({
      title: "Remove this message?",
      message: "This conversation will be permanently deleted.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteInquiry(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setActiveId(null);
      showToast("success", "Conversation removed");
    } catch {
      showToast("error", "Failed to delete conversation");
    }
  }

  function handleArchive(id: string) {
    apiClient.updateInquiryStatus(id, "Resolved").catch(() => {});
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: "Resolved" } : i));
    showToast("success", "Conversation archived");
  }

  const nav = buildNav(unreadCount);

  if (!loading && inquiries.length === 0) {
    return (
      <DashboardLayout navItems={nav}>
        <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-xl border border-border p-12 text-center">
          <MessageSquare className="text-subtle" size={48} />
          <h2 className="text-xl font-semibold text-white">No messages yet</h2>
          <p className="text-base text-muted">Buyer inquiries will appear here</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={nav}>
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">Messages</h1>

      <div className="mt-6 grid grid-cols-1 gap-0 overflow-hidden rounded-xl border border-border lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <div className={`flex flex-col border-b border-border lg:border-b-0 lg:border-r ${active ? "hidden lg:flex" : "flex"}`}>
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Search size={16} className="text-subtle" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full bg-transparent text-sm text-white placeholder:text-subtle focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`min-h-[32px] rounded-full border px-3 py-1.5 text-xs font-medium ${
                    tab === t ? "border-primary text-primary-text" : "border-border text-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex max-h-[560px] flex-col overflow-y-auto">
            {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonListItem key={i} />)}
            {!loading && filtered.map((i) => {
              const listing = listings.find((l) => l.id === i.listingId) ?? i.property;
              return (
                <button
                  key={i.id}
                  onClick={() => {
                    setActiveId(i.id);
                    handleMarkRead(i.id, true);
                  }}
                  className={`flex flex-col gap-1 border-b border-border p-4 text-left last:border-0 ${
                    active?.id === i.id ? "bg-white/5" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{i.buyerName}</span>
                    <span className="shrink-0 text-xs text-subtle">{timeAgo(i.createdAt)}</span>
                  </div>
                  <span className="text-xs text-muted">{listing?.name ?? "Property"}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-muted">{i.thread[i.thread.length - 1]?.text}</span>
                    {!i.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                  </div>
                </button>
              );
            })}
            {!loading && filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted">No conversations match your search.</p>
            )}
          </div>
        </div>

        {/* Conversation view */}
        <div className={`flex flex-col ${active ? "flex" : "hidden lg:flex"}`}>
          {active ? (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-border p-4">
                <button onClick={() => setActiveId(null)} className="min-h-[44px] text-sm text-muted hover:text-white lg:hidden">
                  ← Back
                </button>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-white">{active.buyerName}</span>
                  <span className="text-xs text-muted">{activeListing?.name ?? "Property"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      active.status === "New" ? "border-primary text-primary-text" : "border-border text-muted"
                    }`}
                  >
                    {active.status}
                  </span>
                  <button onClick={() => handleArchive(active.id)} aria-label="Archive" className="flex h-9 w-9 items-center justify-center text-muted hover:text-white">
                    <ArchiveIcon size={16} />
                  </button>
                  <button onClick={() => handleDeleteConversation(active.id)} aria-label="Delete" className="flex h-9 w-9 items-center justify-center text-muted hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex max-h-[420px] flex-1 flex-col gap-4 overflow-y-auto p-6">
                {active.thread.map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${m.sender === "agent" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                        m.sender === "agent" ? "bg-primary text-white" : "border border-border bg-white/5 text-white"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-xs text-subtle">{timeAgo(m.at)}</span>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border p-4">
                <div className="flex items-end gap-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value.slice(0, MAX_REPLY_LENGTH))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    rows={2}
                    placeholder="Type your reply…"
                    className="w-full resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim() || sending}
                    aria-label="Send reply"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <span className="self-end text-xs text-subtle">{reply.length}/{MAX_REPLY_LENGTH}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-16 text-muted">Select a conversation</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
