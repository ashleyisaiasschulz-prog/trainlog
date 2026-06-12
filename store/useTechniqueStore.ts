"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TechniqueCategory =
  | "guard" | "passing" | "submissions" | "takedowns"
  | "defense" | "back" | "general";

export const TECHNIQUE_CATEGORIES: { value: TechniqueCategory; label: string }[] = [
  { value: "guard",       label: "Guard" },
  { value: "passing",     label: "Passing" },
  { value: "submissions", label: "Submissions" },
  { value: "takedowns",   label: "Takedowns" },
  { value: "defense",     label: "Defense" },
  { value: "back",        label: "Back Control" },
  { value: "general",     label: "General" },
];

export interface TechniqueNote {
  id: string;
  name: string;
  category: TechniqueCategory;
  notes: string;
  date: string;
}

interface TechniqueStore {
  techniques: TechniqueNote[];
  add: (t: TechniqueNote) => void;
  update: (t: TechniqueNote) => void;
  remove: (id: string) => void;
}

export const useTechniqueStore = create<TechniqueStore>()(
  persist(
    (set) => ({
      techniques: [],
      add:    (t) => set((s) => ({ techniques: [t, ...s.techniques] })),
      update: (t) => set((s) => ({ techniques: s.techniques.map((x) => x.id === t.id ? t : x) })),
      remove: (id) => set((s) => ({ techniques: s.techniques.filter((x) => x.id !== id) })),
    }),
    { name: "grapplr-techniques" }
  )
);
