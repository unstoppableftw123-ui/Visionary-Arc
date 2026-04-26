import { useRef, useState, useEffect, useCallback, useContext } from "react";
import {
  Paperclip, Sparkles, Zap, ArrowUp, X,
  FileText, Image as ImageIcon, Link as LinkIcon, AlignLeft, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ModePopover, { MODES } from "./ModePopover";
import AttachMenu from "./AttachMenu";
import { AuthContext } from "../../App";
import { uploadFile } from "../../services/fileService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDERS = {
  summarize: "Paste your notes, textbook content, or describe a topic…",
  notes: "Paste content to turn into structured notes…",
  slides: "Paste content to turn into presentation slides…",
  quiz: "Paste content to generate quiz questions from…",
  flashcards: "Paste material to create flashcards from…",
};

const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.id, m.label]));

const MODEL_OPTIONS = [
  {
    id: "auto",
    label: "Auto",
    subtitle: "Picks the best model for your task. Usually cheapest.",
    badge: "RECOMMENDED",
    badgeColor: "text-hub-accent bg-hub-accent/10",
  },
  {
    id: "haiku",
    label: "Haiku 3.5",
    subtitle: "Fastest, most affordable",
    badge: "BEST VALUE",
    badgeColor: "text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "sonnet",
    label: "Sonnet 4",
    subtitle: "Balanced speed and quality",
    badge: null,
    badgeColor: null,
  },
  {
    id: "opus",
    label: "Opus 4",
    subtitle: "Most powerful, slower",
    badge: null,
    badgeColor: null,
  },
];

const CHIP_COLORS = {
  link: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  image: "border-orange-500/30 bg-orange-600/10 text-orange-400",
  paste: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  file: "border-hub-border bg-hub-elevated text-hub-text",
};

const CHIP_ICON = {
  file: FileText,
  image: ImageIcon,
  link: LinkIcon,
  paste: AlignLeft,
};

// ─── Model Popover (inline) ───────────────────────────────────────────────────

function ModelPopover({ open, onClose, value, onChange, anchorRef }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-2xl border border-hub-border bg-hub-surface p-1.5 shadow-xl"
    >
      {MODEL_OPTIONS.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => { onChange(opt.id); onClose(); }}
            className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              isActive ? "bg-hub-accent/15" : "hover:bg-hub-elevated"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`font-hub-sans text-sm font-medium leading-tight ${isActive ? "text-hub-accent" : "text-hub-text"}`}>
                  {opt.label}
                </p>
                {opt.badge && (
                  <span className={`rounded-md px-1.5 py-0.5 font-hub-sans text-sm md:text-[10px] font-semibold uppercase tracking-wide ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-hub-sans text-sm md:text-xs leading-tight text-hub-muted">{opt.subtitle}</p>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Paste Text Modal ─────────────────────────────────────────────────────────

function PasteTextModal({ open, onClose, onAdd }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-lg rounded-2xl border border-hub-border bg-hub-surface p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-hub-sans text-base font-semibold text-hub-text">Paste Text</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type a large block of text here…"
          rows={9}
          autoFocus
          className="w-full resize-none rounded-xl border border-hub-border bg-hub-bg px-4 py-3 font-hub-sans text-sm text-hub-text placeholder-hub-dimmed outline-none focus:ring-2 focus:ring-hub-accent/40"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-hub-border px-4 py-2 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="rounded-xl bg-hub-accent px-4 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-40"
          >
            Add to Chat
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatInputBar({
  mode,
  onModeChange,
  options,
  onOptionsChange,
  model,
  onModelChange,
  attachments,
  onRemoveAttachment,
  onFileSelect,
  onImageSelect,
  onLinkAdd,
  onPasteAdd,
  input,
  onInputChange,
  onSend,
  disabled,
}) {
  const { user } = useContext(AuthContext);

  const attachAnchorRef = useRef(null);
  const modeAnchorRef = useRef(null);
  const modelAnchorRef = useRef(null);
  const textareaRef = useRef(null);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModePopover, setShowModePopover] = useState(false);
  const [showModelPopover, setShowModelPopover] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (file, callback) => {
    setUploading(true);
    try {
      const result = await uploadFile(user?.id, file);
      callback(result);
    } catch {
      toast.error('Upload failed — file too large or wrong type');
    } finally {
      setUploading(false);
    }
  }, [user?.id]);

  const handleFileSelectWithUpload = useCallback((file) => {
    handleUpload(file, onFileSelect);
  }, [handleUpload, onFileSelect]);

  const handleImageSelectWithUpload = useCallback((file) => {
    handleUpload(file, onImageSelect);
  }, [handleUpload, onImageSelect]);

  const closeAll = useCallback(() => {
    setShowAttachMenu(false);
    setShowModePopover(false);
    setShowModelPopover(false);
  }, []);

  const toggleAttach = () => { closeAll(); setShowAttachMenu((v) => !v); };
  const toggleMode   = () => { closeAll(); setShowModePopover((v) => !v); };
  const toggleModel  = () => { closeAll(); setShowModelPopover((v) => !v); };

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  const canSend = (input?.trim() || attachments?.length) && !disabled;
  const currentModelLabel = MODEL_OPTIONS.find((o) => o.id === model)?.label ?? "Auto";
  const currentModeLabel  = MODE_LABEL[mode] ?? "Summary";

  // Build the Zone-3 status line
  const firstAttachment = attachments?.[0];
  const attachLabel = firstAttachment
    ? firstAttachment.name
      ? firstAttachment.name.length > 16
        ? firstAttachment.name.slice(0, 16) + "…"
        : firstAttachment.name
      : firstAttachment.type === "link"
      ? "Link"
      : firstAttachment.type === "paste"
      ? "Pasted text"
      : "File"
    : null;
  const extraCount = (attachments?.length ?? 0) > 1 ? `+${attachments.length - 1} more` : null;
  const statusLabel = [attachLabel, extraCount, currentModeLabel, currentModelLabel]
    .filter(Boolean)
    .join(" • ");

  const pillClass = (active) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-hub-sans text-sm md:text-xs font-medium transition ${
      active
        ? "border-hub-accent/50 bg-hub-accent/10 text-hub-accent"
        : "border-hub-border bg-hub-elevated text-hub-muted hover:text-hub-text"
    }`;

  return (
    <>
      <div className="border-t border-hub-border bg-hub-bg px-4 pb-4 pt-3">
        <div className="mx-auto max-w-3xl rounded-2xl border border-hub-border bg-hub-surface px-4 pb-3 pt-3 shadow-sm">

          {/* ── Zone 1: Pills row + attachment chips ── */}
          <div className="flex flex-wrap items-center gap-1.5">

            {/* Attach pill */}
            <div className="relative">
              <button
                ref={attachAnchorRef}
                type="button"
                onClick={uploading ? undefined : toggleAttach}
                disabled={uploading}
                className={pillClass(showAttachMenu || uploading)}
              >
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Paperclip className="h-3.5 w-3.5" />
                }
                {uploading ? 'Uploading…' : 'Attach'}
              </button>
              <AttachMenu
                open={showAttachMenu && !uploading}
                onClose={closeAll}
                anchorRef={attachAnchorRef}
                onFileSelect={handleFileSelectWithUpload}
                onImageSelect={handleImageSelectWithUpload}
                onLinkAdd={onLinkAdd}
                onPasteTextOpen={() => setShowPasteModal(true)}
              />
            </div>

            {/* Mode pill */}
            <div className="relative">
              <button
                ref={modeAnchorRef}
                type="button"
                onClick={toggleMode}
                className={pillClass(showModePopover)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {currentModeLabel}
              </button>
              <ModePopover
                open={showModePopover}
                onClose={closeAll}
                value={mode}
                onChange={onModeChange}
                anchorRef={modeAnchorRef}
              />
            </div>

            {/* Model pill */}
            <div className="relative">
              <button
                ref={modelAnchorRef}
                type="button"
                onClick={toggleModel}
                className={pillClass(showModelPopover)}
              >
                <Zap className="h-3.5 w-3.5" />
                {currentModelLabel}
              </button>
              <ModelPopover
                open={showModelPopover}
                onClose={closeAll}
                value={model}
                onChange={onModelChange}
                anchorRef={modelAnchorRef}
              />
            </div>

            {/* Attachment chips */}
            <AnimatePresence>
              {attachments?.map((a, i) => {
                const chipColor = CHIP_COLORS[a.type] ?? CHIP_COLORS.file;
                const Icon = CHIP_ICON[a.type] ?? FileText;
                const raw = a.name || a.url || "";
                const label =
                  a.type === "paste"
                    ? "Pasted text"
                    : raw.length > 20
                    ? raw.slice(0, 20) + "…"
                    : raw || (a.type === "image" ? "Image" : "File");
                return (
                  <motion.span
                    key={a.id ?? i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-hub-sans text-sm md:text-xs ${chipColor}`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {label}
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(i)}
                      className="ml-0.5 opacity-60 transition hover:opacity-100"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Zone 2: Textarea ── */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            placeholder={PLACEHOLDERS[mode] ?? PLACEHOLDERS.summarize}
            rows={1}
            className="mt-3 w-full resize-none bg-transparent font-hub-sans text-sm leading-relaxed text-hub-text placeholder-hub-dimmed outline-none focus:ring-0"
            style={{ minHeight: "40px", maxHeight: "200px" }}
          />

          {/* ── Zone 3: Status + Send ── */}
          <div className="mt-2 flex items-center justify-between border-t border-hub-border/40 pt-2.5">
            <span className="font-hub-sans text-sm md:text-xs text-hub-dimmed">{statusLabel}</span>
            <button
              type="button"
              onClick={() => canSend && onSend()}
              disabled={!canSend}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-hub-accent text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-30 active:scale-95"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Paste Text Modal — renders as a fixed overlay above everything */}
      <AnimatePresence>
        {showPasteModal && (
          <PasteTextModal
            open={showPasteModal}
            onClose={() => setShowPasteModal(false)}
            onAdd={(text) => onPasteAdd?.(text)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
