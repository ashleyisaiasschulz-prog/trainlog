"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GymStore {
  // Cached gym ids of the current user, so the nav can link straight to the
  // gym without an async lookup + redirect hop.
  gymIds: string[];
  setGymIds: (ids: string[]) => void;
}

export const useGymStore = create<GymStore>()(
  persist(
    (set) => ({
      gymIds: [],
      setGymIds: (ids) => set({ gymIds: ids }),
    }),
    { name: "grapplr-gyms" }
  )
);
