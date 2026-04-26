import { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext, API } from "../App";
import { toast } from "sonner";
import { Skeleton, LibraryCardSkeleton } from "../components/ui/skeleton";
import {
  NotePencil, Cards, Question, Star, Tag,
  MagnifyingGlass, SquaresFour, Rows, CaretRight,
  TrashSimple, ArrowCounterClockwise, Check, X,
  SortAscending, Article, Sparkle, ClockCounterClockwise,
  SortDescending, Funnel, Eye, ShareNetwork, BookOpen,
  Plus, PencilSimple, DownloadSimple, ArrowSquareOut,
  WarningOctagon, Keyboard, Copy, FolderSimple,
  CaretRight as SubArrow, Sliders, FloppyDisk,
  BookmarkSimple, CalendarBlank,
} from "phosphor-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const TYPE_META = {
  summary:    { label: "Note",       color: "#34c759", grad: "from-emerald-500 to-green-400", Icon: Article  },
  flashcards: { label: "Flashcards", color: "#007aff", grad: "from-blue-500 to-cyan-400",    Icon: Cards    },
  quiz:       { label: "Quiz",       color: "#ff9500", grad: "from-orange-500 to-amber-400", Icon: Question },
  template:   { label: "Visual Map", color: "#af52de", grad: "from-orange-700 to-orange-600",Icon: Sparkle  },
};

const SIDEBAR_FOLDERS = [
  { key: "summary",    label: "My Notes",    color: "#34c759", Icon: NotePencil },
  { key: "flashcards", label: "Flashcards",  color: "#007aff", Icon: Cards      },
  { key: "quiz",       label: "Quizzes",     color: "#ff9500", Icon: Question   },
  { key: "template",   label: "Visual Maps", color: "#af52de", Icon: Sparkle    },
  { key: "starred",    label: "Starred",     color: "#ffcc00", Icon: Star   },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Date Added", Icon: ClockCounterClockwise },
  { value: "name",   label: "Name",       Icon: SortAscending         },
  { value: "type",   label: "Type",       Icon: Funnel                },
];

/* 10-colour tag palette */
const TAG_PALETTE = [
  { bg: "bg-blue-100   dark:bg-blue-900/30",   text: "text-blue-700   dark:text-blue-300",   dot: "bg-blue-500"   },
  { bg: "bg-orange-600/10 dark:bg-orange-600/10", text: "text-orange-400 dark:text-orange-400", dot: "bg-orange-600" },
  { bg: "bg-green-100  dark:bg-green-900/30",  text: "text-green-700  dark:text-green-300",  dot: "bg-green-500"  },
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  { bg: "bg-pink-100   dark:bg-pink-900/30",   text: "text-pink-700   dark:text-pink-300",   dot: "bg-pink-500"   },
  { bg: "bg-cyan-100   dark:bg-cyan-900/30",   text: "text-cyan-700   dark:text-cyan-300",   dot: "bg-cyan-500"   },
  { bg: "bg-red-100    dark:bg-red-900/30",    text: "text-red-700    dark:text-red-300",    dot: "bg-red-500"    },
  { bg: "bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]", text: "text-[var(--accent)]", dot: "bg-[var(--accent)]" },
  { bg: "bg-teal-100   dark:bg-teal-900/30",   text: "text-teal-700   dark:text-teal-300",   dot: "bg-teal-500"   },
  { bg: "bg-orange-600/10 dark:bg-orange-600/10", text: "text-orange-400 dark:text-orange-400", dot: "bg-orange-600" },
];

const LS_VIEW_KEY    = "library-view-mode";
const LS_TAG_REG     = "library-tag-registry";
const LS_PRESETS_KEY = "library-search-presets";

const EMPTY_FILTERS = { types: [], tags: [], dateFrom: "", dateTo: "" };

/* ═══════════════════════════════════════════════════════════════
   PURE HELPERS
═══════════════════════════════════════════════════════════════ */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function getTagStyle(tag, registry) {
  const idx = (registry[tag] ?? 0) % TAG_PALETTE.length;
  return TAG_PALETTE[idx];
}

function sortItems(arr, sort) {
  return [...arr].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "type") return (a.item_type || "").localeCompare(b.item_type || "");
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function fmtDate(d, long = false) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US",
    long ? { month: "long", day: "numeric", year: "numeric" }
         : { month: "short", day: "numeric", year: "numeric" }
  );
}
function itemCount(item) {
  if (item.item_type === "quiz")        return `${item.content?.questions?.length || 0} questions`;
  if (item.item_type === "flashcards")  return `${item.content?.length || 0} cards`;
  if (typeof item.content === "string") return `${item.content.split(/\s+/).filter(Boolean).length} words`;
  return "";
}
function getItemSize(item) {
  try {
    const s = typeof item.content === "string" ? item.content : JSON.stringify(item.content);
    const b = new Blob([s]).size;
    if (b < 1024)        return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  } catch { return "—"; }
}
function exportItem(item) {
  let content = "";
  const slug = item.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  if (typeof item.content === "string") {
    content = item.content;
  } else if (item.item_type === "flashcards" && Array.isArray(item.content)) {
    content = item.content.map((c, i) => `Card ${i+1}\nFront: ${c.front}\nBack:  ${c.back}`).join("\n\n─────\n\n");
  } else if (item.item_type === "quiz" && item.content?.questions) {
    content = item.content.questions.map((q, i) =>
      `Q${i+1}: ${q.question}\n` +
      (q.options||[]).map((o,j) => `  ${String.fromCharCode(65+j)}) ${o}`).join("\n") +
      `\nAnswer: ${String.fromCharCode(65+(q.correct_answer??0))}`
    ).join("\n\n─────\n\n");
  } else { content = JSON.stringify(item.content, null, 2); }
  const blob = new Blob([content], { type:"text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${slug}.txt`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported "${item.title}"`);
}

function createDragGhost(count, title) {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;align-items:center;gap:8px;background:hsl(221,83%,53%);color:#fff;padding:7px 14px;border-radius:20px;font:600 13px/-apple-system,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.35);white-space:nowrap;pointer-events:none;position:fixed;top:-200px;left:0;z-index:99999;";
  el.textContent = count > 1 ? `Moving ${count} items` : title;
  if (count > 1) {
    const b = document.createElement("span");
    b.style.cssText = "background:rgba(255,255,255,0.28);border-radius:10px;padding:1px 7px;font-size:11px;";
    b.textContent = count; el.prepend(b);
  }
  document.body.appendChild(el);
  return el;
}

function itemMatchesQuery(item, query, tags) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const cs = typeof item.content === "string" ? item.content : JSON.stringify(item.content || "");
  return (
    item.title.toLowerCase().includes(q) ||
    cs.toLowerCase().includes(q) ||
    (tags||[]).some(t => t.toLowerCase().includes(q)) ||
    (TYPE_META[item.item_type]?.label||"").toLowerCase().includes(q)
  );
}

/* ═══════════════════════════════════════════════════════════════
   HIGHLIGHT COMPONENT
═══════════════════════════════════════════════════════════════ */
function Highlight({ text, query }) {
  if (!query?.trim() || !text) return <>{text}</>;
  const esc   = escapeRegex(query.trim());
  const regex = new RegExp(`(${esc})`, "gi");
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-200/90 dark:bg-yellow-600/40 text-inherit rounded-[3px] px-[1px] not-italic">{part}</mark>
          : part
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAG CHIP
═══════════════════════════════════════════════════════════════ */
function TagChip({ tag, registry, size = "sm", active, onClick, onRemove, className = "" }) {
  const style = getTagStyle(tag, registry);
  const ringCls = active ? "ring-2 ring-current ring-offset-1" : "";
  return (
    <span
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(tag); } : undefined}
      className={`group inline-flex items-center gap-0.5 font-medium rounded-full whitespace-nowrap transition-opacity
        ${size === "xs" ? "text-[9.5px] px-1.5 py-0" : "text-sm md:text-[11px] px-2 py-0.5"}
        ${style.bg} ${style.text} ${ringCls}
        ${onClick ? "cursor-pointer hover:opacity-75" : "cursor-default"}
        ${className}`}
    >
      {tag}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 rounded-full">
          <X size={size === "xs" ? 7 : 9} weight="bold" />
        </button>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD-TAG INPUT  (typeahead with autocomplete)
═══════════════════════════════════════════════════════════════ */
function AddTagInput({ itemId, existingTags = [], registry, onAdd, onClose }) {
  const [input,   setInput]   = useState("");
  const [open,    setOpen]    = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const allTagNames = Object.keys(registry);
  const suggestions = allTagNames
    .filter(t => !existingTags.includes(t) && (!input.trim() || t.toLowerCase().includes(input.toLowerCase())))
    .slice(0, 8);
  const canCreate = input.trim() && !allTagNames.map(t=>t.toLowerCase()).includes(input.trim().toLowerCase()) && !existingTags.map(t=>t.toLowerCase()).includes(input.trim().toLowerCase());

  const handleAdd = (tag) => {
    const t = tag.trim();
    if (!t || existingTags.includes(t)) return;
    onAdd(itemId, t);
    setInput("");
    inputRef.current?.focus();
  };

  /* next auto-assigned colour */
  const nextColorIdx = Object.keys(registry).length % TAG_PALETTE.length;
  const nextStyle    = TAG_PALETTE[nextColorIdx];

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary/30 bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20">
        <Plus size={11} weight="bold" className="text-muted-foreground/50 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => {
            if (e.key === "Enter"  && input.trim()) { handleAdd(input); }
            if (e.key === "Escape") { onClose(); }
          }}
          placeholder="Search or create tag…"
          className="flex-1 text-sm md:text-[12px] bg-transparent focus:outline-none placeholder:text-muted-foreground/40 min-w-0"
        />
        <button onClick={onClose} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <X size={11} weight="bold" />
        </button>
      </div>

      <AnimatePresence>
        {open && (suggestions.length > 0 || canCreate) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
          >
            {suggestions.map(tag => {
              const s = getTagStyle(tag, registry);
              return (
                <button key={tag} onMouseDown={() => handleAdd(tag)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors text-left">
                  <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                  <span className="flex-1 text-[12.5px]">{tag}</span>
                  <span className="text-sm md:text-[10px] text-muted-foreground/45">existing</span>
                </button>
              );
            })}
            {canCreate && (
              <button onMouseDown={() => handleAdd(input)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors text-left">
                <span className={`w-2 h-2 rounded-full ${nextStyle.dot} shrink-0`} />
                <span className="flex-1 text-[12.5px]">
                  Create <strong className={`font-semibold ${nextStyle.text.split(" ")[0]}`}>"{input}"</strong>
                </span>
                <span className="text-sm md:text-[10px] text-muted-foreground/45">new tag</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PANEL
═══════════════════════════════════════════════════════════════ */
function FilterPanel({ filters, onChange, registry, tagCounts, onClose, presets, onSavePreset, onLoadPreset, onDeletePreset, hasActiveSearch }) {
  const ref           = useRef(null);
  const [presetName,  setPresetName]  = useState("");
  const [savingPre,   setSavingPre]   = useState(false);
  const [activeTab,   setActiveTab]   = useState("filters"); // "filters" | "presets"
  const hasFilters = filters.types.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const toggleType = (t) => onChange(p => ({ ...p, types: p.types.includes(t) ? p.types.filter(x=>x!==t) : [...p.types,t] }));
  const toggleTag  = (t) => onChange(p => ({ ...p, tags:  p.tags.includes(t)  ? p.tags.filter(x=>x!==t)  : [...p.tags, t]  }));

  const Checkbox = ({ checked, onClick, label, count, dot }) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors text-[12.5px] ${checked ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/75"}`}>
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-border"}`}>
        {checked && <Check size={9} weight="bold" className="text-primary-foreground" />}
      </span>
      {dot && <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />}
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-sm md:text-[10px] text-muted-foreground/50 tabular-nums">{count}</span>}
    </button>
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: 280 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {[["filters", Sliders, "Filters"], ["presets", BookmarkSimple, "Saved"]].map(([k, Ico, lbl]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm md:text-[12px] font-medium transition-colors ${activeTab===k ? "bg-muted/40 text-foreground border-b-2 border-primary" : "text-muted-foreground/60 hover:text-foreground"}`}>
            <Ico size={13} />{lbl}
            {k === "filters" && hasFilters && <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{filters.types.length+filters.tags.length+(filters.dateFrom?1:0)+(filters.dateTo?1:0)}</span>}
            {k === "presets" && presets.length > 0 && <span className="text-sm md:text-[10px] text-muted-foreground/50">{presets.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === "filters" && (
        <div className="p-3 space-y-4 max-h-[420px] overflow-y-auto">
          {/* Type filter */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/45 mb-1.5 px-1">Content Type</p>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <Checkbox key={k} checked={filters.types.includes(k)} onClick={() => toggleType(k)} label={m.label} />
            ))}
          </div>

          {/* Date range */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/45 mb-1.5 px-1 flex items-center gap-1">
              <CalendarBlank size={11} /> Date Range
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[["dateFrom","From"],["dateTo","To"]].map(([field,lbl]) => (
                <div key={field}>
                  <p className="text-sm md:text-[10px] text-muted-foreground/50 mb-0.5 px-1">{lbl}</p>
                  <input type="date" value={filters[field]}
                    onChange={e => onChange(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full text-sm md:text-[11px] px-2 py-1.5 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground/80" />
                </div>
              ))}
            </div>
          </div>

          {/* Tag filter */}
          {Object.keys(registry).length > 0 && (
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/45 mb-1.5 px-1">Tags</p>
              {Object.keys(registry).slice(0, 12).map(tag => {
                const s = getTagStyle(tag, registry);
                return (
                  <Checkbox key={tag} checked={filters.tags.includes(tag)} onClick={() => toggleTag(tag)}
                    label={tag} count={tagCounts[tag] || 0} dot={s.dot} />
                );
              })}
            </div>
          )}

          {/* Clear */}
          {hasFilters && (
            <button onClick={() => onChange(EMPTY_FILTERS)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm md:text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X size={12} weight="bold" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {activeTab === "presets" && (
        <div className="p-3 space-y-2">
          {presets.length === 0 && (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <BookmarkSimple size={24} weight="duotone" className="text-muted-foreground/25" />
              <p className="text-sm md:text-[12px] text-muted-foreground/55">No saved searches yet</p>
            </div>
          )}
          {presets.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 group transition-colors">
              <button onClick={() => { onLoadPreset(p); onClose(); }} className="flex-1 text-left">
                <p className="text-[12.5px] font-medium">{p.name}</p>
                <p className="text-[10.5px] text-muted-foreground/55 truncate">
                  {p.search && `"${p.search}"`}
                  {p.filters.types.length > 0 && ` · ${p.filters.types.join(",")} `}
                  {p.filters.tags.length  > 0 && ` · ${p.filters.tags.join(",")} `}
                </p>
              </button>
              <button onClick={() => onDeletePreset(p.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all">
                <X size={12} weight="bold" />
              </button>
            </div>
          ))}

          {/* Save current */}
          {hasActiveSearch && (
            <div className="border-t border-border pt-2 mt-2">
              {savingPre ? (
                <div className="flex gap-1.5">
                  <input autoFocus value={presetName} onChange={e => setPresetName(e.target.value)}
                    placeholder="Preset name…"
                    onKeyDown={e => { if (e.key==="Enter"&&presetName.trim()){ onSavePreset(presetName.trim()); setPresetName(""); setSavingPre(false); } if(e.key==="Escape") setSavingPre(false); }}
                    className="flex-1 text-sm md:text-[12px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  <button onClick={() => { if(presetName.trim()){ onSavePreset(presetName.trim()); setPresetName(""); setSavingPre(false); }}}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm md:text-[12px] font-medium hover:bg-primary/90 transition-colors">Save</button>
                </div>
              ) : (
                <button onClick={() => setSavingPre(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border text-sm md:text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <FloppyDisk size={13} /> Save current search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THUMBNAILS
═══════════════════════════════════════════════════════════════ */
function DocumentThumb({ content, color }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: color + "0d" }}>
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: color + "55" }} />
      <div className="absolute inset-0 p-3 pl-4 flex flex-col gap-1.5 pt-3.5">
        <div className="h-[7px] rounded-full" style={{ width: "66%", background: color + "65" }} />
        {[90, 76, 85, 60, 78, 52].map((w, i) => <div key={i} className="h-[5px] rounded-full bg-foreground/[0.07]" style={{ width: `${w}%` }} />)}
        {typeof content === "string" && content && (
          <p className="absolute bottom-2 left-4 right-3 text-[9px] leading-tight line-clamp-2 font-mono" style={{ color: color + "99" }}>{content.slice(0, 60)}</p>
        )}
      </div>
    </div>
  );
}
function QuizThumb({ content, color, Icon }) {
  const qs = content?.questions || [], shown = Math.min(qs.length, 6);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: color + "0d" }}>
      <Icon size={28} weight="duotone" style={{ color }} />
      {shown > 0 && (
        <div className="flex flex-wrap gap-1 justify-center px-3">
          {Array.from({ length: shown }).map((_, i) => <div key={i} className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: color+"28", color }}>{i+1}</div>)}
          {qs.length > 6 && <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: color+"14", color: color+"90" }}>+{qs.length-6}</div>}
        </div>
      )}
    </div>
  );
}
function FlashcardThumb({ content, color }) {
  const first = Array.isArray(content) ? content[0] : null;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: color + "0d" }}>
      <div className="relative w-[76px] h-[50px]">
        <div className="absolute inset-0 rounded-lg border" style={{ transform: "rotate(5deg) translate(4px,3px)", borderColor: color+"38", background: color+"18" }} />
        <div className="absolute inset-0 rounded-lg border" style={{ transform: "rotate(2deg) translate(2px,1px)", borderColor: color+"58", background: color+"26" }} />
        <div className="absolute inset-0 rounded-lg border flex items-center justify-center p-1.5" style={{ borderColor: color+"78", background: "hsl(var(--card))" }}>
          {first?.front ? <p className="text-[7.5px] text-center leading-tight line-clamp-3" style={{ color: color+"cc" }}>{first.front.slice(0,45)}</p> : <Cards size={16} weight="fill" style={{ color }} />}
        </div>
      </div>
    </div>
  );
}
function CardThumbnail({ item }) {
  const meta = TYPE_META[item.item_type] || TYPE_META.summary, Icon = meta.Icon;
  return (
    <div className="w-full h-full">
      {item.item_type === "quiz"       && <QuizThumb      content={item.content} color={meta.color} Icon={Icon} />}
      {item.item_type === "flashcards" && <FlashcardThumb content={item.content} color={meta.color} />}
      {(item.item_type==="summary"||item.item_type==="template") && <DocumentThumb content={item.content} color={meta.color} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════════════════════════ */
function ContextMenu({ menu, onClose, actions }) {
  const ref = useRef(null);
  const [showMoveSub, setShowMoveSub] = useState(false);
  const subTimeout = useRef(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });

  useEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({ left: menu.x+width>window.innerWidth-8?menu.x-width:menu.x, top: menu.y+height>window.innerHeight-8?menu.y-height:menu.y });
  }, [menu.x, menu.y]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const Divider = () => <div className="my-0.5 border-t border-border/60" />;
  const Item = ({ icon: Icon, label, shortcut, onClick: fn, danger, hasSubmenu }) => (
    <button onClick={() => { fn?.(); if (!hasSubmenu) onClose(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] transition-colors rounded-lg mx-0.5 ${danger?"text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20":"hover:bg-muted text-foreground/80"}`}>
      {Icon && <Icon size={14} weight="fill" className="shrink-0" />}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <kbd className="text-sm md:text-[10px] text-muted-foreground/50 font-mono bg-muted/50 px-1 rounded">{shortcut}</kbd>}
      {hasSubmenu && <SubArrow size={11} className="text-muted-foreground/50" />}
    </button>
  );

  return (
    <motion.div ref={ref} initial={{ opacity:0,scale:0.94,y:-4 }} animate={{ opacity:1,scale:1,y:0 }}
      exit={{ opacity:0,scale:0.94,y:-4 }} transition={{ duration:0.1 }}
      style={{ position:"fixed", left:pos.left, top:pos.top, zIndex:9999, minWidth:210 }}
      className="bg-popover border border-border rounded-xl shadow-2xl overflow-visible py-1.5"
      onClick={e => e.stopPropagation()}>
      {menu.count > 1 && <div className="px-3 py-1.5 mb-0.5 border-b border-border/60"><p className="text-sm md:text-[11px] font-semibold text-muted-foreground/60">{menu.count} items selected</p></div>}
      <Item icon={Eye}         label="Open"           shortcut="↩" onClick={actions.onOpen} />
      {menu.count === 1 && <Item icon={PencilSimple} label="Rename" shortcut="↵" onClick={actions.onRename} />}
      <Divider />
      <div className="relative"
        onMouseEnter={() => { clearTimeout(subTimeout.current); setShowMoveSub(true); }}
        onMouseLeave={() => { subTimeout.current = setTimeout(() => setShowMoveSub(false), 200); }}>
        <Item icon={FolderSimple} label="Move to Folder" hasSubmenu />
        <AnimatePresence>
          {showMoveSub && (
            <motion.div initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-6 }} transition={{ duration:0.1 }}
              className="absolute left-full top-0 ml-1 bg-popover border border-border rounded-xl shadow-2xl py-1.5" style={{ minWidth:170 }}
              onMouseEnter={() => clearTimeout(subTimeout.current)}
              onMouseLeave={() => { subTimeout.current = setTimeout(() => setShowMoveSub(false), 200); }}>
              {SIDEBAR_FOLDERS.map(f => (
                <button key={f.key} onClick={() => { actions.onMoveToFolder(f.key); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] hover:bg-muted text-foreground/80 transition-colors rounded-lg mx-0.5">
                  <f.Icon size={14} weight="fill" style={{ color: f.color }} />{f.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Item icon={Star}    label="Add to Favourites" onClick={actions.onFavourite} />
      <Item icon={Tag}         label="Add Tag…"           onClick={actions.onAddTag} />
      <Divider />
      <Item icon={Copy}        label="Duplicate"  shortcut="⌘D" onClick={actions.onDuplicate} />
      <Divider />
      <Item icon={TrashSimple} label="Delete"     shortcut="⌫"  onClick={actions.onDelete} danger />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINDER SIDEBAR  (with interactive tag management)
═══════════════════════════════════════════════════════════════ */
function SidebarSection({ icon: Icon, label, count, color, active, onClick, children, defaultOpen=true, isDragOver, onDragOver, onDragLeave, onDrop }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-0.5">
      <div
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all group ${isDragOver?"bg-primary/15 ring-2 ring-primary/30 scale-[1.02]":active&&!children?"bg-primary/10 text-primary":"hover:bg-muted/60 text-foreground/70"}`}
        onClick={() => (children ? setOpen(!open) : onClick?.())}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      >
        {children && <motion.span animate={{ rotate: open?90:0 }} transition={{ duration:0.16 }} className="text-muted-foreground/50 group-hover:text-muted-foreground"><CaretRight size={11} weight="bold" /></motion.span>}
        {Icon && <Icon size={16} weight="fill" style={{ color }} className="shrink-0" />}
        <span className={`text-sm md:text-[13px] font-medium flex-1 truncate ${isDragOver?"text-primary font-semibold":""}`}>{label}</span>
        {isDragOver && <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="text-sm md:text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">Drop</motion.span>}
        {!isDragOver && count !== undefined && <span className="text-sm md:text-[11px] text-muted-foreground/60 tabular-nums">{count}</span>}
      </div>
      <AnimatePresence initial={false}>
        {children && open && (
          <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.18 }} className="overflow-hidden pl-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinderSidebar({ activeFolder, onFolderChange, counts, dragOverFolder, onFolderDragOver, onFolderDragLeave, onFolderDrop, registry, tagCounts, activeTag, onTagClick, onTagRename, onTagDelete }) {
  const [renamingTag, setRenamingTag] = useState(null);
  const [renameVal,   setRenameVal]   = useState("");
  const allTags = Object.keys(registry);

  const commitRename = (oldTag) => {
    const newTag = renameVal.trim();
    if (newTag && newTag !== oldTag) onTagRename(oldTag, newTag);
    setRenamingTag(null);
  };

  return (
    <div className="h-full overflow-y-auto px-2 py-4 space-y-4">
      <div>
        <p className="px-3 mb-1 text-sm md:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Library</p>
        <SidebarSection icon={SquaresFour} label="All Items" count={counts.all} color="#6e6e73"
          active={activeFolder==="all"} onClick={() => onFolderChange("all")} />
        {SIDEBAR_FOLDERS.filter(f => f.key !== "starred").map(f => (
          <SidebarSection key={f.key} icon={f.Icon} label={f.label} count={counts[f.key]??0} color={f.color}
            active={activeFolder===f.key} onClick={() => onFolderChange(f.key)}
            isDragOver={dragOverFolder===f.key}
            onDragOver={e => { e.preventDefault(); onFolderDragOver(f.key); }}
            onDragLeave={onFolderDragLeave}
            onDrop={e => onFolderDrop(e, f.key)} />
        ))}
      </div>

      <div>
        <p className="px-3 mb-1 text-sm md:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Favourites</p>
        <SidebarSection icon={Star} label="Starred" count={counts.starred??0} color="#ffcc00"
          active={activeFolder==="starred"} onClick={() => onFolderChange("starred")}
          isDragOver={dragOverFolder==="starred"}
          onDragOver={e => { e.preventDefault(); onFolderDragOver("starred"); }}
          onDragLeave={onFolderDragLeave}
          onDrop={e => onFolderDrop(e,"starred")} />
      </div>

      <div>
        <p className="px-3 mb-1 text-sm md:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Tags</p>
        {allTags.length === 0 ? (
          <p className="px-3 py-2 text-[11.5px] text-muted-foreground/40 italic">No tags yet</p>
        ) : (
          <div className="space-y-0.5">
            {allTags.map(tag => {
              const style   = getTagStyle(tag, registry);
              const isActive = activeTag === tag;
              const isRenaming = renamingTag === tag;
              return (
                <div key={tag}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer group transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground/70"}`}
                  onClick={() => { if (!isRenaming) onTagClick(tag); }}>
                  <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`} />
                  {isRenaming ? (
                    <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key==="Enter") commitRename(tag); if (e.key==="Escape") setRenamingTag(null); }}
                      onBlur={() => commitRename(tag)}
                      className="flex-1 text-[12.5px] bg-muted/50 border border-primary/30 rounded-md px-1 py-0.5 focus:outline-none" />
                  ) : (
                    <span className="flex-1 text-[12.5px] font-medium truncate">{tag}</span>
                  )}
                  <span className="text-[10.5px] text-muted-foreground/50 tabular-nums group-hover:hidden">{tagCounts[tag]||0}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); setRenamingTag(tag); setRenameVal(tag); }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted-foreground/20 transition-colors" title="Rename">
                      <PencilSimple size={11} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onTagDelete(tag); }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors" title="Delete tag">
                      <X size={11} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GRID CARD  (draggable + multi-select + rename + tags + highlight)
═══════════════════════════════════════════════════════════════ */
function GridCard({ item, tags, registry, search, isSelected, isMultiSelected, isDragging, renamingId, onClick, onOpen, onDelete, onShare, onHover, onContextMenu, onDragStart, onDragEnd, onRenameCommit, onTagClick }) {
  const meta = TYPE_META[item.item_type] || TYPE_META.summary;
  const renaming = renamingId === item.item_id;
  const [renameVal, setRenameVal] = useState(item.title);
  const renameRef = useRef(null);
  useEffect(() => { if (renaming) { setRenameVal(item.title); setTimeout(() => renameRef.current?.select(), 30); } }, [renaming, item.title]);

  const visibleTags = (tags||[]).slice(0, 2);
  const extraTags   = (tags||[]).length - 2;

  return (
    <motion.div layout layoutId={`card-${item.item_id}`}
      initial={{ opacity:0,scale:0.94,y:8 }} animate={{ opacity:1,scale:1,y:0 }}
      exit={{ opacity:0,scale:0.92,y:-6 }} transition={{ duration:0.22,ease:"easeOut" }}
      whileHover={!isDragging?{ y:-4, boxShadow:"0 14px 44px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.06)", transition:{duration:0.18} }:{}}
      draggable onDragStart={e=>onDragStart(e,item)} onDragEnd={onDragEnd}
      onClick={onClick} onDoubleClick={onOpen}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e,item); }}
      onMouseEnter={() => onHover(item)} onMouseLeave={() => onHover(null)}
      className={`group relative rounded-2xl border cursor-pointer overflow-hidden select-none transition-colors ${isDragging?"opacity-50 scale-95 border-primary/40":isMultiSelected?"border-primary/50 ring-2 ring-primary/25 bg-primary/5 shadow-md":isSelected?"border-primary/50 ring-2 ring-primary/20 shadow-md":"border-border bg-card hover:border-border/70"}`}
      style={isDragging||isMultiSelected||isSelected?{}:{ boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      {isMultiSelected && (
        <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Check size={11} weight="bold" className="text-primary-foreground" />
        </div>
      )}
      {/* Thumbnail */}
      <div className="relative h-[116px] overflow-hidden rounded-t-2xl">
        <CardThumbnail item={item} />
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background:"rgba(0,0,0,0.40)", backdropFilter:"blur(2px)" }}>
          {[
            { Icon:Eye,          fn:e=>{ e.stopPropagation(); onClick(e); } },
            { Icon:ShareNetwork, fn:e=>{ e.stopPropagation(); onShare(); } },
            { Icon:TrashSimple,  fn:e=>{ e.stopPropagation(); onDelete(item.item_id); }, red:true },
          ].map(({ Icon, fn, red }, i) => (
            <motion.button key={i} whileHover={{ scale:1.14 }} whileTap={{ scale:0.9 }} onClick={fn}
              className={`w-8 h-8 rounded-full bg-[var(--va-card)] flex items-center justify-center shadow-rest transition-colors ${red?"text-red-400 hover:bg-red-500/20 hover:text-red-400":"text-foreground hover:bg-[var(--va-surface)]"}`}>
              <Icon size={14} weight="fill" />
            </motion.button>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-2.5 bg-card">
        {renaming ? (
          <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if(e.key==="Enter"){e.stopPropagation();onRenameCommit(item.item_id,renameVal);} if(e.key==="Escape"){e.stopPropagation();onRenameCommit(item.item_id,null);} }}
            onBlur={() => onRenameCommit(item.item_id,renameVal)}
            className="w-full text-[12.5px] font-semibold bg-muted/50 border border-primary/30 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30 mb-1" />
        ) : (
          <p className="text-[12.5px] font-semibold truncate leading-snug mb-1">
            <Highlight text={item.title} query={search} />
          </p>
        )}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ background:meta.color+"1a", color:meta.color }}>{meta.label}</span>
          <span className="text-[10.5px] text-muted-foreground/55 tabular-nums shrink-0">{fmtDate(item.created_at)}</span>
        </div>
        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
            {visibleTags.map(t => (
              <TagChip key={t} tag={t} registry={registry} size="xs" onClick={() => onTagClick(t)} />
            ))}
            {extraTags > 0 && (
              <span className="text-[9.5px] text-muted-foreground/50 px-1 py-0.5">+{extraTags}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIST ROW  (draggable + multi-select + rename + tags + highlight)
═══════════════════════════════════════════════════════════════ */
function ListRow({ item, index, tags, registry, search, isSelected, isMultiSelected, isDragging, renamingId, onClick, onOpen, onDelete, onShare, onHover, onContextMenu, onDragStart, onDragEnd, onRenameCommit, onTagClick }) {
  const meta = TYPE_META[item.item_type] || TYPE_META.summary, Icon = meta.Icon;
  const isEven = index % 2 === 0;
  const renaming = renamingId === item.item_id;
  const [renameVal, setRenameVal] = useState(item.title);
  const renameRef = useRef(null);
  useEffect(() => { if (renaming) { setRenameVal(item.title); setTimeout(() => renameRef.current?.select(), 30); } }, [renaming, item.title]);

  return (
    <motion.div layout layoutId={`row-${item.item_id}`}
      initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-8 }}
      transition={{ duration:0.18, delay:index*0.022 }}
      draggable onDragStart={e=>onDragStart(e,item)} onDragEnd={onDragEnd}
      onClick={onClick} onDoubleClick={onOpen}
      onContextMenu={e=>{ e.preventDefault(); onContextMenu(e,item); }}
      onMouseEnter={() => onHover(item)} onMouseLeave={() => onHover(null)}
      title="Double-click to open"
      className={`group flex items-center cursor-pointer rounded-lg transition-all border ${isDragging?"opacity-50 scale-95 border-primary/40":isMultiSelected?"bg-primary/12 border-primary/30 shadow-sm ring-1 ring-primary/20":isSelected?"bg-primary/10 border-primary/25 shadow-sm":isEven?"bg-muted/20 border-transparent hover:bg-muted/50 hover:border-border/40":"bg-transparent border-transparent hover:bg-muted/50 hover:border-border/40"}`}>
      <div className="w-8 flex items-center justify-center py-2.5 pl-2 shrink-0">
        {isMultiSelected ? (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check size={10} weight="bold" className="text-primary-foreground" /></div>
        ) : (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:meta.color+"1e" }}><Icon size={14} weight="fill" style={{ color:meta.color }} /></div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-2.5 px-2">
        {renaming ? (
          <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if(e.key==="Enter"){e.stopPropagation();onRenameCommit(item.item_id,renameVal);} if(e.key==="Escape"){e.stopPropagation();onRenameCommit(item.item_id,null);} }}
            onBlur={() => onRenameCommit(item.item_id,renameVal)}
            className="w-full text-sm md:text-[13px] font-medium bg-muted/50 border border-primary/30 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30" />
        ) : (
          <p className="text-sm md:text-[13px] font-medium truncate"><Highlight text={item.title} query={search} /></p>
        )}
        <p className="text-sm md:text-[11px] text-muted-foreground/55 truncate">{itemCount(item)}</p>
      </div>
      <div className="w-28 py-2.5 px-2 shrink-0">
        <span className="inline-flex text-sm md:text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background:meta.color+"18", color:meta.color }}>{meta.label}</span>
      </div>
      <div className="w-32 py-2.5 px-2 shrink-0">
        <span className="text-sm md:text-[12px] text-muted-foreground tabular-nums">{fmtDate(item.created_at)}</span>
      </div>
      {/* Tags column */}
      <div className="w-28 py-2.5 px-2 shrink-0 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
        {(tags||[]).slice(0,2).map(t => <TagChip key={t} tag={t} registry={registry} size="xs" onClick={() => onTagClick(t)} />)}
        {(tags||[]).length > 2 && <span className="text-[9.5px] text-muted-foreground/50">+{(tags||[]).length-2}</span>}
      </div>
      <div className="w-24 py-2.5 pr-3 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {[
          { Icon:Eye,          fn:e=>{ e.stopPropagation(); onOpen(); }, cls:"hover:text-primary hover:bg-primary/15" },
          { Icon:ShareNetwork, fn:e=>{ e.stopPropagation(); onShare(); }, cls:"hover:text-blue-500 hover:bg-blue-500/15" },
          { Icon:TrashSimple,  fn:e=>{ e.stopPropagation(); onDelete(item.item_id); }, cls:"hover:text-red-500 hover:bg-red-500/15" },
        ].map(({ Icon, fn, cls }, i) => (
          <motion.button key={i} whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }} onClick={fn}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground transition-colors ${cls}`}>
            <Icon size={13} weight="fill" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════ */
function EmptyState({ isFiltered, search, hasActiveFilters, onClearFilters }) {
  if (search || hasActiveFilters) return (
    <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
      className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <MagnifyingGlass size={28} weight="duotone" className="text-muted-foreground/30" />
      </div>
      <p className="text-[14px] font-semibold text-foreground/70">
        {search ? `No results for "${search}"` : "No items match these filters"}
      </p>
      <p className="text-sm md:text-[12px] text-muted-foreground/55">Try adjusting your search or filters.</p>
      {(search || hasActiveFilters) && (
        <button onClick={onClearFilters} className="text-sm md:text-[12px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1 mt-1">
          <X size={12} weight="bold" /> Clear filters
        </button>
      )}
    </motion.div>
  );
  if (isFiltered) return (
    <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
      className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center"><BookOpen size={28} weight="duotone" className="text-muted-foreground/30" /></div>
      <p className="text-[14px] font-semibold text-foreground/70">This folder is empty</p>
      <p className="text-sm md:text-[12px] text-muted-foreground/55 max-w-[200px]">Drag items here or save from Study Hub.</p>
    </motion.div>
  );
  return (
    <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
      className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><BookOpen size={36} weight="duotone" className="text-primary/55" /></div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"><Plus size={14} weight="bold" className="text-primary-foreground" /></div>
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-1">No items yet</p>
        <p className="text-sm md:text-[12px] text-muted-foreground/65 max-w-[220px] leading-relaxed">
          Create your first note, quiz, or flashcard in <span className="font-semibold text-primary">Study Hub</span> and save it here!
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FULL VIEW MODAL
═══════════════════════════════════════════════════════════════ */
function FullViewModal({ item, onClose }) {
  const [q, setQ] = useState(0), [ans, setAns] = useState(null), [show, setShow] = useState(false);
  const [score, setScore] = useState(0), [card, setCard] = useState(0), [flip, setFlip] = useState(false);
  const meta = TYPE_META[item.item_type] || TYPE_META.summary, Icon = meta.Icon;
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const handleAnswer = (idx) => {
    if (show) return; setAns(idx); setShow(true);
    if (idx === item.content.questions[q]?.correct_answer) setScore(s => s+1);
  };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ scale:0.94,opacity:0,y:12 }} animate={{ scale:1,opacity:1,y:0 }}
        exit={{ scale:0.94,opacity:0,y:12 }} transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center shrink-0`}><Icon size={18} weight="duotone" className="text-[var(--text-primary)]" /></div>
          <div className="flex-1 min-w-0"><p className="text-[14px] font-semibold truncate">{item.title}</p><p className="text-sm md:text-[11px] text-muted-foreground/60">{meta.label} · {itemCount(item)}</p></div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"><X size={13} weight="bold" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {(item.item_type==="summary"||item.item_type==="template") && (
            <pre className="whitespace-pre-wrap text-sm md:text-[13px] leading-relaxed font-sans text-foreground/80 bg-muted/25 rounded-xl p-4 overflow-auto">
              {typeof item.content==="string" ? item.content : JSON.stringify(item.content,null,2)}
            </pre>
          )}
          {item.item_type==="quiz" && item.content?.questions?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm md:text-[11px] uppercase font-bold tracking-wider text-muted-foreground/50">Question {q+1} / {item.content.questions.length}</p>
                <span className="text-sm md:text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background:"#34c75920",color:"#34c759" }}>Score: {score}/{item.content.questions.length}</span>
              </div>
              <p className="text-[15px] font-medium leading-snug">{item.content.questions[q]?.question}</p>
              <div className="space-y-2">
                {item.content.questions[q]?.options?.map((opt, idx) => {
                  const isC=idx===item.content.questions[q].correct_answer, isS=idx===ans;
                  return (
                    <button key={idx} onClick={() => handleAnswer(idx)} disabled={show}
                      className={`w-full text-left rounded-xl px-4 py-3 text-sm md:text-[13px] transition-all border-2 flex items-center gap-3 ${show?isC?"bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200":isS?"bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200":"bg-muted border-transparent text-muted-foreground":"bg-muted border-transparent hover:border-primary/30 hover:bg-primary/5"}`}>
                      <span className="w-6 h-6 rounded-full bg-background/60 flex items-center justify-center text-sm md:text-[10px] font-bold shrink-0">{String.fromCharCode(65+idx)}</span>
                      <span className="flex-1">{opt}</span>
                      {show && isC && <Check size={14} weight="bold" className="text-green-600 shrink-0" />}
                      {show && isS && !isC && <X size={14} weight="bold" className="text-red-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { setQ(n=>Math.max(0,n-1)); setAns(null); setShow(false); }} disabled={q===0} className="flex items-center gap-1 text-sm md:text-[12px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
                {q===item.content.questions.length-1 ? (
                  <button onClick={() => { setQ(0); setAns(null); setShow(false); setScore(0); }} className="flex items-center gap-1 text-sm md:text-[12px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"><ArrowCounterClockwise size={13} /> Restart</button>
                ) : (
                  <button onClick={() => { setQ(n=>n+1); setAns(null); setShow(false); }} disabled={!show} className="flex items-center gap-1 text-sm md:text-[12px] px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40">Next <ChevronRight size={14} /></button>
                )}
              </div>
            </div>
          )}
          {item.item_type==="flashcards" && item.content?.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm md:text-[11px] uppercase font-bold tracking-wider text-muted-foreground/50">Card {card+1} / {item.content.length}</p>
              <div className="relative h-52 cursor-pointer rounded-2xl overflow-hidden" style={{ perspective:"900px" }} onClick={() => setFlip(f=>!f)}>
                <motion.div className="absolute inset-0 rounded-2xl flex items-center justify-center p-6 text-center text-[15px] font-medium"
                  style={{ background:flip?"hsl(var(--secondary))":meta.color+"1a", color:flip?"hsl(var(--secondary-foreground))":meta.color, border:`2px solid ${meta.color}30` }}
                  animate={{ rotateY:flip?180:0 }} transition={{ duration:0.35 }}>
                  <p style={{ transform:flip?"rotateY(180deg)":"none" }}>{flip?item.content[card]?.back:item.content[card]?.front}</p>
                </motion.div>
              </div>
              <p className="text-sm md:text-[11px] text-center text-muted-foreground/50">Click card to flip</p>
              <div className="flex items-center justify-between">
                <button onClick={() => { setCard(c=>Math.max(0,c-1)); setFlip(false); }} disabled={card===0} className="flex items-center gap-1 text-sm md:text-[13px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
                <button onClick={() => { setCard(0); setFlip(false); }} className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"><ArrowCounterClockwise size={15} /></button>
                <button onClick={() => { setCard(c=>Math.min(item.content.length-1,c+1)); setFlip(false); }} disabled={card===item.content.length-1} className="flex items-center gap-1 text-sm md:text-[13px] px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40">Next <ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK LOOK PANEL
═══════════════════════════════════════════════════════════════ */
function QuickLookPanel({ item, selectedCount, tags, registry, onClose, onDelete, onShare, onExport, onOpen, onAddTag, onRemoveTag }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle,   setLocalTitle]   = useState(item?.title||"");
  const [addingTag,    setAddingTag]     = useState(false);
  const [confirmDel,   setConfirmDel]    = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    setLocalTitle(item.title); setEditingTitle(false); setConfirmDel(false); setAddingTag(false);
  }, [item]);
  useEffect(() => { if (editingTitle) titleRef.current?.select(); }, [editingTitle]);

  if (!item) {
    if (selectedCount > 1) return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Check size={24} weight="bold" className="text-primary/60" /></div>
        <p className="text-sm md:text-[13px] font-semibold text-foreground/70">{selectedCount} items selected</p>
        <p className="text-sm md:text-[11px] text-muted-foreground/50">Right-click for bulk actions</p>
      </div>
    );
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center"><Eye size={24} weight="duotone" className="text-muted-foreground/30" /></div>
        <p className="text-sm md:text-[13px] font-medium text-muted-foreground/70">Select an item</p>
        <p className="text-sm md:text-[11px] text-muted-foreground/50 max-w-[160px] leading-relaxed">Click any item to preview it here</p>
        <div className="flex items-center gap-1.5 text-muted-foreground/35 mt-2"><Keyboard size={11} /><span className="text-sm md:text-[10px]"><kbd className="font-mono bg-muted/50 px-1 rounded text-[9px]">Space</kbd> quick look</span></div>
      </div>
    );
  }

  const meta = TYPE_META[item.item_type] || TYPE_META.summary, Icon = meta.Icon;
  const chipTags = tags || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border shrink-0">
        <div className="flex items-start gap-2">
          {editingTitle ? (
            <input ref={titleRef} value={localTitle} onChange={e => setLocalTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => { if(e.key==="Enter"||e.key==="Escape") setEditingTitle(false); }}
              className="flex-1 text-[14px] font-semibold bg-muted/50 rounded-lg px-2 py-1 border border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20 leading-tight" />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="flex-1 text-left text-[14px] font-semibold leading-tight group px-2 py-1 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
              {localTitle}<PencilSimple size={11} weight="fill" className="inline ml-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <button onClick={onClose} className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors shrink-0">
            <X size={11} weight="bold" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Thumbnail */}
        <div className="h-[148px] overflow-hidden relative border-b border-border/50">
          <CardThumbnail item={item} />
          <div className="absolute top-2.5 left-3">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ background:meta.color+"ee", color:"#fff" }}>
              <Icon size={10} weight="fill" />{meta.label}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-4 py-3.5 border-b border-border/50">
          <p className="text-sm md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground/45 mb-2.5">Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
            {[
              { k:"Type",     v:<span style={{ color:meta.color }} className="font-semibold">{meta.label}</span> },
              { k:"Size",     v:getItemSize(item) },
              { k:"Created",  v:fmtDate(item.created_at) },
              { k:"Modified", v:fmtDate(item.updated_at||item.created_at) },
            ].map(({ k, v }) => (
              <div key={k}><p className="text-[9.5px] text-muted-foreground/45 uppercase font-semibold tracking-wider mb-0.5">{k}</p><p className="text-sm md:text-[12px]">{v}</p></div>
            ))}
          </div>
        </div>

        {/* Tags – using AddTagInput for rich creation */}
        <div className="px-4 py-3.5 border-b border-border/50">
          <p className="text-sm md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground/45 mb-2.5">Tags</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {chipTags.map((tag, i) => (
              <TagChip key={tag} tag={tag} registry={registry} onRemove={() => onRemoveTag(item.item_id, tag)} />
            ))}
          </div>
          {addingTag ? (
            <AddTagInput itemId={item.item_id} existingTags={chipTags} registry={registry}
              onAdd={onAddTag} onClose={() => setAddingTag(false)} />
          ) : (
            <button onClick={() => setAddingTag(true)}
              className="flex items-center gap-1 text-sm md:text-[11px] text-muted-foreground/50 px-2 py-0.5 rounded-full border border-dashed border-border/60 hover:border-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <Plus size={10} weight="bold" /> Add tag
            </button>
          )}
        </div>

        {/* Content preview */}
        <div className="px-4 py-3.5">
          <p className="text-sm md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground/45 mb-2.5">Preview</p>
          {(item.item_type==="summary"||item.item_type==="template") && (
            <div className="space-y-1.5">
              <p className="text-sm md:text-[12px] leading-relaxed text-foreground/70 whitespace-pre-wrap line-clamp-[12] bg-muted/25 rounded-xl p-3">
                {typeof item.content==="string" ? item.content.slice(0,500)+(item.content.length>500?"…":"") : "No content"}
              </p>
              {typeof item.content==="string" && item.content.length > 500 && (
                <button onClick={onOpen} className="text-sm md:text-[11px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1"><ArrowSquareOut size={11} /> Read full content</button>
              )}
            </div>
          )}
          {item.item_type==="flashcards" && (
            <div className="space-y-2">
              {(Array.isArray(item.content)?item.content:[]).slice(0,3).map((card,i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 border-b border-border/50"><span className="text-[9.5px] text-muted-foreground/50 font-bold uppercase tracking-wider">Front</span><p className="text-sm md:text-[12px] font-medium mt-0.5 leading-snug">{card.front}</p></div>
                  <div className="px-3 py-2"><span className="text-[9.5px] text-muted-foreground/50 font-bold uppercase tracking-wider">Back</span><p className="text-[11.5px] text-muted-foreground/70 mt-0.5 leading-snug">{card.back}</p></div>
                </div>
              ))}
              {Array.isArray(item.content) && item.content.length > 3 && (
                <button onClick={onOpen} className="w-full py-2 text-sm md:text-[11px] text-muted-foreground/55 hover:text-primary transition-colors flex items-center justify-center gap-1 rounded-xl border border-dashed border-border/50 hover:border-primary/30"><ArrowSquareOut size={11} /> +{item.content.length-3} more cards</button>
              )}
            </div>
          )}
          {item.item_type==="quiz" && (
            <div className="space-y-3">
              {(item.content?.questions||[]).slice(0,2).map((q,i) => (
                <div key={i} className="rounded-xl bg-muted/25 border border-border/50 p-3">
                  <p className="text-[9.5px] text-muted-foreground/50 font-bold uppercase tracking-wider mb-1">Q{i+1}</p>
                  <p className="text-[12.5px] font-medium leading-snug mb-2">{q.question}</p>
                  <div className="space-y-1">
                    {(q.options||[]).map((opt,j) => (
                      <div key={j} className="flex items-center gap-2 text-sm md:text-[11px] text-muted-foreground/65">
                        <span className="w-[18px] h-[18px] rounded-full border border-border/60 flex items-center justify-center text-[9px] font-bold shrink-0">{String.fromCharCode(65+j)}</span>{opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(item.content?.questions?.length||0) > 2 && (
                <button onClick={onOpen} className="w-full py-2 text-sm md:text-[11px] text-muted-foreground/55 hover:text-primary transition-colors flex items-center justify-center gap-1 rounded-xl border border-dashed border-border/50 hover:border-primary/30"><ArrowSquareOut size={11} /> +{item.content.questions.length-2} more questions</button>
              )}
            </div>
          )}
        </div>
        <div className="px-4 pb-3 flex items-center gap-1.5 text-muted-foreground/35">
          <Keyboard size={11} />
          <span className="text-sm md:text-[10px]"><kbd className="font-mono bg-muted/50 px-1 rounded text-[9px]">Space</kbd> quick look &nbsp;·&nbsp;<kbd className="font-mono bg-muted/50 px-1 rounded text-[9px]">Esc</kbd> close</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border shrink-0">
        <AnimatePresence mode="wait">
          {confirmDel ? (
            <motion.div key="confirm" initial={{ opacity:0,scale:0.97 }} animate={{ opacity:1,scale:1 }}
              exit={{ opacity:0,scale:0.97 }} transition={{ duration:0.14 }} className="space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-[12.5px] font-semibold text-foreground/75"><WarningOctagon size={16} weight="fill" className="text-red-500" /> Delete this item?</div>
              <p className="text-sm md:text-[11px] text-center text-muted-foreground/55">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDel(false)} className="flex-1 py-2 rounded-xl border border-border text-sm md:text-[12px] hover:bg-muted transition-colors font-medium">Cancel</button>
                <button onClick={() => onDelete(item.item_id)} className="flex-1 py-2 rounded-xl bg-red-500 text-[var(--text-primary)] text-sm md:text-[12px] font-semibold hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label:"Open",   Icon:ArrowSquareOut, fn:onOpen,               cls:"bg-primary text-primary-foreground hover:bg-primary/90 col-span-2 font-semibold" },
                { label:"Share",  Icon:ShareNetwork,   fn:onShare,              cls:"border border-border hover:bg-muted" },
                { label:"Export", Icon:DownloadSimple, fn:()=>onExport(item),   cls:"border border-border hover:bg-muted" },
                { label:"Delete", Icon:TrashSimple,    fn:()=>setConfirmDel(true), cls:"border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" },
              ].map(({ label, Icon, fn, cls }) => (
                <button key={label} onClick={fn} className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-sm md:text-[12px] transition-colors ${cls}`}>
                  <Icon size={13} weight="fill" />{label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Library() {
  const { token } = useContext(AuthContext);
  const headers   = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  /* ── Core data ── */
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);

  /* ── Navigation / folder ── */
  const [activeFolder,  setActiveFolder]  = useState("all");

  /* ── Selection ── */
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [quickLookItem, setQuickLookItem] = useState(null);
  const [fullViewItem,  setFullViewItem]  = useState(null);

  /* ── Hover / drag ── */
  const [hoveredItem,   setHoveredItem]   = useState(null);
  const [draggingIds,   setDraggingIds]   = useState(new Set());
  const [dragOverFolder,setDragOverFolder]= useState(null);
  const dragGhostRef = useRef(null);

  /* ── View mode ── */
  const [viewMode,      setViewMode]      = useState(() => localStorage.getItem(LS_VIEW_KEY) || "grid");

  /* ── Sort / search ── */
  const [sort,          setSort]          = useState("recent");
  const [search,        setSearch]        = useState("");
  const [sortOpen,      setSortOpen]      = useState(false);
  const sortRef = useRef(null);

  /* ── Advanced filters ── */
  const [filters,       setFilters]       = useState(EMPTY_FILTERS);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const filterRef = useRef(null);

  /* ── Tag registry (localStorage) ── */
  const [tagRegistry,   setTagRegistry]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_TAG_REG) || "{}"); } catch { return {}; }
  });
  /* ── Per-item tags (synced to backend) ── */
  const [itemTags,      setItemTags]      = useState({});

  /* ── Active tag filter (sidebar click) ── */
  const [activeTag,     setActiveTag]     = useState(null);

  /* ── Virtual folders / favourites ── */
  const [itemFolders,   setItemFolders]   = useState({});
  const [itemFavs,      setItemFavs]      = useState(new Set());

  /* ── Context menu / rename ── */
  const [ctxMenu,       setCtxMenu]       = useState(null);
  const [renamingId,    setRenamingId]    = useState(null);

  /* ── Search presets ── */
  const [searchPresets, setSearchPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_PRESETS_KEY) || "[]"); } catch { return []; }
  });

  const changeViewMode = useCallback((v) => { setViewMode(v); localStorage.setItem(LS_VIEW_KEY, v); }, []);

  /* persist tag registry */
  useEffect(() => { localStorage.setItem(LS_TAG_REG, JSON.stringify(tagRegistry)); }, [tagRegistry]);

  /* ── Fetch items ── */
  const fetchLibrary = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/library`, { headers, withCredentials: true });
      const data = res.data;
      setItems(data);
      /* init itemTags from backend data */
      const fromBackend = {};
      data.forEach(i => { if (i.tags && i.tags.length > 0) fromBackend[i.item_id] = i.tags; });
      setItemTags(prev => ({ ...fromBackend, ...prev }));
      /* ensure all tags are registered */
      setTagRegistry(prev => {
        const reg = { ...prev };
        data.forEach(i => (i.tags||[]).forEach(t => { if (!(t in reg)) reg[t] = Object.keys(reg).length % TAG_PALETTE.length; }));
        return reg;
      });
    } catch { toast.error("Failed to load library"); }
    finally  { setLoading(false); }
  }, [headers]);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

  /* ── CRUD ── */
  const handleDelete = useCallback(async (itemId) => {
    try {
      await axios.delete(`${API}/library/${itemId}`, { headers, withCredentials: true });
      setItems(prev => prev.filter(i => i.item_id !== itemId));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
      if (quickLookItem?.item_id === itemId) setQuickLookItem(null);
      if (fullViewItem?.item_id  === itemId) setFullViewItem(null);
      toast.success("Removed from library");
    } catch { toast.error("Failed to delete"); }
  }, [headers, quickLookItem, fullViewItem]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = [...selectedIds]; if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => axios.delete(`${API}/library/${id}`, { headers, withCredentials: true })));
      setItems(prev => prev.filter(i => !ids.includes(i.item_id)));
      setSelectedIds(new Set());
      if (ids.includes(quickLookItem?.item_id)) setQuickLookItem(null);
      toast.success(`Deleted ${ids.length} item${ids.length>1?"s":""}`);
    } catch { toast.error("Failed to delete some items"); }
  }, [headers, selectedIds, quickLookItem]);

  const handleDuplicate = useCallback(async (item) => {
    const copy = { ...item, title: `${item.title} (copy)` };
    try {
      const res = await axios.post(`${API}/library`, copy, { headers, withCredentials: true });
      setItems(prev => [res.data, ...prev]);
      toast.success(`Duplicated "${item.title}"`);
    } catch {
      const fakeId = `local-${Date.now()}`;
      setItems(prev => [{ ...copy, item_id: fakeId, created_at: new Date().toISOString() }, ...prev]);
      toast.success(`Duplicated "${item.title}" (local)`);
    }
  }, [headers]);

  const handleDuplicateSelected = useCallback(() => {
    items.filter(i => selectedIds.has(i.item_id)).forEach(handleDuplicate);
  }, [items, selectedIds, handleDuplicate]);

  const handleShare = useCallback((item) => {
    navigator.clipboard?.writeText(window.location.href).catch(()=>{});
    toast.success(`Link copied for "${item.title}"`);
  }, []);

  const handleRenameCommit = useCallback((itemId, newTitle) => {
    setRenamingId(null);
    if (newTitle?.trim()) {
      setItems(prev => prev.map(i => i.item_id===itemId ? {...i,title:newTitle.trim()} : i));
      if (quickLookItem?.item_id===itemId) setQuickLookItem(p => ({...p,title:newTitle.trim()}));
      axios.patch(`${API}/library/${itemId}`, { title: newTitle.trim() }, { headers, withCredentials:true }).catch(()=>{});
    }
  }, [headers, quickLookItem]);

  /* ── Tag management ── */
  const addTag = useCallback((itemId, tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setItemTags(prev => {
      const newTags = [...new Set([...(prev[itemId]||[]), trimmed])];
      /* sync to backend */
      axios.patch(`${API}/library/${itemId}`, { tags: newTags }, { headers, withCredentials:true }).catch(()=>{});
      return { ...prev, [itemId]: newTags };
    });
    setTagRegistry(prev => {
      if (trimmed in prev) return prev;
      const newReg = { ...prev, [trimmed]: Object.keys(prev).length % TAG_PALETTE.length };
      return newReg;
    });
  }, [headers]);

  const removeTag = useCallback((itemId, tag) => {
    setItemTags(prev => {
      const newTags = (prev[itemId]||[]).filter(t => t !== tag);
      axios.patch(`${API}/library/${itemId}`, { tags: newTags }, { headers, withCredentials:true }).catch(()=>{});
      return { ...prev, [itemId]: newTags };
    });
  }, [headers]);

  const renameTag = useCallback((oldTag, newTag) => {
    if (!newTag.trim() || newTag === oldTag) return;
    /* update all items */
    setItemTags(prev => {
      const updated = {};
      Object.entries(prev).forEach(([id, tags]) => {
        const newTags = tags.map(t => t===oldTag ? newTag : t);
        updated[id] = newTags;
        if (tags.includes(oldTag)) axios.patch(`${API}/library/${id}`, { tags: newTags }, { headers, withCredentials:true }).catch(()=>{});
      });
      return updated;
    });
    setTagRegistry(prev => {
      const { [oldTag]: colorIdx, ...rest } = prev;
      return { ...rest, [newTag]: colorIdx ?? Object.keys(rest).length % TAG_PALETTE.length };
    });
    if (activeTag === oldTag) setActiveTag(newTag);
    if (filters.tags.includes(oldTag)) setFilters(p => ({ ...p, tags: p.tags.map(t => t===oldTag?newTag:t) }));
    toast.success(`Renamed tag "${oldTag}" → "${newTag}"`);
  }, [headers, activeTag, filters.tags]);

  const deleteTag = useCallback((tag) => {
    setItemTags(prev => {
      const updated = {};
      Object.entries(prev).forEach(([id, tags]) => {
        const newTags = tags.filter(t => t !== tag);
        updated[id] = newTags;
        if (tags.includes(tag)) axios.patch(`${API}/library/${id}`, { tags: newTags }, { headers, withCredentials:true }).catch(()=>{});
      });
      return updated;
    });
    setTagRegistry(prev => { const { [tag]: _, ...rest } = prev; return rest; });
    if (activeTag === tag) setActiveTag(null);
    setFilters(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));
    toast.success(`Deleted tag "${tag}"`);
  }, [headers, activeTag]);

  /* ── Virtual folders / fav ── */
  const moveToFolder = useCallback((ids, folderKey) => {
    if (folderKey === "starred") {
      setItemFavs(prev => { const n=new Set(prev); ids.forEach(id=>n.add(id)); return n; });
      toast.success(`Starred ${ids.length>1?`${ids.length} items`:"item"}`);
    } else {
      setItemFolders(prev => { const n={...prev}; ids.forEach(id=>{ n[id]=folderKey; }); return n; });
      const folder = SIDEBAR_FOLDERS.find(f => f.key===folderKey);
      toast.success(`Moved to ${folder?.label??folderKey}`);
    }
    setSelectedIds(new Set());
  }, []);

  /* ── Drag ── */
  const handleDragStart = useCallback((e, item) => {
    const ids = selectedIds.has(item.item_id) ? [...selectedIds] : [item.item_id];
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ ids }));
    const ghost = createDragGhost(ids.length, item.title);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth/2, 20);
    setTimeout(() => ghost.remove(), 0);
    setDraggingIds(new Set(ids));
  }, [selectedIds]);

  const handleDragEnd   = useCallback(() => { setDraggingIds(new Set()); setDragOverFolder(null); }, []);
  const handleFolderDragOver   = useCallback((fk) => setDragOverFolder(fk), []);
  const handleFolderDragLeave  = useCallback(() => setDragOverFolder(null), []);
  const handleFolderDrop       = useCallback((e, fk) => {
    e.preventDefault();
    try { const { ids } = JSON.parse(e.dataTransfer.getData("application/json")); moveToFolder(ids, fk); } catch {}
    setDraggingIds(new Set()); setDragOverFolder(null);
  }, [moveToFolder]);

  /* ── Item click (multi-select aware) ── */
  const handleItemClick = useCallback((item, e, visibleItems) => {
    e.stopPropagation();
    if (renamingId) return;
    if (e.metaKey || e.ctrlKey) {
      setSelectedIds(prev => { const n=new Set(prev); n.has(item.item_id)?n.delete(item.item_id):n.add(item.item_id); return n; });
      setQuickLookItem(item);
    } else if (e.shiftKey && selectedIds.size > 0) {
      const visIds = visibleItems.map(i => i.item_id);
      const lastId = [...selectedIds].at(-1);
      const [a,b] = [visIds.indexOf(lastId), visIds.indexOf(item.item_id)];
      setSelectedIds(prev => new Set([...prev, ...visIds.slice(Math.min(a,b), Math.max(a,b)+1)]));
      setQuickLookItem(item);
    } else {
      const isSame = selectedIds.size===1 && selectedIds.has(item.item_id);
      if (isSame) { setSelectedIds(new Set()); setQuickLookItem(null); }
      else         { setSelectedIds(new Set([item.item_id])); setQuickLookItem(item); }
    }
  }, [selectedIds, renamingId]);

  /* ── Context menu ── */
  const openContextMenu = useCallback((e, item) => {
    e.preventDefault();
    const ids = selectedIds.has(item.item_id) ? [...selectedIds] : [item.item_id];
    setCtxMenu({ x:e.clientX, y:e.clientY, item, ids, count:ids.length });
  }, [selectedIds]);

  /* ── Sort dropdown outside click ── */
  useEffect(() => {
    const h = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Search presets ── */
  const savePreset = useCallback((name) => {
    const preset = { id: Date.now(), name, search, filters };
    const updated = [...searchPresets, preset];
    setSearchPresets(updated);
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(updated));
    toast.success(`Saved preset "${name}"`);
  }, [search, filters, searchPresets]);

  const loadPreset = useCallback((preset) => {
    setSearch(preset.search || "");
    setFilters(preset.filters || EMPTY_FILTERS);
    toast.success(`Loaded "${preset.name}"`);
  }, []);

  const deletePreset = useCallback((id) => {
    const updated = searchPresets.filter(p => p.id !== id);
    setSearchPresets(updated);
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(updated));
  }, [searchPresets]);

  /* ── Tag click from item → filter ── */
  const handleTagClick = useCallback((tag) => {
    setActiveTag(prev => prev===tag ? null : tag);
    setActiveFolder("all");
  }, []);

  /* ── Keyboard shortcuts ── */
  const visibleRef = useRef([]);
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag==="INPUT"||tag==="TEXTAREA"||e.target.isContentEditable) return;
      if (e.key==="Escape")   { if (ctxMenu) { setCtxMenu(null); return; } setSelectedIds(new Set()); setQuickLookItem(null); setActiveTag(null); }
      if (e.code==="Space")   { e.preventDefault(); const target=hoveredItem||(visibleRef.current.length===1?visibleRef.current[0]:null); if(target){ setSelectedIds(p=>{const n=new Set(p);n.has(target.item_id)?n.delete(target.item_id):n.add(target.item_id);return n;}); setQuickLookItem(target); } }
      if ((e.metaKey||e.ctrlKey)&&e.key==="a") { e.preventDefault(); setSelectedIds(new Set(visibleRef.current.map(i=>i.item_id))); if(visibleRef.current.length>0)setQuickLookItem(visibleRef.current[0]); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="d") { e.preventDefault(); if(selectedIds.size>0)handleDuplicateSelected(); else if(hoveredItem)handleDuplicate(hoveredItem); }
      if ((e.key==="Delete"||e.key==="Backspace")&&selectedIds.size>0) { if(window.confirm(`Delete ${selectedIds.size} item${selectedIds.size>1?"s":""}?`))handleDeleteSelected(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ── Tag counts ── */
  const tagCounts = useMemo(() => {
    const counts = {};
    Object.keys(tagRegistry).forEach(tag => {
      counts[tag] = Object.values(itemTags).filter(tags => tags.includes(tag)).length;
    });
    return counts;
  }, [tagRegistry, itemTags]);

  /* ── Filtering + sorting ── */
  const visible = useMemo(() => {
    return sortItems(
      items.filter(item => {
        const folder  = itemFolders[item.item_id] || item.item_type;
        const isFav   = itemFavs.has(item.item_id);
        const tags    = itemTags[item.item_id] || [];

        /* folder */
        const matchFolder = activeFolder==="all" ? true : activeFolder==="starred" ? isFav : folder===activeFolder;
        /* active tag (sidebar click) */
        const matchActiveTag = !activeTag || tags.includes(activeTag);
        /* search (title + content + tags + type) */
        const matchSearch = itemMatchesQuery(item, search, tags);
        /* advanced filters */
        const matchType     = filters.types.length===0 || filters.types.includes(item.item_type);
        const matchFTags    = filters.tags.length===0  || filters.tags.every(t => tags.includes(t));
        const matchDateFrom = !filters.dateFrom || new Date(item.created_at) >= new Date(filters.dateFrom);
        const matchDateTo   = !filters.dateTo   || new Date(item.created_at) <= new Date(filters.dateTo + "T23:59:59");

        return matchFolder && matchActiveTag && matchSearch && matchType && matchFTags && matchDateFrom && matchDateTo;
      }),
      sort
    );
  }, [items, activeFolder, itemFolders, itemFavs, itemTags, search, sort, filters, activeTag]);

  visibleRef.current = visible;

  const counts = useMemo(() => ({
    all:        items.length,
    summary:    items.filter(i => (itemFolders[i.item_id]||i.item_type)==="summary").length,
    flashcards: items.filter(i => (itemFolders[i.item_id]||i.item_type)==="flashcards").length,
    quiz:       items.filter(i => (itemFolders[i.item_id]||i.item_type)==="quiz").length,
    template:   items.filter(i => (itemFolders[i.item_id]||i.item_type)==="template").length,
    starred:    itemFavs.size,
  }), [items, itemFolders, itemFavs]);

  const activeSort    = SORT_OPTIONS.find(o => o.value===sort);
  const folderFiltered = activeFolder!=="all" && activeFolder!=="starred";
  const showPanel     = quickLookItem !== null || selectedIds.size > 1;
  const activeFilterCount = filters.types.length + filters.tags.length + (filters.dateFrom?1:0) + (filters.dateTo?1:0) + (activeTag?1:0);
  const hasActiveSearch   = search.trim().length > 0 || activeFilterCount > 0;

  /* Loading skeleton — mirrors the real layout */
  if (loading) return (
    <motion.div
      className="flex flex-1 flex flex-col min-h-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
        {/* Top bar skeleton */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <Skeleton className="h-8 flex-1 max-w-lg" delay={0} />
          <Skeleton className="h-8 w-[70px]" delay={40} />
          <Skeleton className="h-8 w-[70px]" delay={80} />
          <Skeleton className="h-8 w-[70px]" delay={120} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left finder sidebar skeleton */}
          <div className="w-52 shrink-0 border-r border-border bg-card/40 p-3 space-y-1">
            <Skeleton className="h-2.5 w-20 mb-3" delay={60} />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                <Skeleton className="h-4 w-4 rounded-md shrink-0" delay={i * 40} />
                <Skeleton className="h-2.5 flex-1" delay={i * 40 + 15} />
                <Skeleton circle className="h-4 w-4 shrink-0" delay={i * 40 + 30} />
              </div>
            ))}
          </div>

          {/* Center grid — 6 card skeletons */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Breadcrumb bar */}
            <div className="flex items-center gap-2 px-5 pt-3.5 pb-3 border-b border-border/50">
              <Skeleton className="h-3.5 w-24" delay={100} />
              <Skeleton className="h-3 w-16" delay={130} />
            </div>

            <div className="flex-1 grid grid-cols-1 gap-3 p-4 content-start sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <LibraryCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
    </motion.div>
  );

  const vv = { initial:{opacity:0,y:6}, animate:{opacity:1,y:0,transition:{duration:0.22,ease:"easeOut"}}, exit:{opacity:0,y:-4,transition:{duration:0.15}} };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
    <>
      <div
        className="flex flex-1 flex flex-col min-h-0 overflow-hidden"
        onClick={() => { setSelectedIds(new Set()); setQuickLookItem(null); setCtxMenu(null); setSortOpen(false); setFilterOpen(false); }}>

          {/* ── TOP BAR ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
            {/* Search box */}
            <div className="flex-1 relative max-w-lg">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/55 pointer-events-none" />
              <input type="text" placeholder="Search title, content, tags…" value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-muted/50 border border-border text-sm md:text-[13px] placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all" />
              {search && (
                <button onClick={e => { e.stopPropagation(); setSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/45 hover:text-muted-foreground transition-colors">
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Active tag badge */}
            {activeTag && (
              <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: getTagStyle(activeTag,tagRegistry).bg.split(" ")[0].replace("bg-","").length > 0 ? undefined : "#3b82f620" }}>
                <TagChip tag={activeTag} registry={tagRegistry} size="xs" />
                <button onClick={e => { e.stopPropagation(); setActiveTag(null); }} className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"><X size={10} weight="bold" /></button>
              </motion.div>
            )}

            {/* Selection count */}
            {selectedIds.size > 0 && (
              <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm md:text-[12px] font-semibold text-primary">{selectedIds.size} selected</span>
                <button onClick={e => { e.stopPropagation(); setSelectedIds(new Set()); setQuickLookItem(null); }} className="text-primary/60 hover:text-primary transition-colors"><X size={11} weight="bold" /></button>
              </motion.div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {/* View toggle */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/60 border border-border">
                {[{v:"grid",Ico:SquaresFour},{v:"list",Ico:Rows}].map(({ v, Ico }) => (
                  <button key={v} onClick={() => changeViewMode(v)}
                    className={`p-1.5 rounded-md transition-colors ${viewMode===v?"bg-background shadow-sm text-primary":"text-muted-foreground hover:text-foreground"}`}>
                    <Ico size={15} weight={viewMode===v?"fill":"regular"} />
                  </button>
                ))}
              </div>

              {/* Advanced filter button */}
              <div className="relative" ref={filterRef}>
                <button onClick={e => { e.stopPropagation(); setFilterOpen(o => !o); setSortOpen(false); }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm md:text-[12px] transition-colors ${filterOpen||activeFilterCount>0?"bg-primary/10 border-primary/30 text-primary":"border-border bg-card text-foreground/70 hover:bg-muted/60"}`}>
                  <Sliders size={13} weight={activeFilterCount>0?"fill":"regular"} />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </button>
                <AnimatePresence>
                  {filterOpen && (
                    <FilterPanel
                      filters={filters} onChange={setFilters}
                      registry={tagRegistry} tagCounts={tagCounts}
                      onClose={() => setFilterOpen(false)}
                      presets={searchPresets} onSavePreset={savePreset}
                      onLoadPreset={loadPreset} onDeletePreset={deletePreset}
                      hasActiveSearch={hasActiveSearch}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Sort */}
              <div className="relative" ref={sortRef}>
                <button onClick={e => { e.stopPropagation(); setSortOpen(o=>!o); setFilterOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm md:text-[12px] text-foreground/70 hover:bg-muted/60 transition-colors">
                  {activeSort && <activeSort.Icon size={13} />}
                  <span>{activeSort?.label}</span>
                  <SortDescending size={12} className="text-muted-foreground/55" />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{ opacity:0,y:-4,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
                      exit={{ opacity:0,y:-4,scale:0.97 }} transition={{ duration:0.12 }}
                      className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1">
                      {SORT_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => { setSort(o.value); setSortOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm md:text-[12px] transition-colors ${sort===o.value?"bg-primary/10 text-primary":"hover:bg-muted text-foreground/75"}`}>
                          <o.Icon size={13} />{o.label}{sort===o.value&&<Check size={11} weight="bold" className="ml-auto" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── SELECTION ACTION BAR ── */}
          {selectedIds.size > 0 && (
            <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }}
              className="flex items-center gap-4 px-4 py-1.5 bg-primary/5 border-b border-primary/10 shrink-0">
              {[
                { label:"Open",      key:"↩",  fn:()=>{ const i=items.find(x=>x.item_id===[...selectedIds][0]); if(i)setFullViewItem(i); } },
                { label:"Duplicate", key:"⌘D", fn:handleDuplicateSelected },
                { label:"Delete",    key:"⌫",  fn:handleDeleteSelected, red:true },
              ].map(({ label, key, fn, red }) => (
                <button key={label} onClick={e => { e.stopPropagation(); fn(); }}
                  className={`flex items-center gap-1.5 text-[11.5px] font-medium transition-colors ${red?"text-red-500 hover:text-red-600":"text-primary/70 hover:text-primary"}`}>
                  <kbd className="font-mono text-sm md:text-[10px] bg-background border border-border rounded px-1">{key}</kbd>{label}
                </button>
              ))}
              <span className="ml-auto text-sm md:text-[11px] text-muted-foreground/50">
                <kbd className="font-mono text-[9px] bg-background border border-border rounded px-1">⌘A</kbd> all &nbsp;·&nbsp;
                <kbd className="font-mono text-[9px] bg-background border border-border rounded px-1">Esc</kbd> deselect
              </span>
            </motion.div>
          )}

          {/* ── THREE-COLUMN BODY ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT: Finder sidebar */}
            <div className="w-52 shrink-0 border-r border-border bg-card/40 overflow-hidden">
              <FinderSidebar
                activeFolder={activeFolder}
                onFolderChange={f => { setActiveFolder(f); setSelectedIds(new Set()); setQuickLookItem(null); setActiveTag(null); }}
                counts={counts}
                dragOverFolder={dragOverFolder}
                onFolderDragOver={handleFolderDragOver}
                onFolderDragLeave={handleFolderDragLeave}
                onFolderDrop={handleFolderDrop}
                registry={tagRegistry}
                tagCounts={tagCounts}
                activeTag={activeTag}
                onTagClick={handleTagClick}
                onTagRename={renameTag}
                onTagDelete={deleteTag}
              />
            </div>

            {/* CENTER: Content grid/list */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {/* Breadcrumb + result count */}
              <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-[13px] font-semibold">
                    {activeTag ? `#${activeTag}` : activeFolder==="all" ? "All Items" : activeFolder==="starred" ? "Starred" : TYPE_META[activeFolder]?.label ?? activeFolder}
                  </span>
                  {/* Result count */}
                  {search || activeFilterCount > 0 ? (
                    <span className="text-[11.5px] text-primary/70 font-medium">
                      {visible.length} {visible.length===1?"result":"results"}
                      {search ? ` for "${search}"` : ""}
                    </span>
                  ) : (
                    <span className="text-sm md:text-[11px] text-muted-foreground/55">{visible.length} {visible.length===1?"item":"items"}</span>
                  )}
                  {/* Active filter chips in breadcrumb */}
                  {filters.types.map(t => (
                    <span key={t} className="flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">
                      {TYPE_META[t]?.label}
                      <button onClick={e=>{e.stopPropagation();setFilters(p=>({...p,types:p.types.filter(x=>x!==t)}))}}><X size={9} weight="bold" /></button>
                    </span>
                  ))}
                  {filters.tags.map(t => (
                    <TagChip key={t} tag={t} registry={tagRegistry} size="xs"
                      onRemove={() => setFilters(p => ({...p,tags:p.tags.filter(x=>x!==t)}))} />
                  ))}
                  {(filters.dateFrom||filters.dateTo) && (
                    <span className="flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">
                      <CalendarBlank size={10} />
                      {filters.dateFrom&&`From ${filters.dateFrom} `}{filters.dateTo&&`To ${filters.dateTo}`}
                      <button onClick={e=>{e.stopPropagation();setFilters(p=>({...p,dateFrom:"",dateTo:""}))}}><X size={9} weight="bold" /></button>
                    </span>
                  )}
                </div>
                {draggingIds.size > 0 && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="text-sm md:text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                    <FolderSimple size={13} className="text-primary/60" /> Drag to sidebar to move
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <AnimatePresence mode="wait">
                  {visible.length === 0 ? (
                    <motion.div key="empty" {...vv} className="px-5">
                      <EmptyState isFiltered={folderFiltered} search={search}
                        hasActiveFilters={activeFilterCount > 0}
                        onClearFilters={() => { setSearch(""); setFilters(EMPTY_FILTERS); setActiveTag(null); }} />
                    </motion.div>
                  ) : viewMode === "grid" ? (
                    <motion.div key="grid" {...vv} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {visible.map(item => (
                        <GridCard key={item.item_id} item={item}
                          tags={itemTags[item.item_id]} registry={tagRegistry} search={search}
                          isSelected={selectedIds.size===1 && selectedIds.has(item.item_id)}
                          isMultiSelected={selectedIds.size>1 && selectedIds.has(item.item_id)}
                          isDragging={draggingIds.has(item.item_id)} renamingId={renamingId}
                          onClick={e => handleItemClick(item, e, visible)}
                          onOpen={() => setFullViewItem(item)}
                          onDelete={handleDelete} onShare={() => handleShare(item)}
                          onHover={setHoveredItem} onContextMenu={openContextMenu}
                          onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                          onRenameCommit={handleRenameCommit}
                          onTagClick={handleTagClick}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="list" {...vv} className="p-3">
                      <div className="flex items-center px-3 py-1.5 mb-1 border-b border-border/50">
                        <div className="w-8 shrink-0" />
                        {["Name","Type","Modified","Tags"].map(h => (
                          <div key={h} className={`text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/45 px-2 ${h==="Name"?"flex-1":h==="Type"?"w-28 shrink-0":h==="Modified"?"w-32 shrink-0":"w-28 shrink-0"}`}>{h}</div>
                        ))}
                        <div className="w-24 shrink-0" />
                      </div>
                      <AnimatePresence>
                        {visible.map((item, idx) => (
                          <ListRow key={item.item_id} item={item} index={idx}
                            tags={itemTags[item.item_id]} registry={tagRegistry} search={search}
                            isSelected={selectedIds.size===1 && selectedIds.has(item.item_id)}
                            isMultiSelected={selectedIds.size>1 && selectedIds.has(item.item_id)}
                            isDragging={draggingIds.has(item.item_id)} renamingId={renamingId}
                            onClick={e => handleItemClick(item, e, visible)}
                            onOpen={() => setFullViewItem(item)}
                            onDelete={handleDelete} onShare={() => handleShare(item)}
                            onHover={setHoveredItem} onContextMenu={openContextMenu}
                            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                            onRenameCommit={handleRenameCommit}
                            onTagClick={handleTagClick}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT: Quick Look panel */}
            <AnimatePresence>
              {showPanel && (
                <motion.div key="quicklook"
                  initial={{ width:0,opacity:0 }} animate={{ width:300,opacity:1 }}
                  exit={{ width:0,opacity:0 }} transition={{ duration:0.26,ease:[0.4,0,0.2,1] }}
                  className="shrink-0 border-l border-border bg-card/50 overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 border-b border-border shrink-0">
                    <p className="text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/45">Quick Look</p>
                  </div>
                  <div className="flex-1 overflow-hidden" style={{ minWidth:300 }}>
                    <QuickLookPanel
                      item={quickLookItem} selectedCount={selectedIds.size}
                      tags={itemTags[quickLookItem?.item_id]} registry={tagRegistry}
                      onClose={() => { setQuickLookItem(null); setSelectedIds(new Set()); }}
                      onDelete={handleDelete} onShare={() => handleShare(quickLookItem)}
                      onExport={exportItem}
                      onOpen={() => quickLookItem && setFullViewItem(quickLookItem)}
                      onAddTag={addTag} onRemoveTag={removeTag}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} actions={{
            onOpen:         () => setFullViewItem(ctxMenu.item),
            onRename:       () => setRenamingId(ctxMenu.item.item_id),
            onMoveToFolder: fk => moveToFolder(ctxMenu.ids, fk),
            onFavourite:    () => { setItemFavs(prev => { const n=new Set(prev); ctxMenu.ids.forEach(id=>n.add(id)); return n; }); toast.success("Added to Starred"); },
            onAddTag:       () => { setQuickLookItem(ctxMenu.item); setSelectedIds(new Set([ctxMenu.item.item_id])); },
            onDuplicate:    () => items.filter(i=>ctxMenu.ids.includes(i.item_id)).forEach(handleDuplicate),
            onDelete:       () => ctxMenu.ids.forEach(handleDelete),
          }} />
        )}
      </AnimatePresence>

      {/* Full view modal */}
      <AnimatePresence>
        {fullViewItem && <FullViewModal item={fullViewItem} onClose={() => setFullViewItem(null)} />}
      </AnimatePresence>
    </>
    </motion.div>
  );
}
