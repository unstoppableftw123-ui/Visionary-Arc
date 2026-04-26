import { cn } from "../../lib/utils"

/**
 * Skeleton — animated placeholder that matches the shape of incoming content.
 *
 * Props:
 *   className  — Tailwind classes (use w-*, h-*, rounded-* to shape it)
 *   delay      — stagger delay in milliseconds (0–600 ms recommended)
 *   circle     — shorthand for fully rounded (rounded-full)
 *   ...props   — forwarded to the underlying <div>
 */
function Skeleton({ className, delay = 0, circle = false, style, ...props }) {
  return (
    <div
      className={cn(
        "bg-muted/80 dark:bg-muted/60",
        "animate-skeleton-pulse",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        /* Keep the pulse keyframes in sync even when delay shifts the start */
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────────────────────────
   Composites — pre-built skeletons that mirror real components
───────────────────────────────────────────────────────────── */

/**
 * Skeleton for a Library grid card.
 * Mirrors: thumbnail (116 px) + title line + type badge + date
 */
function LibraryCardSkeleton({ index = 0 }) {
  const base = index * 70
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Thumbnail */}
      <Skeleton
        className="h-[116px] w-full rounded-none"
        delay={base}
      />
      {/* Footer */}
      <div className="px-3 py-2.5 space-y-2">
        <Skeleton className="h-3 w-3/4" delay={base + 30} />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-2.5 w-16 rounded-full" delay={base + 60} />
          <Skeleton className="h-2.5 w-12" delay={base + 90} />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for a Dashboard bento stat card.
 * Mirrors: icon + title + large number + subtitle
 */
function DashboardCardSkeleton({ index = 0, wide = false }) {
  const base = index * 80
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex flex-col gap-3",
        wide && "md:col-span-2"
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-md" delay={base} />
        <Skeleton className="h-3.5 w-28" delay={base + 20} />
      </div>
      <Skeleton className="h-9 w-20 rounded-lg" delay={base + 40} />
      <Skeleton className="h-2.5 w-36" delay={base + 60} />
    </div>
  )
}

/**
 * Skeleton for a Community server-list item.
 * Mirrors: icon square + name + description
 */
function CommunityServerSkeleton({ index = 0 }) {
  const base = index * 55
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" delay={base} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" delay={base + 25} />
        <Skeleton className="h-2.5 w-1/2" delay={base + 50} />
      </div>
      <Skeleton className="h-7 w-14 rounded-md shrink-0" delay={base + 70} />
    </div>
  )
}

/**
 * Skeleton for a chat session list item.
 * Mirrors: title line + timestamp
 */
function ChatSessionSkeleton({ index = 0 }) {
  const base = index * 80
  return (
    <div className="p-3 rounded-lg border border-transparent space-y-2">
      <Skeleton className="h-3.5 w-3/4" delay={base} />
      <Skeleton className="h-2.5 w-1/3" delay={base + 40} />
    </div>
  )
}

export {
  Skeleton,
  LibraryCardSkeleton,
  DashboardCardSkeleton,
  CommunityServerSkeleton,
  ChatSessionSkeleton,
}
