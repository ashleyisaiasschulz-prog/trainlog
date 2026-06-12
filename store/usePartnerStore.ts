"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PARTNER_TAGS = [
  "Guard Player", "Passer", "Wrestler", "Judo", "Leg Locker",
  "Back Taker", "Submission Hunter", "Defensive", "Athletic", "Technical",
] as const;

export interface Partner {
  id: string;
  name: string;
  belt: string;
  gym: string;
  notes: string;
  watchFor: string;
  tags: string[];
  date: string;
}

interface PartnerStore {
  partners: Partner[];
  add:    (p: Partner) => void;
  update: (p: Partner) => void;
  remove: (id: string) => void;
}

export const usePartnerStore = create<PartnerStore>()(
  persist(
    (set) => ({
      partners: [],
      add:    (p) => set((s) => ({ partners: [p, ...s.partners] })),
      update: (p) => set((s) => ({ partners: s.partners.map((x) => x.id === p.id ? p : x) })),
      remove: (id) => set((s) => ({ partners: s.partners.filter((x) => x.id !== id) })),
    }),
    { name: "grapplr-partners" }
  )
);
