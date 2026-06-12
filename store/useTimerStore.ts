import { create } from "zustand";

type Phase = "idle" | "round" | "rest" | "done";
export type TimerEvent = "none" | "transition" | "finish";

interface TimerStore {
  rounds:       number;
  roundSecs:    number;
  restSecs:     number;
  phase:        Phase;
  currentRound: number;
  remaining:    number;
  phaseTotal:   number;
  isRunning:    boolean;
  muted:        boolean;
  lastEvent:    TimerEvent;

  setConfig: (rounds: number, roundSecs: number, restSecs: number) => void;
  start:     () => void;
  pause:     () => void;
  resume:    () => void;
  reset:     () => void;
  tick:      () => void;
  addTime:   (secs: number) => void;
  setMuted:  (v: boolean) => void;
  clearEvent: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  rounds:       1,
  roundSecs:    300,
  restSecs:     60,
  phase:        "idle",
  currentRound: 1,
  remaining:    300,
  phaseTotal:   300,
  isRunning:    false,
  muted:        false,
  lastEvent:    "none",

  setConfig: (rounds, roundSecs, restSecs) =>
    set({ rounds, roundSecs, restSecs, remaining: roundSecs, phaseTotal: roundSecs }),

  start: () => {
    const { roundSecs } = get();
    set({ phase: "round", currentRound: 1, remaining: roundSecs, phaseTotal: roundSecs, isRunning: true, lastEvent: "none" });
  },

  pause:  () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),

  reset: () => {
    const { roundSecs } = get();
    set({ phase: "idle", currentRound: 1, remaining: roundSecs, phaseTotal: roundSecs, isRunning: false, lastEvent: "none" });
  },

  tick: () => {
    const s = get();
    if (!s.isRunning || s.phase === "idle" || s.phase === "done") return;

    if (s.remaining > 1) {
      set({ remaining: s.remaining - 1 });
      return;
    }

    // Phase ended
    if (s.phase === "round") {
      const isLast = s.currentRound >= s.rounds;
      if (isLast) {
        set({ remaining: 0, isRunning: false, phase: "done", lastEvent: "finish" });
      } else if (s.restSecs > 0) {
        set({ remaining: s.restSecs, phaseTotal: s.restSecs, phase: "rest", currentRound: s.currentRound, lastEvent: "transition" });
      } else {
        set({ remaining: s.roundSecs, phaseTotal: s.roundSecs, phase: "round", currentRound: s.currentRound + 1, lastEvent: "transition" });
      }
    } else if (s.phase === "rest") {
      set({ remaining: s.roundSecs, phaseTotal: s.roundSecs, phase: "round", currentRound: s.currentRound + 1, lastEvent: "transition" });
    }
  },

  addTime: (secs) => {
    const s = get();
    const newRemaining  = Math.max(1, s.remaining + secs);
    const newPhaseTotal = Math.max(1, s.phaseTotal + secs);
    set({ remaining: newRemaining, phaseTotal: newPhaseTotal });
  },

  setMuted:   (v) => set({ muted: v }),
  clearEvent: ()  => set({ lastEvent: "none" }),
}));
