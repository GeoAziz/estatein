import { Link } from "react-router-dom";
import { Building2, Home, ShieldCheck, TrendingUp } from "lucide-react";
import { SERVICE_HUBS } from "../data/content";

const ICONS = [Home, TrendingUp, Building2, ShieldCheck];

export default function ServiceHubBar() {
  return (
    <div className="grid grid-cols-1 gap-4 border-y border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
      {SERVICE_HUBS.map((hub, i) => {
        const Icon = ICONS[i];
        return (
          <Link
            key={hub.title}
            to={hub.to}
            className="flex flex-col items-center gap-4 rounded-xl border border-border px-4 py-8 text-center transition hover:border-primary"
          >
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-border text-primary-text">
              <Icon size={26} />
            </span>
            <span className="text-base font-semibold text-white sm:text-lg">{hub.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
