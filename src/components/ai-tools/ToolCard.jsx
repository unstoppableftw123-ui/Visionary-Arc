import { motion } from "framer-motion";
import { Button } from "../ui/button";

const SUBJECT_COLORS = {
  Math: "#378ADD",
  ELA: "#7F77DD",
  Science: "#639922",
  History: "#BA7517",
  General: "hsl(var(--border))",
};

export default function ToolCard({
  name,
  description,
  icon: Icon,
  subject = "General",
  category,
  xpReward,
  onOpen,
  index = 0,
}) {
  const accentColor = SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.General;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-medium transition-shadow duration-200"
      style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
    >
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Icon + XP badge */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${accentColor}18` }}
          >
            {Icon && <Icon className="h-5 w-5" style={{ color: accentColor }} />}
          </div>
          {xpReward != null && (
            <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-sm md:text-[11px] font-semibold text-primary">
              ⚡ +{xpReward} XP
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-sm leading-snug">{name}</h3>
          <p className="mt-1 text-sm md:text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {/* Category tag */}
        {category && (
          <span className="self-start rounded-full border border-border px-2 py-0.5 text-sm md:text-[10px] font-medium text-muted-foreground">
            {category}
          </span>
        )}
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <Button
          size="sm"
          className="w-full text-sm md:text-xs h-8"
          onClick={onOpen}
        >
          Open Tool
        </Button>
      </div>
    </motion.div>
  );
}
