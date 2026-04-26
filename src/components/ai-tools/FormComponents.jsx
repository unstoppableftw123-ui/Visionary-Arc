import { Sparkles } from "lucide-react";
import { Switch } from "../ui/switch";

// ─── Prompt Bar ───────────────────────────────────────────────────────────────
// Big, Midjourney-style prompt input. Replaces plain text inputs for topic/subject/question.
export function PromptBar({
  value,
  onChange,
  placeholder,
  label,
  required,
  rows = 2,
  hint,
  name,
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="w-full rounded-xl border-2 border-border bg-secondary/40 px-4 py-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/45 resize-none transition-all duration-200 focus:border-primary/60 focus:bg-secondary/60 focus:outline-none leading-relaxed"
        />
        <Sparkles className="absolute bottom-3.5 right-3.5 h-4 w-4 text-muted-foreground/25 pointer-events-none transition-colors group-focus-within:text-primary/45" />
      </div>
      {hint && <p className="text-sm md:text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Difficulty Cards ─────────────────────────────────────────────────────────
// Visual card selectors for difficulty / style / level.
const DEFAULT_DIFFICULTY_LEVELS = [
  { value: "Easy", icon: "🌱", desc: "Foundational concepts" },
  { value: "Medium", icon: "⚡", desc: "Apply & analyze" },
  { value: "Hard", icon: "🔥", desc: "Critical thinking" },
];

export function DifficultyCards({ value, onChange, label = "Difficulty", levels }) {
  const opts = levels || DEFAULT_DIFFICULTY_LEVELS;
  const gridClass =
    opts.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : opts.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className={`grid ${gridClass} gap-2`}>
        {opts.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all duration-150 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                  : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              <span className="text-xl leading-none">{opt.icon}</span>
              <span
                className={`text-sm md:text-xs font-semibold leading-tight ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}
              >
                {opt.value}
              </span>
              <span className="text-sm md:text-[10px] text-muted-foreground leading-tight">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quantity Slider ──────────────────────────────────────────────────────────
// Interactive range slider that shows a live number as you drag it.
const SLIDER_STYLES = `
  .qty-slider { -webkit-appearance: none; appearance: none; outline: none; }
  .qty-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px; border-radius: 50%;
    background: hsl(var(--primary)); cursor: pointer;
    box-shadow: 0 0 0 4px hsl(var(--primary) / 0.18);
    transition: box-shadow 0.15s;
  }
  .qty-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 7px hsl(var(--primary) / 0.22);
  }
  .qty-slider::-moz-range-thumb {
    width: 22px; height: 22px; border: none; border-radius: 50%;
    background: hsl(var(--primary)); cursor: pointer;
  }
`;

export function QuantitySlider({
  value,
  onChange,
  min = 1,
  max = 20,
  step = 1,
  label,
  suffix = "",
}) {
  const numVal = Number(value);
  const pct = ((numVal - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <style>{SLIDER_STYLES}</style>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-2xl font-bold text-primary tabular-nums leading-none">
          {value}
          {suffix && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {suffix}
            </span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="qty-slider w-full h-2 rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--secondary)) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-sm md:text-[10px] text-muted-foreground">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

// ─── Toggle Option ────────────────────────────────────────────────────────────
// Prominent toggle switch with label and description. Replaces buried Switch rows.
export function ToggleOption({ checked, onCheckedChange, label, description }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3.5 cursor-pointer transition-all duration-150 ${
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
      }`}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="space-y-0.5 pr-4 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="text-sm md:text-xs text-muted-foreground leading-snug">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Generate Button ──────────────────────────────────────────────────────────
// Full-width, bold CTA with a shimmer sweep on hover.
export function GenerateButton({ disabled, children }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={[
        "group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold",
        "text-primary-foreground bg-primary transition-all duration-200",
        "before:content-[''] before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.14] before:to-transparent",
        "hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-in-out",
        "hover:shadow-hover hover:shadow-primary/30 hover:brightness-110",
        "active:scale-[0.99] active:brightness-95",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

// ─── Live Preview Hint ────────────────────────────────────────────────────────
// Shows a small dynamic preview that updates as the user fills in fields.
export function LivePreviewHint({ lines }) {
  const visible = (lines || []).filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 space-y-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
        <span className="text-sm md:text-[10px] font-bold text-primary/70 uppercase tracking-widest">
          Live Preview
        </span>
      </div>
      {visible.map((line, i) => (
        <p key={i} className="text-sm md:text-xs text-muted-foreground leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}
