"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTimerStore } from "@/store/useTimerStore";
import { Play, Pause, Timer } from "lucide-react";

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function FloatingTimer() {
  const pathname = usePathname();
  const router   = useRouter();
  const { phase, remaining, currentRound, rounds, isRunning, pause, resume } = useTimerStore();

  if (pathname === "/timer") return null;
  if (phase === "idle" || phase === "done") return null;

  const isRest = phase === "rest";
  const label  = isRest
    ? "Rest"
    : rounds > 1 ? `R${currentRound}/${rounds}` : "Round";

  return (
    /* Sits just below the safe-area (notch / dynamic island) */
    <div
      className="fixed left-0 right-0 z-[55] flex justify-center pointer-events-none"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        onClick={() => router.push("/timer")}
        className={`pointer-events-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-2xl shadow-xl cursor-pointer
          backdrop-blur-xl border transition-all active:scale-[0.97]
          ${isRest
            ? "bg-blue-950/95 border-blue-800/60 text-blue-300"
            : "bg-zinc-900/95 border-zinc-700/60 text-zinc-100"}`}
      >
        <Timer size={13} className={isRest ? "text-blue-400" : "text-red-400"} />
        <span className="text-[13px] font-black tabular-nums tracking-tight">{fmt(remaining)}</span>
        <span className={`text-[11px] font-semibold ${isRest ? "text-blue-500" : "text-zinc-500"}`}>{label}</span>
        <div className="w-px h-3 bg-zinc-700 mx-0.5" />
        <button
          onClick={(e) => { e.stopPropagation(); isRunning ? pause() : resume(); }}
          className="text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {isRunning ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>
    </div>
  );
}
