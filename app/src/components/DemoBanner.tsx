import { useState } from "react";
import { DEMO_CREDENTIALS } from "../lib/demo/demo-data";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const ROLES: { label: string; account: { email: string; password: string } }[] = [
  { label: "Buyer", account: DEMO_CREDENTIALS.buyer },
  { label: "Agent", account: DEMO_CREDENTIALS.agent },
  { label: "Admin", account: DEMO_CREDENTIALS.admin },
];

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold">Showcase demo — no real data is stored.</span>
          {ROLES.map((r) => (
            <span key={r.label} className="whitespace-nowrap">
              <strong>{r.label}:</strong> {r.account.email} / {r.account.password}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-yellow-200/70 hover:text-yellow-100"
          aria-label="Dismiss demo banner"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
