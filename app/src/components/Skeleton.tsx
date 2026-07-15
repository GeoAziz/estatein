export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer rounded-md ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
      <Skeleton className="h-[220px] w-full md:h-[260px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex flex-col gap-2 border-b border-border p-4 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
