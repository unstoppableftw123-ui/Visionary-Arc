import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, Layers, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { MOCK_LIBRARY_FILES } from "./mockLibraryData";
import { format } from "date-fns";

const TYPE_CONFIG = {
  note: { label: "Notes", Icon: FileText, color: "text-orange-400" },
  summary: { label: "Summaries", Icon: BookOpen, color: "text-teal-400" },
  flashcard_deck: { label: "Flashcard Decks", Icon: Layers, color: "text-orange-400" },
};

export default function LibraryDrawer({ open, onToggle, addToCanvas }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_LIBRARY_FILES;
    return MOCK_LIBRARY_FILES.filter(
      (f) =>
        (f.title || "").toLowerCase().includes(q) ||
        (f.tag || "").toLowerCase().includes(q)
    );
  }, [search]);

  const byType = useMemo(() => {
    const map = { note: [], summary: [], flashcard_deck: [] };
    filtered.forEach((f) => {
      if (map[f.type]) map[f.type].push(f);
    });
    return map;
  }, [filtered]);

  const handleAddToCanvas = (file) => {
    if (!addToCanvas) return;
    addToCanvas(file);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 h-full border-r border-border bg-card overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b border-border shrink-0">
              <h2 className="font-heading font-semibold text-sm text-foreground mb-2">
                Your Library
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 bg-secondary/50"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-4">
                {(["note", "summary", "flashcard_deck"]).map((type) => {
                  const config = TYPE_CONFIG[type];
                  const items = byType[type] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={type}>
                      <div className={`flex items-center gap-2 px-2 py-1.5 text-sm md:text-xs font-medium text-muted-foreground uppercase ${config.color}`}>
                        <config.Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                      <div className="space-y-1 mt-1">
                        {items.map((file) => (
                          <LibraryFileItem
                            key={file.id}
                            file={file}
                            onAddToCanvas={() => handleAddToCanvas(file)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function LibraryFileItem({ file, onAddToCanvas }) {
  const config = TYPE_CONFIG[file.type] || TYPE_CONFIG.note;
  const dateStr = file.lastEdited
    ? format(new Date(file.lastEdited), "MMM d, yyyy")
    : "";

  return (
    <div className="group relative p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors">
      <div className="flex items-start gap-2">
        <div className={`shrink-0 mt-0.5 ${config.color}`}>
          <config.Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {file.title || "Untitled"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {file.tag && (
              <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {file.tag}
              </span>
            )}
            {dateStr && (
              <span className="text-sm md:text-xs text-muted-foreground">{dateStr}</span>
            )}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-sm md:text-xs"
        onClick={onAddToCanvas}
      >
        <Plus className="w-3 h-3 mr-1" />
        Add to Canvas
      </Button>
    </div>
  );
}
