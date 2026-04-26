import { useEffect, useRef, useState } from "react";

const DISPLAY_DURATION_MS = 2000;

export default function LevelUpOverlay() {
  const [payload, setPayload] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function handleLevelUp(event) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setPayload({
        level: event.detail?.level ?? 1,
        rankTitle: event.detail?.rankTitle ?? "New Rank",
      });

      timeoutRef.current = setTimeout(() => {
        setPayload(null);
      }, DISPLAY_DURATION_MS);
    }

    window.addEventListener("visionary:level-up", handleLevelUp);
    return () => {
      window.removeEventListener("visionary:level-up", handleLevelUp);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!payload) return null;

  return (
    <>
      <style>{`
        @keyframes levelUpPulse {
          0% {
            opacity: 0;
            transform: scale(0.78);
          }
          15% {
            opacity: 1;
            transform: scale(1.04);
          }
          65% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.14);
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/82 backdrop-blur-sm pointer-events-none">
        <div
          className="mx-4 w-full max-w-xl rounded-[2rem] border border-[color:color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-[1px] shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
          style={{ animation: `levelUpPulse ${DISPLAY_DURATION_MS}ms ease-out forwards` }}
        >
          <div className="rounded-[calc(2rem-1px)] bg-slate-950/88 px-8 py-12 text-center text-[var(--text-primary)]">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-amber-200/80">
              Level Up
            </p>
            <p className="mt-4 text-6xl font-black tracking-tight sm:text-7xl">
              Level {payload.level}
            </p>
            <p className="mt-4 text-2xl font-semibold text-amber-100 sm:text-3xl">
              {payload.rankTitle}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
