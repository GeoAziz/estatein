import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-6 py-16 md:px-10 md:py-20 lg:px-[162px] lg:py-20 ${className}`}>
      <div className="mx-auto max-w-content">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  paragraph,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  paragraph?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex flex-col gap-3.5 ${align === "center" ? "items-center text-center" : ""} max-w-3xl`}
    >
      {eyebrow && (
        <span className="text-sm font-medium uppercase tracking-wide text-primary-text">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {paragraph && <p className="text-base leading-relaxed text-muted lg:text-lg">{paragraph}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  to,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[18px] text-base font-medium text-white transition hover:bg-primary/90 ${className}`;
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  to,
  onClick,
  className = "",
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-[10px] border border-border px-6 py-[18px] text-base font-medium text-white transition hover:border-primary hover:text-primary-text ${className}`;
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border p-6 md:p-10 ${className}`}>{children}</div>
  );
}

export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-white/5 text-primary-text md:h-[82px] md:w-[82px]">
      <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-border md:h-[62px] md:w-[62px]">
        {children}
      </div>
    </div>
  );
}

export function Pagination({ current, total }: { current: number; total: number }) {
  return (
    <span className="text-sm font-medium text-muted">
      {String(current).padStart(2, "0")} of {String(total).padStart(2, "0")}
    </span>
  );
}
