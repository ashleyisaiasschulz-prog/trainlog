"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourStore {
  active: boolean;
  start: () => void;
  finish: () => void;
}

export const useTourStore = create<TourStore>()(
  persist(
    (set) => ({
      active: false,
      start:  () => set({ active: true }),
      finish: () => set({ active: false }),
    }),
    { name: "grapplr-tour" }
  )
);
