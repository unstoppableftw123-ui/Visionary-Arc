import { useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { AuthContext } from "../App";
import { isFounder } from "../lib/founder";

/**
 * Global upgrade banner: "Upgrade to Lite — Faster AI, Saving, More Refinements".
 * Rendered in Layout on all pages except /settings.
 * Hidden for founders and users already on Lite plan.
 */
export default function UpgradeBanner() {
  const { user } = useContext(AuthContext);
  const isLite = user?.plan === "lite";
  const founder = isFounder(user);

  if (isLite || founder) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-3 rounded-lg border flex items-center justify-between"
      style={{
        background: "linear-gradient(90deg, rgba(255,122,61,0.08), rgba(139,69,19,0.06))",
        borderColor: "rgba(232,114,42,0.25)",
        fontFamily: "var(--font-heading)",
        fontSize: "11px",
        letterSpacing: "1px"
      }}
    >
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-brand-orange" />
        <span className="uppercase tracking-widest">Upgrade to Lite — Faster AI, Saving, More Refinements</span>
      </div>
      <Link to="/pricing">
        <Button size="sm" variant="outline" style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px" }}>View Plans</Button>
      </Link>
    </motion.div>
  );
}
