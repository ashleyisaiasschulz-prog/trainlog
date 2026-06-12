"use client";

import { useEffect, useRef } from "react";
import { useTimerStore, TimerEvent } from "@/store/useTimerStore";

/* Warm triangle-oscillator bell */
function chime(ctx: AudioContext, freq: number, delayMs = 0, vol = 0.45) {
  const t = ctx.currentTime + delayMs / 1000;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  // Add slight harmonics for warmth
  const osc2  = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc.type  = "triangle"; osc.frequency.setValueAtTime(freq, t);
  osc2.type = "sine";     osc2.frequency.setValueAtTime(freq * 2, t);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

  gain2.gain.setValueAtTime(0, t);
  gain2.gain.linearRampToValueAtTime(vol * 0.25, t + 0.008);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

  osc.connect(gain);   gain.connect(ctx.destination);
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc.start(t);  osc.stop(t + 0.9);
  osc2.start(t); osc2.stop(t + 0.6);
}

/* Two-tone rising transition (round ↔ rest) */
function playTransition(ctx: AudioContext) {
  chime(ctx, 523, 0,   0.35); // C5
  chime(ctx, 659, 200, 0.35); // E5
}

/* Ascending fanfare for finish */
function playFinish(ctx: AudioContext) {
  chime(ctx, 523,  0,   0.4); // C5
  chime(ctx, 659,  200, 0.4); // E5
  chime(ctx, 784,  400, 0.4); // G5
  chime(ctx, 1047, 650, 0.5); // C6
}

export default function TimerRunner() {
  const { isRunning, muted, lastEvent, tick, clearEvent } = useTimerStore();
  const audioCtx = useRef<AudioContext | null>(null);

  // Tick every second
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  // Play sounds on events
  useEffect(() => {
    if (lastEvent === "none" || muted) { clearEvent(); return; }
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    ctx.resume().then(() => {
      if (lastEvent === "transition") playTransition(ctx);
      else if (lastEvent === "finish") playFinish(ctx);
    });
    clearEvent();
  }, [lastEvent, muted, clearEvent]);

  return null;
}
