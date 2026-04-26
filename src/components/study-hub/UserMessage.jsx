import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

const MAX_LINES = 3;

const iconMap = {
  file: FileText,
  image: ImageIcon,
  link: LinkIcon,
};

export default function UserMessage({ message }) {
  const [expanded, setExpanded] = useState(false);
  const text = message.content?.trim() || "";
  const attachments = message.attachments || [];
  const lines = text ? text.split("\n") : [];
  const lineCount = lines.length;
  const shouldTruncate = !expanded && (lineCount > MAX_LINES || text.length > 180);
  const displayText = shouldTruncate ? lines.slice(0, MAX_LINES).join("\n").slice(0, 180) + (text.length > 180 ? "…" : "") : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div className="max-w-[70%] rounded-2xl border border-hub-border bg-hub-elevated shadow-[0_0_0_1px_var(--hub-border)]">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((a, i) => {
              const Icon = iconMap[a.type] || FileText;
              const label = a.name || a.url || (a.type === "image" ? "Image" : "File");
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-hub-bg/80 px-2 py-1 font-hub-sans text-sm md:text-xs text-hub-muted"
                >
                  <Icon className="h-3 w-3" />
                  {label.length > 20 ? label.slice(0, 20) + "…" : label}
                </span>
              );
            })}
          </div>
        )}
        {text && (
          <p className="whitespace-pre-wrap font-hub-sans text-sm leading-relaxed text-hub-text">
            {displayText}
            {shouldTruncate && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="ml-1 font-medium text-hub-accent hover:underline"
              >
                show more
              </button>
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
