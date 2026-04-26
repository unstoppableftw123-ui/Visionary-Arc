import { useMemo } from "react";
import { useSelf, useOthers, useUpdateMyPresence } from "../../liveblocks.config";

/** Cursor colors assigned per user (purple, teal, orange, pink, yellow) */
export const CURSOR_COLORS = [
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#eab308",
];

/**
 * Get a stable color for a userId (for cursor/avatar).
 * @param {string} userId
 * @returns {string} hex color
 */
export function getColorForUserId(userId) {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

/**
 * Hook for study room presence: self, others, update presence, and current user's color.
 */
export function useRoomPresence() {
  const self = useSelf();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const myColor = useMemo(() => {
    const id = self?.connectionId?.toString() ?? self?.id ?? "";
    return getColorForUserId(id);
  }, [self?.connectionId, self?.id]);

  return {
    self,
    others,
    updateMyPresence,
    myColor,
    getColorForUserId,
  };
}
