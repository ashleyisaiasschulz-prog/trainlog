"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Plus } from "lucide-react";

const PRESETS = [
  { label: "5", seconds: 300 },
  { label: "6", seconds: 360 },
  { label: "7", seconds: 420 },
  { label: "8", seconds: 480 },
  { label: "10", seconds: 600 },
];

function beep(ctx: AudioContext, freq = 880, duration = 0.15, gain = 0.6) {
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playFinish(ctx: AudioContext) {
  [0, 0.18, 0.36].forEach((delay) =>
    setTimeout(() => beep(ctx, 660, 0.25, 0.8), delay * 1000)
  );
}

export default function TimerModal({ onClose }: { onClose: () => void }) {
  const [total,     setTotal]     = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running,   setRunning]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [muted,     setMuted]     = useState(false);
  const audioCtx    = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    return audioCtx.current;
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          if (!muted) playFinish(getCtx());
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, muted, getCtx]);

  function start() {
    if (done) return;
    getCtx().resume();
    setRunning(true);
  }
  function pause() { setRunning(false); }
  function reset(secs = total) {
    setRunning(false);
    setDone(false);
    setRemaining(secs);
  }
  function pickPreset(secs: number) {
    setTotal(secs);
    reset(secs);
  }
  function addTime(secs: number) {
    setDone(false);
    setRemaining((r) => r + secs);
    setTotal((t) => t + secs);
  }

  const progress = remaining / total;
  const R        = 96;
  const CIRC     = 2 * Math.PI * R;
  const offset   = CIRC * (1 - progress);
  const mins     = Math.floor(remaining / 60).toString().padStart(2, "0");
  const secs     = (remaining % 60).toString().padStart(2, "0");
  const ringColor = done ? "#ef4444" : running ? "#f97316" : "#e11d48";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-6">

        {/* Handle + header */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h2 className="text-base font-bold text-zinc-100">Round Timer</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted((m) => !m)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Ring */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            <svg width={220} height={220} viewBox="0 0 220 220" className="-rotate-90">
              <circle cx={110} cy={110} r={R} fill="none" stroke="#27272a" strokeWidth={12} />
              <circle cx={110} cy={110} r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center gap-1">
              {done ? (
                <span className="text-3xl font-black text-red-400">Done!</span>
              ) : (
                <span className="text-[48px] font-black text-zinc-100 tracking-tighter leading-none tabular-nums">
                  {mins}:{secs}
                </span>
              )}
              <span className="text-[11px] text-zinc-500 font-medium">
                {done ? "Tap reset" : running ? "Running" : remaining === total ? "Ready" : "Paused"}
              </span>
            </div>
          </div>

          {/* +30s / +1min */}
          <div className="flex gap-3">
            <button onClick={() => addTime(30)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all text-xs font-semibold">
              <Plus size={12} />30s
            </button>
            <button onClick={() => addTime(60)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all text-xs font-semibold">
              <Plus size={12} />1 min
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          <button onClick={() => reset()}
            className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all active:scale-95">
            <RotateCcw size={18} />
          </button>
          <button
            onClick={running ? pause : start}
            disabled={done}
            className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white transition-all active:scale-95 shadow-lg disabled:opacity-40
              ${running
                ? "bg-orange-500 shadow-orange-500/30 hover:bg-orange-400"
                : "bg-red-500 shadow-red-500/30 hover:bg-red-400"}`}>
            {running
              ? <Pause size={26} fill="white" />
              : <Play size={26} fill="white" className="ml-0.5" />}
          </button>
          <div className="w-12 h-12" />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest text-center">
            Round length (min)
          </p>
          <div className="flex gap-2 justify-center">
            {PRESETS.map((p) => (
              <button key={p.seconds} onClick={() => pickPreset(p.seconds)}
                className={`flex-1 max-w-[52px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95
                  ${total === p.seconds
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
