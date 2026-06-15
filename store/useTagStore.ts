"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import {
  POSITIONS, SUBMISSIONS, SWEEP_TYPES, ESCAPE_TYPES,
} from "@/lib/types";
import { BODY_PARTS, INJURY_TYPES } from "@/store/useInjuryStore";

export type TagCategory =
  | "positions" | "submissions" | "sweeps" | "escapes"
  | "bodyParts" | "injuryTypes";

const CATEGORIES: TagCategory[] = [
  "positions", "submissions", "sweeps", "escapes", "bodyParts", "injuryTypes",
];

type TagMap = Record<TagCategory, string[]>;

interface TagStore extends TagMap {
  userId: string | null;
  add:    (cat: TagCategory, value: string) => void;
  remove: (cat: TagCategory, value: string) => void;
  rename: (cat: TagCategory, oldValue: string, newValue: string) => void;
  reset:  (cat: TagCategory) => void;
  loadFromCloud: (userId: string) => Promise<void>;
  signOut: () => void;
}

const DEFAULTS: TagMap = {
  positions:   [...POSITIONS],
  submissions: [...SUBMISSIONS],
  sweeps:      [...SWEEP_TYPES],
  escapes:     [...ESCAPE_TYPES],
  bodyParts:   BODY_PARTS.map((b) => b.label),
  injuryTypes: INJURY_TYPES.map((t) => t.label),
};

const sb = () => createClient();

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => {
      /** Snapshot of just the six tag arrays. */
      const snapshot = (s: TagStore): TagMap => ({
        positions: s.positions, submissions: s.submissions, sweeps: s.sweeps,
        escapes: s.escapes, bodyParts: s.bodyParts, injuryTypes: s.injuryTypes,
      });

      /** Write the current palette to the user's profile (write-through). */
      const push = () => {
        const { userId } = get();
        if (!userId) return;
        sb().from("profiles").update({ custom_tags: snapshot(get()) }).eq("id", userId).then();
      };

      return {
        ...DEFAULTS,
        userId: null,

        add: (cat, value) => {
          const v = value.trim();
          if (!v || get()[cat].some((x) => x.toLowerCase() === v.toLowerCase())) return;
          set((s) => ({ [cat]: [...s[cat], v] } as Partial<TagStore>));
          push();
        },
        remove: (cat, value) => {
          set((s) => ({ [cat]: s[cat].filter((x) => x !== value) } as Partial<TagStore>));
          push();
        },
        rename: (cat, oldValue, newValue) => {
          const v = newValue.trim();
          if (!v) return;
          set((s) => ({ [cat]: s[cat].map((x) => (x === oldValue ? v : x)) } as Partial<TagStore>));
          push();
        },
        reset: (cat) => {
          set(() => ({ [cat]: DEFAULTS[cat] } as Partial<TagStore>));
          push();
        },

        // ── Cloud sync ──
        loadFromCloud: async (userId) => {
          set({ userId });
          const { data } = await sb().from("profiles").select("custom_tags").eq("id", userId).maybeSingle();
          const cloud = data?.custom_tags as Partial<TagMap> | null | undefined;
          if (cloud && typeof cloud === "object") {
            // Take each category from the cloud when present, else keep defaults.
            const next: Partial<TagStore> = {};
            for (const cat of CATEGORIES) {
              if (Array.isArray(cloud[cat])) next[cat] = cloud[cat]!;
            }
            set(next);
          } else {
            // No cloud palette yet → seed it from whatever this device has.
            sb().from("profiles").update({ custom_tags: snapshot(get()) }).eq("id", userId).then();
          }
        },

        signOut: () => set({ userId: null, ...DEFAULTS }),
      };
    },
    {
      name: "grapplr-tags",
      // Don't persist userId — it's session-scoped.
      partialize: (s) => ({
        positions: s.positions, submissions: s.submissions, sweeps: s.sweeps,
        escapes: s.escapes, bodyParts: s.bodyParts, injuryTypes: s.injuryTypes,
      }),
    }
  )
);
