import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Brain, Layers, BookOpen, Presentation } from "lucide-react";

export const MODES = [
  { id: "summarize", label: "Summary", icon: FileText, desc: "Condense into key points" },
  { id: "notes", label: "Notes", icon: BookOpen, desc: "Structured notes with headings" },
  { id: "slides", label: "Slides", icon: Presentation, desc: "Outline a slide deck" },
  { id: "flashcards", label: "Flashcards", icon: Layers, desc: "Term + definition cards" },
  { id: "quiz", label: "Quiz", icon: Brain, desc: "Multiple choice / short answer" },
];

export default function ModePopover({ open, onClose, value, onChange, anchorRef }) {
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
      className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-2xl border border-hub-border bg-hub-surface p-1.5 shadow-xl"
    >
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              onChange(mode.id);
              onClose();
            }}
            className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              isActive
                ? "bg-hub-accent/15 text-hub-accent"
                : "text-hub-text hover:bg-hub-elevated"
            }`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isActive ? "text-hub-accent" : "text-hub-muted"
              }`}
            />
            <div>
              <p className="font-hub-sans text-sm font-medium leading-tight">{mode.label}</p>
              <p
                className={`mt-0.5 font-hub-sans text-sm md:text-xs leading-tight ${
                  isActive ? "text-hub-accent/70" : "text-hub-muted"
                }`}
              >
                {mode.desc}
              </p>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}
