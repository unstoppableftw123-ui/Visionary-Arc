import { useContext } from "react";
import { toast } from "sonner";
import { AuthContext } from "../../../App";
import apiService from "../../../services/apiService";
import { supabase } from "../../../services/supabaseClient";

export function useXPReward() {
  const { user, setUser } = useContext(AuthContext);

  const awardXP = async ({ amount, reason, classId }) => {
    try {
      const result = await apiService.xp.award({ amount, reason, classId });

      if (result?.user) {
        setUser(result.user);

        // Persist XP to Supabase
        if (user?.id) {
          const newXp = result.user.xp;
          const newLevel = result.user.level;
          supabase
            .from("users")
            .update({ xp: newXp, level: newLevel })
            .eq("id", user.id);
          supabase
            .from("xp_events")
            .insert({ user_id: user.id, amount, reason });
        }
      }

      if (result?.leveledUp && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("visionary:level-up", {
            detail: {
              level: result.newLevel,
              rankTitle: result.rankTitle,
            },
          })
        );
      }

      toast.custom(
        () => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "1px solid rgba(124, 109, 240, 0.4)",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(124,109,240,0.15)",
              minWidth: "220px",
            }}
          >
            <span style={{ fontSize: "22px", lineHeight: 1 }}>⚡</span>
            <div>
              <div
                style={{
                  color: "#c4b5fd",
                  fontWeight: 700,
                  fontSize: "15px",
                  letterSpacing: "0.02em",
                }}
              >
                +{amount} XP
              </div>
              <div style={{ color: "#a0a0c0", fontSize: "12px", marginTop: "1px" }}>
                {reason}
              </div>
            </div>
          </div>
        ),
        {
          duration: 2500,
          position: "bottom-right",
        }
      );

      return result;
    } catch (error) {
      toast.error("Failed to award XP");
      return null;
    }
  };

  return { awardXP };
}
