import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BarChart3, X } from "lucide-react";
import type { Property } from "../data/properties";

type CompareContextType = {
  selected: string[];
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  isSelected: (slug: string) => boolean;
  count: number;
};

const CompareContext = createContext<CompareContextType>({
  selected: [],
  toggle: () => {},
  remove: () => {},
  isSelected: () => false,
  count: 0,
});

export function useCompare() {
  return useContext(CompareContext);
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("compare-slugs") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("compare-slugs", JSON.stringify(selected));
  }, [selected]);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 4
        ? [...prev, slug]
        : prev
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setSelected((prev) => prev.filter((s) => s !== slug));
  }, []);

  const isSelected = useCallback((slug: string) => selected.includes(slug), [selected]);

  return (
    <CompareContext.Provider value={{ selected, toggle, remove, isSelected, count: selected.length }}>
      {children}
    </CompareContext.Provider>
  );
}

export default function CompareBar({ properties }: { properties: Property[] }) {
  const { selected, remove, count } = useCompare();

  const selectedProperties = selected
    .map((slug) => properties.find((p) => p.slug === slug))
    .filter(Boolean) as Property[];

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center gap-4 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2 text-white">
          <BarChart3 size={18} className="text-primary-text" />
          <span className="text-sm font-medium">{count} selected</span>
        </div>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {selectedProperties.map((p) => (
            <div
              key={p.slug}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1.5"
            >
              <span className="max-w-[120px] truncate text-xs text-white">{p.name}</span>
              <button
                onClick={() => remove(p.slug)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted hover:text-red-400"
                aria-label={`Remove ${p.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {count >= 2 && (
          <Link
            to={`/compare?ids=${selected.join(",")}`}
            className="shrink-0 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Compare Now
          </Link>
        )}
      </div>
    </div>
  );
}
