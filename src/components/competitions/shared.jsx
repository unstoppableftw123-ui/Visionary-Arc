import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils";

/**
 * Floats "+N XP" upward from anchor; gold text, fade out.
 * Trigger by changing `xpGain` (e.g. 10) — animation runs once per change.
 */
export function XPFloatAnimation({ xpGain, onComplete, className }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (xpGain == null || xpGain <= 0) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1200);
    return () => clearTimeout(t);
  }, [xpGain, onComplete]);

  return (
    <AnimatePresence>
      {visible && xpGain > 0 && (
        <motion.span
          key={xpGain}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -60 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "absolute pointer-events-none text-lg font-bold whitespace-nowrap",
            "text-brand-orange drop-shadow-sm",
            className
          )}
        >
          +{xpGain} XP
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * Circular countdown timer (SVG stroke-dashoffset).
 * @param {number} seconds - total duration
 * @param {number} remaining - seconds left (drives the circle)
 * @param {number} size - SVG width/height
 */
export function CountdownTimer({ seconds, remaining, size = 56, className, strokeColor = "currentColor" }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, remaining / seconds);
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("flex-shrink-0 -rotate-90", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-20"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: "linear", duration: 0.3 }}
      />
    </svg>
  );
}

/**
 * Player avatar with initials fallback (for leaderboards, waiting room).
 */
export function PlayerAvatar({ name, avatar, className, size = "default" }) {
  const initials = (name || "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  const sizeClass = size === "sm" ? "h-8 w-8 text-sm md:text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  return (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarFallback className="bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)]">
        {avatar || initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Streak counter with optional pulse on update.
 */
export function StreakCounter({ count, className }) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn("inline-flex items-center gap-1 font-semibold text-brand-orange", className)}
    >
      <span aria-hidden>🔥</span>
      <span>{count} in a row</span>
    </motion.span>
  );
}
