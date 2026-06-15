"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

export type BodyPart =
  | "knee" | "shoulder" | "neck" | "ribs" | "ankle"
  | "finger" | "back" | "elbow" | "wrist" | "hip" | "other";

export type InjuryType = "strain" | "sprain" | "bruise" | "tear" | "fracture" | "other";

export const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: "knee",     label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "ankle",    label: "Ankle" },
  { value: "back",     label: "Back" },
  { value: "neck",     label: "Neck" },
  { value: "ribs",     label: "Ribs" },
  { value: "elbow",    label: "Elbow" },
  { value: "wrist",    label: "Wrist" },
  { value: "finger",   label: "Finger / Toe" },
  { value: "hip",      label: "Hip" },
  { value: "other",    label: "Other" },
];

export const INJURY_TYPES: { value: InjuryType; label: string }[] = [
  { value: "strain",   label: "Strain / Pull" },
  { value: "sprain",   label: "Sprain" },
  { value: "bruise",   label: "Bruise" },
  { value: "tear",     label: "Tear" },
  { value: "fracture", label: "Fracture" },
  { value: "other",    label: "Other" },
];

export interface Injury {
  id: string;
  bodyPart: string;  // label from useTagStore (custom-editable)
  type: string;      // label from useTagStore (custom-editable)
  severity: 1 | 2 | 3;
  startDate: string;
  endDate: string | null;
  notes: string;
}

/** Display helper: maps legacy stored values (e.g. "knee") to a label, otherwise returns as-is. */
export function bodyPartLabel(v: string) {
  return BODY_PARTS.find((b) => b.value === v)?.label ?? v;
}
export function injuryTypeLabel(v: string) {
  return INJURY_TYPES.find((t) => t.value === v)?.label ?? v;
}

interface InjuryStore {
  injuries: Injury[];
  userId: string | null;
  add:    (i: Injury) => void;
  update: (i: Injury) => void;
  remove: (id: string) => void;
  heal:   (id: string, endDate: string) => void;
  loadFromCloud: (userId: string) => Promise<void>;
  signOut: () => void;
}

const sb = () => createClient();

interface InjuryRow {
  id: string; user_id: string; body_part: string; type: string;
  severity: number; start_date: string; end_date: string | null; notes: string | null;
}

const rowToInjury = (r: InjuryRow): Injury => ({
  id: r.id, bodyPart: r.body_part, type: r.type,
  severity: (r.severity as 1 | 2 | 3) ?? 1,
  startDate: r.start_date, endDate: r.end_date, notes: r.notes ?? "",
});

const injuryToRow = (i: Injury, userId: string) => ({
  id: i.id, user_id: userId, body_part: i.bodyPart, type: i.type,
  severity: i.severity, start_date: i.startDate, end_date: i.endDate, notes: i.notes,
});

export const useInjuryStore = create<InjuryStore>()(
  persist(
    (set, get) => ({
      injuries: [],
      userId: null,

      add: (i) => {
        set((s) => ({ injuries: [i, ...s.injuries] }));
        const uid = get().userId; if (!uid) return;
        sb().from("injuries").insert(injuryToRow(i, uid)).then();
      },
      update: (i) => {
        set((s) => ({ injuries: s.injuries.map((x) => x.id === i.id ? i : x) }));
        const uid = get().userId; if (!uid) return;
        sb().from("injuries").update(injuryToRow(i, uid)).eq("id", i.id).then();
      },
      remove: (id) => {
        set((s) => ({ injuries: s.injuries.filter((x) => x.id !== id) }));
        if (!get().userId) return;
        sb().from("injuries").delete().eq("id", id).then();
      },
      heal: (id, endDate) => {
        set((s) => ({ injuries: s.injuries.map((x) => x.id === id ? { ...x, endDate } : x) }));
        const uid = get().userId; if (!uid) return;
        const i = get().injuries.find((x) => x.id === id);
        if (i) sb().from("injuries").update(injuryToRow({ ...i, endDate }, uid)).eq("id", id).then();
      },

      loadFromCloud: async (userId) => {
        set({ userId });
        const { data } = await sb()
          .from("injuries").select("*").eq("user_id", userId)
          .order("start_date", { ascending: false });
        if (data) set({ injuries: (data as InjuryRow[]).map(rowToInjury) });
      },

      signOut: () => set({ userId: null, injuries: [] }),
    }),
    {
      name: "grapplr-injuries",
      partialize: (s) => ({ injuries: s.injuries }),
    }
  )
);
