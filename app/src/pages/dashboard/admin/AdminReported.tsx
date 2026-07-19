import { AlertTriangle } from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";
import { ADMIN_NAV } from "../../../lib/admin-nav";
import SEO from "../../../components/SEO";

type ReportedItem = {
  id: string;
  subject: string;
  reason: string;
  status: string;
};

export default function AdminReported() {
  const reported: ReportedItem[] = [];

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <SEO title="Reported Listings & Users" description="Review and resolve reports of problematic listings or users submitted by the Estatein community." />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Reported Listings & Users</h1>
        <span className="text-sm text-subtle">Review and resolve reports from the community</span>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {reported.length === 0 && (
          <div className="rounded-xl border border-border p-12 text-center">
            <AlertTriangle size={32} className="mx-auto text-muted/40" />
            <p className="mt-4 text-base text-muted">No reports right now.</p>
            <p className="mt-1 text-sm text-muted/60">Reports from users will appear here for review.</p>
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
            <span className="rounded-full border border-amber-500/50 px-3 py-1 text-xs font-medium text-amber-400">
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
