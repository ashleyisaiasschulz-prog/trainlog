"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

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
  userId: string | null;
  add:    (p: Partner) => void;
  update: (p: Partner) => void;
  remove: (id: string) => void;
  loadFromCloud: (userId: string) => Promise<void>;
  signOut: () => void;
}

const sb = () => createClient();

interface PartnerRow {
  id: string; user_id: string; name: string; belt: string | null;
  gym: string | null; notes: string | null; watch_for: string | null;
  tags: string[] | null; date: string;
}

const rowToPartner = (r: PartnerRow): Partner => ({
  id: r.id, name: r.name, belt: r.belt ?? "", gym: r.gym ?? "",
  notes: r.notes ?? "", watchFor: r.watch_for ?? "", tags: r.tags ?? [], date: r.date,
});

const partnerToRow = (p: Partner, userId: string) => ({
  id: p.id, user_id: userId, name: p.name, belt: p.belt, gym: p.gym,
  notes: p.notes, watch_for: p.watchFor, tags: p.tags, date: p.date,
});

export const usePartnerStore = create<PartnerStore>()(
  persist(
    (set, get) => ({
      partners: [],
      userId: null,

      add: (p) => {
        set((s) => ({ partners: [p, ...s.partners] }));
        const uid = get().userId; if (!uid) return;
        sb().from("partner_notes").insert(partnerToRow(p, uid)).then();
      },
      update: (p) => {
        set((s) => ({ partners: s.partners.map((x) => x.id === p.id ? p : x) }));
        const uid = get().userId; if (!uid) return;
        sb().from("partner_notes").update(partnerToRow(p, uid)).eq("id", p.id).then();
      },
      remove: (id) => {
        set((s) => ({ partners: s.partners.filter((x) => x.id !== id) }));
        if (!get().userId) return;
        sb().from("partner_notes").delete().eq("id", id).then();
      },

      loadFromCloud: async (userId) => {
        set({ userId });
        const { data } = await sb()
          .from("partner_notes").select("*").eq("user_id", userId)
          .order("date", { ascending: false });
        if (data) set({ partners: (data as PartnerRow[]).map(rowToPartner) });
      },

      signOut: () => set({ userId: null, partners: [] }),
    }),
    {
      name: "grapplr-partners",
      partialize: (s) => ({ partners: s.partners }),
    }
  )
);
