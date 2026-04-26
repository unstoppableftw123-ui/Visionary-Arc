import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image as ImageIcon, Link as LinkIcon, ClipboardPaste } from "lucide-react";

const FILE_ACCEPT = ".pdf,.txt,.docx,image/*";
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp";

export default function AttachMenu({
  open,
  onClose,
  anchorRef,
  onFileSelect,
  onImageSelect,
  onLinkAdd,
  onPasteTextOpen,
}) {
  const ref = useRef(null);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setShowLink(false);
      setLinkUrl("");
    }
  }, [open]);

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

  const handleLinkSubmit = () => {
    const url = linkUrl.trim();
    if (url) {
      onLinkAdd(url);
      setLinkUrl("");
      setShowLink(false);
      onClose();
    }
  };

  if (!open) return null;

  const tileBase =
    "flex flex-col gap-1.5 rounded-xl border border-hub-border bg-hub-bg p-3 text-left transition hover:-translate-y-0.5 hover:border-hub-accent/40 hover:bg-hub-elevated cursor-pointer";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-2xl border border-hub-border bg-hub-surface p-3 shadow-xl"
    >
      <p className="mb-2.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Add to chat</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* File tile */}
        <label className={tileBase}>
          <FileText className="h-4 w-4 text-hub-muted" />
          <p className="font-hub-sans text-sm font-medium text-hub-text">File</p>
          <p className="font-hub-sans text-sm md:text-xs text-hub-muted">PDF, TXT, DOCX</p>
          <input
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { onFileSelect(file); onClose(); }
              e.target.value = "";
            }}
          />
        </label>

        {/* Image tile */}
        <label className={tileBase}>
          <ImageIcon className="h-4 w-4 text-hub-muted" />
          <p className="font-hub-sans text-sm font-medium text-hub-text">Image</p>
          <p className="font-hub-sans text-sm md:text-xs text-hub-muted">PNG, JPG</p>
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { onImageSelect(file); onClose(); }
              e.target.value = "";
            }}
          />
        </label>

        {/* Link tile */}
        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className={`${tileBase} ${showLink ? "border-hub-accent/40 bg-hub-elevated" : ""}`}
        >
          <LinkIcon className="h-4 w-4 text-hub-muted" />
          <p className="font-hub-sans text-sm font-medium text-hub-text">Link</p>
          <p className="font-hub-sans text-sm md:text-xs text-hub-muted">URL</p>
        </button>

        {/* Paste Text tile */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onPasteTextOpen?.();
          }}
          className={tileBase}
        >
          <ClipboardPaste className="h-4 w-4 text-hub-muted" />
          <p className="font-hub-sans text-sm font-medium text-hub-text">Paste Text</p>
          <p className="font-hub-sans text-sm md:text-xs text-hub-muted">Opens a text editor</p>
        </button>
      </div>

      {/* Link input — expands below the grid */}
      <AnimatePresence>
        {showLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                placeholder="Paste URL…"
                autoFocus
                className="flex-1 rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-hub-sans text-sm text-hub-text placeholder-hub-dimmed outline-none focus:ring-2 focus:ring-hub-accent/40"
              />
              <button
                type="button"
                onClick={handleLinkSubmit}
                className="rounded-xl bg-hub-accent px-3 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] hover:opacity-90"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
