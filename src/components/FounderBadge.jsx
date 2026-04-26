/**
 * FounderBadge — reusable inline badge shown next to usernames throughout the app.
 *
 * Usage:
 *   <FounderBadge user={user} />                   default (md)
 *   <FounderBadge user={user} size="sm" />          small – just the icon
 *   <FounderBadge user={user} size="lg" showLabel /> large – icon + "Gold Founder"
 *   <FounderBadge user={user} showLabel />           icon + label, default size
 */
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Sprout, Shield, Star, Crown } from "lucide-react";
import { isFounder, getFounderTier, TIER_META } from "../lib/founder";
import { cn } from "../lib/utils";

// ─── Tier → icon ──────────────────────────────────────────────────────────────
const TIER_ICONS = {
  seed:   Sprout,
  bronze: Shield,
  silver: Star,
  gold:   Crown,
};

// ─── Size variants ────────────────────────────────────────────────────────────
const SIZE = {
  xs: { wrap: "h-4 px-1 gap-0.5 text-sm md:text-[10px] rounded",          icon: "w-2.5 h-2.5" },
  sm: { wrap: "h-5 px-1.5 gap-1 text-sm md:text-[11px] rounded",          icon: "w-3 h-3" },
  md: { wrap: "h-6 px-2 gap-1 text-sm md:text-xs rounded-md",             icon: "w-3.5 h-3.5" },
  lg: { wrap: "h-7 px-2.5 gap-1.5 text-sm rounded-lg",         icon: "w-4 h-4" },
};

export default function FounderBadge({ user, size = "md", showLabel = false, className }) {
  if (!isFounder(user)) return null;

  const tier = getFounderTier(user);
  const meta = TIER_META[tier];
  const sz   = SIZE[size] ?? SIZE.md;
  const Icon = TIER_ICONS[tier] ?? Crown;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Wrapper — inline-flex so it sits naturally next to text */}
          <span
            className={cn(
              "inline-flex items-center font-semibold select-none cursor-default",
              "border transition-all duration-200",
              `bg-gradient-to-r ${meta.gradient} text-[var(--text-primary)]`,
              `border-transparent`,
              // Subtle glow on hover
              `hover:shadow-hover hover:${meta.glow}`,
              sz.wrap,
              className,
            )}
            data-testid={`founder-badge-${tier}`}
          >
            <Icon className={cn("flex-shrink-0", sz.icon)} />
            {showLabel && <span className="leading-none">{meta.label}</span>}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className={cn(
            "text-sm md:text-xs font-medium px-2.5 py-1.5 rounded-lg border",
            meta.bg,
            meta.border,
            meta.text,
            "bg-popover",
          )}
        >
          <span className="mr-1">{meta.emoji}</span>
          {meta.label} — Lifetime access
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * FounderAvatarRing — wraps an avatar to show a colored ring for founders.
 * Drop-in replacement for the plain avatar wrapper div.
 *
 * Usage:
 *   <FounderAvatarRing user={user}>
 *     <Avatar>…</Avatar>
 *   </FounderAvatarRing>
 */
export function FounderAvatarRing({ user, children, className }) {
  if (!isFounder(user)) return <>{children}</>;

  const tier = getFounderTier(user);
  const meta = TIER_META[tier];

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Animated gradient ring */}
      <div
        className={cn(
          "absolute -inset-[3px] rounded-full bg-gradient-to-br opacity-80 animate-pulse",
          meta.gradient,
        )}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * FounderOnlyBadge — small dot/pill used in sidebars / compact UIs.
 * Just the emoji + no text, for very tight spaces.
 */
export function FounderDot({ user, className }) {
  if (!isFounder(user)) return null;
  const tier = getFounderTier(user);
  const meta = TIER_META[tier];
  const Icon = TIER_ICONS[tier] ?? Crown;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-full",
        `bg-gradient-to-br ${meta.gradient}`,
        className,
      )}
      title={meta.label}
    >
      <Icon className="w-2.5 h-2.5 text-[var(--text-primary)]" />
    </span>
  );
}
