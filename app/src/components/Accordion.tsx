import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type AccordionSection = { id: string; title: string; content: string[] };

export function AccordionItem({ section, defaultOpen = false }: { section: AccordionSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={section.id} className="scroll-mt-24 rounded-xl border border-border p-6 md:p-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
        aria-controls={`${section.id}-panel`}
      >
        <h3 className="text-xl font-semibold text-white sm:text-2xl">{section.title}</h3>
        <ChevronDown
          size={22}
          className={`shrink-0 text-primary-text transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div id={`${section.id}-panel`} role="region" aria-label={section.title} className="mt-4 flex flex-col gap-3">
          {section.content.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function GuideToc({ sections }: { sections: AccordionSection[] }) {
  return (
    <aside className="flex h-fit flex-col gap-3 rounded-xl border border-border p-6 lg:sticky lg:top-24">
      <h3 className="text-lg font-semibold text-white">On This Page</h3>
      <div className="flex flex-col gap-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-base text-muted hover:text-primary-text">
            {s.title}
          </a>
        ))}
      </div>
    </aside>
  );
}
