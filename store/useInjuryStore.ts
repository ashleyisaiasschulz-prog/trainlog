"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  bodyPart: BodyPart;
  type: InjuryType;
  severity: 1 | 2 | 3;
  startDate: string;
  endDate: string | null;
  notes: string;
}

interface InjuryStore {
  injuries: Injury[];
  add:    (i: Injury) => void;
  update: (i: Injury) => void;
  remove: (id: string) => void;
  heal:   (id: string, endDate: string) => void;
}

export const useInjuryStore = create<InjuryStore>()(
  persist(
    (set) => ({
      injuries: [],
      add:    (i) => set((s) => ({ injuries: [i, ...s.injuries] })),
      update: (i) => set((s) => ({ injuries: s.injuries.map((x) => x.id === i.id ? i : x) })),
      remove: (id) => set((s) => ({ injuries: s.injuries.filter((x) => x.id !== id) })),
      heal:   (id, endDate) => set((s) => ({
        injuries: s.injuries.map((x) => x.id === id ? { ...x, endDate } : x),
      })),
    }),
    { name: "grapplr-injuries" }
  )
);
