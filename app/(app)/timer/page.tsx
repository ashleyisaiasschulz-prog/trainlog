"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, Plus, Minus } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { useT } from "@/lib/i18n";

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}
function fmtLabel(s: number) {
  if (s === 0) return "—";
  return s < 60 ? `${s}s` : `${s / 60}m`;
}

function Stepper({ label, onDec, onInc, display }: {
  label: string; onDec: () => void; onInc: () => void; display: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onDec}
          className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all shrink-0">
          <Minus size={11} />
        </button>
        <span className="w-9 text-center text-sm font-black text-white tabular-nums">{display}</span>
        <button type="button" onClick={onInc}
          className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all shrink-0">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

export default function TimerPage() {
  const router = useRouter();
  const t = useT();
  const {
    rounds, roundSecs, restSecs,
    phase, currentRound, remaining, phaseTotal,
    isRunning, muted,
    setConfig, start, pause, resume, reset, addTime, setMuted,
  } = useTimerStore();

  const isIdle = phase === "idle";
  const isDone = phase === "done";
  const isRest = phase === "rest";

  const progress  = phaseTotal > 0 ? Math.max(0, Math.min(1, remaining / phaseTotal)) : 1;
  const ringColor = isDone ? "#ef4444" : isRest ? "#3b82f6" : "#e11d48";
  const glowColor = isDone ? "#ef444466" : isRest ? "#3b82f666" : "#e11d4866";

  const phaseLabel = isDone ? t.phaseDone
    : isRest ? t.phaseRest
    : rounds > 1 ? `${t.phaseRound} ${currentRound} / ${rounds}` : t.phaseRound;

  const cx = 110; const cy = 110; const r = 95;
  const circ  = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    /* Full-screen overlay, centers content to max-w-md so it looks good on desktop too */
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-[#0a0a0a]">
      <div
        className="w-full max-w-md flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 hover:text-zinc-200 active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <span className="text-xs font-bold text-zinc-600 tracking-widest uppercase">Timer</span>
          <button onClick={() => setMuted(!muted)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 hover:text-zinc-200 active:scale-95 transition-all">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* ── Ring / idle display — takes all remaining height ── */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-5">

          {/* Phase badge */}
          {!isIdle && (
            <div className={`px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border
              ${isDone ? "bg-red-950/60 border-red-700/40 text-red-400"
              : isRest  ? "bg-blue-950/60 border-blue-700/40 text-blue-400"
              :           "bg-zinc-900 border-zinc-700/40 text-zinc-500"}`}>
              {phaseLabel}
            </div>
          )}

          {/* Idle: big ghost time */}
          {isIdle && (
            <div className="flex flex-col items-center gap-1">
              <span
                className="font-black tabular-nums tracking-tighter text-zinc-700 leading-none"
                style={{ fontSize: "min(18vw, 22vh, 88px)" }}
              >
                {fmt(roundSecs)}
              </span>
              <span className="text-[11px] text-zinc-700 uppercase tracking-widest font-semibold">{t.timerReady}</span>
            </div>
          )}

          {/* Running: ring — scales to fit both width AND available height */}
          {!isIdle && (
            <div
              className="relative flex items-center justify-center"
              style={{
                /* ring is square; constrain by width OR by remaining height */
                width:  "min(72vw, min(100%, 300px))",
                height: "min(72vw, min(100%, 300px))",
                /* clamp so it never eats into controls on short screens */
                maxHeight: "42vh",
                maxWidth:  "42vh",
              }}
            >
              <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90" style={{ overflow: "visible" }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#18181b" strokeWidth={10} />
                <circle cx={cx} cy={cy} r={r}
                  fill="none" stroke={ringColor} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  style={{
                    transition: isRunning ? "stroke-dashoffset 1s linear" : "none",
                    filter: `drop-shadow(0 0 8px ${glowColor})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {isDone ? (
                  <span className="text-3xl font-black text-red-400">{t.timerDone}</span>
                ) : (
                  <span
                    className="font-black tabular-nums tracking-tighter leading-none"
                    style={{ fontSize: "min(12vw, 14vh, 58px)", color: isRest ? "#93c5fd" : "white" }}
                  >
                    {fmt(remaining)}
                  </span>
                )}
                <span className="text-[10px] font-medium text-zinc-600">
                  {isRunning ? t.timerRunning : t.timerPaused}
                </span>
              </div>
            </div>
          )}

          {/* Time adjustment chips */}
          {!isIdle && !isDone && (
            <div className="flex gap-1.5">
              {[{ label: "−1m", delta: -60 }, { label: "−30s", delta: -30 },
                { label: "+30s", delta: 30 },  { label: "+1m",  delta: 60 }]
                .map(({ label, delta }) => (
                  <button key={label} onClick={() => addTime(delta)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400
                      hover:text-white hover:border-zinc-600 active:scale-95 transition-all text-[11px] font-bold">
                    {label}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* ── Config card — below ring, only when idle ── */}
        {isIdle && (
          <div className="mx-4 mb-4 bg-zinc-900/80 border border-zinc-800 rounded-3xl px-3 py-3 shrink-0">
            <div className="flex items-start">
              <Stepper label={t.timerRounds} display={String(rounds)}
                onDec={() => setConfig(Math.max(1, rounds - 1), roundSecs, restSecs)}
                onInc={() => setConfig(Math.min(20, rounds + 1), roundSecs, restSecs)}
              />
              <div className="w-px bg-zinc-800 self-stretch mx-1" />
              <Stepper label={t.timerRoundTime} display={fmtLabel(roundSecs)}
                onDec={() => setConfig(rounds, Math.max(30, roundSecs - 30), restSecs)}
                onInc={() => setConfig(rounds, roundSecs + 30, restSecs)}
              />
              <div className="w-px bg-zinc-800 self-stretch mx-1" />
              <Stepper label={t.timerRest} display={fmtLabel(restSecs)}
                onDec={() => setConfig(rounds, roundSecs, Math.max(0, restSecs - 30))}
                onInc={() => setConfig(rounds, roundSecs, restSecs + 30)}
              />
            </div>
            <p className="text-center text-[11px] text-zinc-600 mt-3">
              {rounds === 1
                ? `1 ${t.timerRound} · ${fmtLabel(roundSecs)}`
                : restSecs > 0
                  ? `${rounds} × ${fmtLabel(roundSecs)} · ${fmtLabel(restSecs)} ${t.timerRest}`
                  : `${rounds} × ${fmtLabel(roundSecs)} · ${t.timerNoRest}`}
            </p>
          </div>
        )}

        {/* ── Controls ── pb-24 = 96px > 64px navbar, clears on all devices */}
        <div className="flex items-center justify-center gap-6 px-5 pt-2 pb-24 shrink-0">
          <button onClick={reset}
            className="w-[52px] h-[52px] rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center
              text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 active:scale-95 transition-all">
            <RotateCcw size={18} />
          </button>

          {isIdle && (
            <button onClick={start}
              className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center bg-red-500 text-white
                shadow-[0_0_28px_rgba(225,29,72,0.45)] hover:bg-red-400 active:scale-95 transition-all">
              <Play size={28} fill="white" className="ml-1" />
            </button>
          )}
          {!isIdle && !isDone && isRunning && (
            <button onClick={pause}
              className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center bg-zinc-700 text-white
                hover:bg-zinc-600 active:scale-95 transition-all">
              <Pause size={28} fill="white" />
            </button>
          )}
          {!isIdle && !isDone && !isRunning && (
            <button onClick={resume}
              className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center bg-red-500 text-white
                shadow-[0_0_28px_rgba(225,29,72,0.45)] hover:bg-red-400 active:scale-95 transition-all">
              <Play size={28} fill="white" className="ml-1" />
            </button>
          )}
          {isDone && (
            <button onClick={reset}
              className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center bg-zinc-800 text-white
                hover:bg-zinc-700 active:scale-95 transition-all">
              <RotateCcw size={26} />
            </button>
          )}
          <div className="w-[52px] h-[52px]" />
        </div>

      </div>
    </div>
  );
}
