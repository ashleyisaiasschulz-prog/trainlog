"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TrainingSession, BeltPromotion, Tournament, Belt, Schedule, CheckIn, BELT_ORDER,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// A session write that hasn't been confirmed by the server yet (e.g. logged
// while offline). Kept in localStorage so it survives an app restart and is
// flushed on reconnect.
interface PendingOp { id: string; action: "upsert" | "delete" }
const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;
const withPending = (pending: PendingOp[], id: string, action: "upsert" | "delete"): PendingOp[] =>
  [...pending.filter(p => p.id !== id), { id, action }];

function deriveCurrentBelt(promotions: BeltPromotion[]): { belt: Belt; stripes: number } {
  if (promotions.length === 0) return { belt: "white", stripes: 0 };
  const maxRank = Math.max(...promotions.map(p => BELT_ORDER.indexOf(p.toBelt)));
  const highestBelt = BELT_ORDER[maxRank];
  const sameBelt = promotions.filter(p => p.toBelt === highestBelt);
  const maxStripes = Math.max(...sameBelt.map(p => p.stripes));
  return { belt: highestBelt, stripes: maxStripes };
}

// ── DB ⇄ App mappers ─────────────────────────────────────────────
const sb = () => createClient();

function rowToSession(r: any): TrainingSession {
  return {
    id: r.id, date: r.date, gym: r.gym ?? "", duration: r.duration, gi: r.gi,
    intensity: r.intensity, positions: r.positions ?? [],
    submissionsGiven: r.submissions_given ?? [], submissionsReceived: r.submissions_received ?? [],
    sweepsGiven: r.sweeps_given ?? [], sweepsReceived: r.sweeps_received ?? [],
    escapesGiven: r.escapes_given ?? [], escapesReceived: r.escapes_received ?? [],
    notes: r.notes ?? "", whatWorked: r.what_worked ?? "", whatDidntWork: r.what_didnt_work ?? "",
    focus: r.focus ?? "", scheduleId: r.schedule_id ?? undefined,
  };
}
function sessionToRow(s: TrainingSession, userId: string) {
  return {
    id: s.id, user_id: userId, date: s.date, gym: s.gym, duration: s.duration, gi: s.gi,
    intensity: s.intensity, positions: s.positions,
    submissions_given: s.submissionsGiven ?? [], submissions_received: s.submissionsReceived ?? [],
    sweeps_given: s.sweepsGiven ?? [], sweeps_received: s.sweepsReceived ?? [],
    escapes_given: s.escapesGiven ?? [], escapes_received: s.escapesReceived ?? [],
    notes: s.notes, what_worked: s.whatWorked, what_didnt_work: s.whatDidntWork,
    focus: s.focus, schedule_id: s.scheduleId ?? null,
  };
}
function rowToPromo(r: any): BeltPromotion {
  return { id: r.id, date: r.date, fromBelt: r.from_belt, toBelt: r.to_belt,
    stripes: r.stripes, gym: r.gym ?? "", coachNote: r.coach_note ?? "" };
}
function promoToRow(p: BeltPromotion, userId: string) {
  return { id: p.id, user_id: userId, date: p.date, from_belt: p.fromBelt,
    to_belt: p.toBelt, stripes: p.stripes, gym: p.gym, coach_note: p.coachNote };
}
function rowToTournament(r: any): Tournament {
  return { id: r.id, name: r.name, date: r.date, location: r.location ?? "",
    weightClass: r.weight_class ?? "", gi: r.gi, placement: r.placement ?? "",
    notes: r.notes ?? "", matches: r.matches ?? [] };
}
function tournamentToRow(t: Tournament, userId: string) {
  return { id: t.id, user_id: userId, name: t.name, date: t.date, location: t.location,
    weight_class: t.weightClass, gi: t.gi, placement: t.placement, notes: t.notes, matches: t.matches };
}
function rowToSchedule(r: any): Schedule {
  return { id: r.id, name: r.name, type: r.type ?? "recurring",
    dayOfWeek: r.day_of_week, date: r.date ?? undefined,
    time: r.time, duration: r.duration, gi: r.gi, gym: r.gym ?? "", active: r.active };
}
function scheduleToRow(s: Schedule, userId: string) {
  return { id: s.id, user_id: userId, name: s.name, type: s.type,
    day_of_week: s.dayOfWeek, date: s.date ?? null,
    time: s.time, duration: s.duration, gi: s.gi, gym: s.gym, active: s.active };
}
function rowToCheckIn(r: any): CheckIn {
  return { id: r.id, scheduleId: r.schedule_id, date: r.date, attended: r.attended,
    sessionId: r.session_id ?? undefined };
}

interface TrainingStore {
  userId: string | null;
  loaded: boolean;

  sessions: TrainingSession[];
  addSession: (s: TrainingSession) => void;
  updateSession: (s: TrainingSession) => void;
  deleteSession: (id: string) => void;
  getSession: (id: string) => TrainingSession | undefined;

  currentBelt: Belt;
  currentStripes: number;
  promotions: BeltPromotion[];
  addPromotion: (p: BeltPromotion) => void;
  deletePromotion: (id: string) => void;

  tournaments: Tournament[];
  addTournament: (t: Tournament) => void;
  updateTournament: (t: Tournament) => void;
  deleteTournament: (id: string) => void;
  getTournament: (id: string) => Tournament | undefined;

  schedules: Schedule[];
  addSchedule: (s: Schedule) => void;
  updateSchedule: (s: Schedule) => void;
  deleteSchedule: (id: string) => void;

  checkIns: CheckIn[];
  upsertCheckIn: (c: CheckIn) => void;
  getCheckIn: (scheduleId: string, date: string) => CheckIn | undefined;

  pending: PendingOp[];
  syncPending: () => Promise<void>;

  loadFromCloud: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useTrainingStore = create<TrainingStore>()(persist((set, get) => ({
  userId: null,
  loaded: false,
  sessions: [],
  currentBelt: "white",
  currentStripes: 0,
  promotions: [],
  tournaments: [],
  schedules: [],
  checkIns: [],
  pending: [],

  // ── OFFLINE SYNC ──
  // Flush every queued session write to the server. Called on reconnect and
  // at the start of loadFromCloud. Stops on the first failure (still offline).
  syncPending: async () => {
    const uid = get().userId;
    if (!uid || isOffline() || get().pending.length === 0) return;
    const c = sb();
    for (const op of [...get().pending]) {
      try {
        if (op.action === "delete") {
          const { error } = await c.from("training_sessions").delete().eq("id", op.id);
          if (error) throw error;
        } else {
          const s = get().sessions.find(x => x.id === op.id);
          if (!s) { await c.from("training_sessions").delete().eq("id", op.id); }
          else {
            const { error } = await c.from("training_sessions").upsert(sessionToRow(s, uid));
            if (error) throw error;
          }
        }
        set(st => ({ pending: st.pending.filter(p => p.id !== op.id) }));
      } catch {
        break; // still offline / server error → keep the rest queued
      }
    }
  },

  // ── LOAD ──
  loadFromCloud: async (userId) => {
    set({ userId });
    // Push anything logged offline before we overwrite local state with cloud.
    await get().syncPending();
    const c = sb();
    const [ses, pro, tou, sch, chk] = await Promise.all([
      c.from("training_sessions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      c.from("belt_promotions").select("*").eq("user_id", userId).order("date", { ascending: true }),
      c.from("tournaments").select("*").eq("user_id", userId).order("date", { ascending: false }),
      c.from("schedules").select("*").eq("user_id", userId),
      c.from("check_ins").select("*").eq("user_id", userId),
    ]);
    // If the network failed, keep the locally-persisted state rather than wiping it.
    if (ses.error) { set({ loaded: true }); return; }
    const promotions = (pro.data ?? []).map(rowToPromo);
    const { belt, stripes } = deriveCurrentBelt(promotions);
    const cloudSessions = (ses.data ?? []).map(rowToSession);
    // Preserve any still-unsynced local sessions not yet in the cloud.
    const pendingUpsertIds = get().pending.filter(p => p.action === "upsert").map(p => p.id);
    const localPending = get().sessions.filter(
      s => pendingUpsertIds.includes(s.id) && !cloudSessions.some(cs => cs.id === s.id)
    );
    set({
      userId, loaded: true,
      sessions: [...localPending, ...cloudSessions],
      promotions, currentBelt: belt, currentStripes: stripes,
      tournaments: (tou.data ?? []).map(rowToTournament),
      schedules: (sch.data ?? []).map(rowToSchedule),
      checkIns: (chk.data ?? []).map(rowToCheckIn),
    });
    // keep profile belt in sync
    c.from("profiles").update({ belt, stripes }).eq("id", userId);
  },

  reset: () => set({
    userId: null, loaded: false, sessions: [], promotions: [], tournaments: [],
    schedules: [], checkIns: [], currentBelt: "white", currentStripes: 0, pending: [],
  }),

  // ── SESSIONS ── (optimistic local write + queued cloud sync)
  addSession: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ sessions: [s, ...st.sessions], pending: withPending(st.pending, s.id, "upsert") }));
    get().syncPending();
  },
  updateSession: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ sessions: st.sessions.map(x => x.id === s.id ? s : x), pending: withPending(st.pending, s.id, "upsert") }));
    get().syncPending();
  },
  deleteSession: (id) => {
    set(st => ({ sessions: st.sessions.filter(x => x.id !== id), pending: withPending(st.pending, id, "delete") }));
    get().syncPending();
  },
  getSession: (id) => get().sessions.find(s => s.id === id),

  // ── BELT ──
  addPromotion: (p) => {
    const uid = get().userId; if (!uid) return;
    const updated = [...get().promotions, p].sort((a, b) => a.date.localeCompare(b.date));
    const { belt, stripes } = deriveCurrentBelt(updated);
    set({ promotions: updated, currentBelt: belt, currentStripes: stripes });
    const c = sb();
    c.from("belt_promotions").insert(promoToRow(p, uid)).then();
    c.from("profiles").update({ belt, stripes }).eq("id", uid).then();
  },
  deletePromotion: (id) => {
    const uid = get().userId; if (!uid) return;
    const remaining = get().promotions.filter(p => p.id !== id);
    const { belt, stripes } = deriveCurrentBelt(remaining);
    set({ promotions: remaining, currentBelt: belt, currentStripes: stripes });
    const c = sb();
    c.from("belt_promotions").delete().eq("id", id).then();
    c.from("profiles").update({ belt, stripes }).eq("id", uid).then();
  },

  // ── TOURNAMENTS ──
  addTournament: (t) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ tournaments: [t, ...st.tournaments] }));
    sb().from("tournaments").insert(tournamentToRow(t, uid)).then();
  },
  updateTournament: (t) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ tournaments: st.tournaments.map(x => x.id === t.id ? t : x) }));
    sb().from("tournaments").update(tournamentToRow(t, uid)).eq("id", t.id).then();
  },
  deleteTournament: (id) => {
    set(st => ({ tournaments: st.tournaments.filter(t => t.id !== id) }));
    sb().from("tournaments").delete().eq("id", id).then();
  },
  getTournament: (id) => get().tournaments.find(t => t.id === id),

  // ── SCHEDULES ──
  addSchedule: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ schedules: [...st.schedules, s] }));
    sb().from("schedules").insert(scheduleToRow(s, uid)).then();
  },
  updateSchedule: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ schedules: st.schedules.map(x => x.id === s.id ? s : x) }));
    sb().from("schedules").update(scheduleToRow(s, uid)).eq("id", s.id).then();
  },
  deleteSchedule: (id) => {
    set(st => ({ schedules: st.schedules.filter(s => s.id !== id) }));
    sb().from("schedules").delete().eq("id", id).then();
  },

  // ── CHECK-INS ──
  upsertCheckIn: (ci) => {
    const uid = get().userId; if (!uid) return;
    set(st => {
      const i = st.checkIns.findIndex(x => x.scheduleId === ci.scheduleId && x.date === ci.date);
      if (i >= 0) { const u = [...st.checkIns]; u[i] = ci; return { checkIns: u }; }
      return { checkIns: [...st.checkIns, ci] };
    });
    sb().from("check_ins").upsert({
      user_id: uid, schedule_id: ci.scheduleId, date: ci.date,
      attended: ci.attended, session_id: ci.sessionId ?? null,
    }, { onConflict: "user_id,schedule_id,date" }).then();
  },
  getCheckIn: (scheduleId, date) =>
    get().checkIns.find(c => c.scheduleId === scheduleId && c.date === date),
}), {
  name: "grapplr-training",
  // Persist data for offline use + the pending-sync queue. `loaded` is not
  // persisted so the app always re-fetches from cloud when it can.
  partialize: (s) => ({
    userId: s.userId,
    sessions: s.sessions,
    promotions: s.promotions,
    tournaments: s.tournaments,
    schedules: s.schedules,
    checkIns: s.checkIns,
    currentBelt: s.currentBelt,
    currentStripes: s.currentStripes,
    pending: s.pending,
  }),
}));
