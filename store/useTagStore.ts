"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  POSITIONS, SUBMISSIONS, SWEEP_TYPES, ESCAPE_TYPES,
} from "@/lib/types";
import { BODY_PARTS, INJURY_TYPES } from "@/store/useInjuryStore";

export type TagCategory =
  | "positions" | "submissions" | "sweeps" | "escapes"
  | "bodyParts" | "injuryTypes";

interface TagStore {
  positions:   string[];
  submissions: string[];
  sweeps:      string[];
  escapes:     string[];
  bodyParts:   string[];
  injuryTypes: string[];
  add:    (cat: TagCategory, value: string) => void;
  remove: (cat: TagCategory, value: string) => void;
  rename: (cat: TagCategory, oldValue: string, newValue: string) => void;
  reset:  (cat: TagCategory) => void;
}

const DEFAULTS: Record<TagCategory, string[]> = {
  positions:   [...POSITIONS],
  submissions: [...SUBMISSIONS],
  sweeps:      [...SWEEP_TYPES],
  escapes:     [...ESCAPE_TYPES],
  bodyParts:   BODY_PARTS.map((b) => b.label),
  injuryTypes: INJURY_TYPES.map((t) => t.label),
};

export const useTagStore = create<TagStore>()(
  persist(
    (set) => ({
      positions:   DEFAULTS.positions,
      submissions: DEFAULTS.submissions,
      sweeps:      DEFAULTS.sweeps,
      escapes:     DEFAULTS.escapes,
      bodyParts:   DEFAULTS.bodyParts,
      injuryTypes: DEFAULTS.injuryTypes,
      add: (cat, value) => set((s) => {
        const v = value.trim();
        if (!v || s[cat].some((x) => x.toLowerCase() === v.toLowerCase())) return {};
        return { [cat]: [...s[cat], v] } as Partial<TagStore>;
      }),
      remove: (cat, value) => set((s) => ({
        [cat]: s[cat].filter((x) => x !== value),
      } as Partial<TagStore>)),
      rename: (cat, oldValue, newValue) => set((s) => {
        const v = newValue.trim();
        if (!v) return {};
        return { [cat]: s[cat].map((x) => (x === oldValue ? v : x)) } as Partial<TagStore>;
      }),
      reset: (cat) => set(() => ({ [cat]: DEFAULTS[cat] } as Partial<TagStore>)),
    }),
    { name: "grapplr-tags" }
  )
);
