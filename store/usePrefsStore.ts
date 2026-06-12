"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrefsStore {
  trackSubmissions: boolean;
  trackSweeps: boolean;
  trackEscapes: boolean;
  setTrackSubmissions: (v: boolean) => void;
  setTrackSweeps: (v: boolean) => void;
  setTrackEscapes: (v: boolean) => void;
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      trackSubmissions: true,
      trackSweeps: true,
      trackEscapes: true,
      setTrackSubmissions: (v) => set({ trackSubmissions: v }),
      setTrackSweeps: (v) => set({ trackSweeps: v }),
      setTrackEscapes: (v) => set({ trackEscapes: v }),
    }),
    { name: "grapplr-prefs" }
  )
);
