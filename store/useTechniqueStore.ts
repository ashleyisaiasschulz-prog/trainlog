"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

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
  userId: string | null;
  add: (t: TechniqueNote) => void;
  update: (t: TechniqueNote) => void;
  remove: (id: string) => void;
  loadFromCloud: (userId: string) => Promise<void>;
  signOut: () => void;
}

const sb = () => createClient();

interface TechRow {
  id: string; user_id: string; name: string;
  category: string; notes: string | null; date: string;
}

const rowToTech = (r: TechRow): TechniqueNote => ({
  id: r.id, name: r.name, category: (r.category as TechniqueCategory) ?? "general",
  notes: r.notes ?? "", date: r.date,
});

const techToRow = (t: TechniqueNote, userId: string) => ({
  id: t.id, user_id: userId, name: t.name, category: t.category, notes: t.notes, date: t.date,
});

export const useTechniqueStore = create<TechniqueStore>()(
  persist(
    (set, get) => ({
      techniques: [],
      userId: null,

      add: (t) => {
        set((s) => ({ techniques: [t, ...s.techniques] }));
        const uid = get().userId; if (!uid) return;
        sb().from("technique_notes").insert(techToRow(t, uid)).then();
      },
      update: (t) => {
        set((s) => ({ techniques: s.techniques.map((x) => x.id === t.id ? t : x) }));
        const uid = get().userId; if (!uid) return;
        sb().from("technique_notes").update(techToRow(t, uid)).eq("id", t.id).then();
      },
      remove: (id) => {
        set((s) => ({ techniques: s.techniques.filter((x) => x.id !== id) }));
        if (!get().userId) return;
        sb().from("technique_notes").delete().eq("id", id).then();
      },

      loadFromCloud: async (userId) => {
        set({ userId });
        const { data } = await sb()
          .from("technique_notes").select("*").eq("user_id", userId)
          .order("date", { ascending: false });
        if (data) set({ techniques: (data as TechRow[]).map(rowToTech) });
      },

      signOut: () => set({ userId: null, techniques: [] }),
    }),
    {
      name: "grapplr-techniques",
      partialize: (s) => ({ techniques: s.techniques }),
    }
  )
);
