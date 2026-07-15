import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

export function FaqCard({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-6 md:p-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <h3 className="text-xl font-semibold text-white md:text-2xl">{item.question}</h3>
        <ChevronDown
          size={22}
          className={`mt-1 shrink-0 text-primary-text transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="text-base leading-relaxed text-muted">{item.answer}</p>}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="self-start text-base font-medium text-white underline underline-offset-4 hover:text-primary-text"
        >
          Read More
        </button>
      )}
    </div>
  );
}
