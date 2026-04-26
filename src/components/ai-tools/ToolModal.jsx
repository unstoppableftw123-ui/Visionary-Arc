import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../ui/button";

/**
 * ToolModal — Shared shell for all AI tools.
 * Children = the tool form component (manages FORM/LOADING/RESULT states internally).
 */
export default function ToolModal({ isOpen, onClose, title, icon: Icon, description, subtitle, children }) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed inset-x-4 bottom-0 z-50 mx-auto flex max-w-[calc(100vw-2rem)] flex-col rounded-t-2xl border border-border bg-card shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-[min(620px,calc(100vw-2rem))] md:max-h-[88vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border px-4 py-4 shrink-0 sm:px-5">
              {Icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm shadow-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-heading font-bold text-lg truncate leading-tight">{title}</h2>
                {(subtitle || description) && (
                  <p className="mt-0.5 truncate text-sm font-medium text-primary/60 md:text-xs">
                    {subtitle || description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-lg"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
