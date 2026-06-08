"use client";

import { create } from "zustand";
import {
  TrainingSession, BeltPromotion, Tournament, Belt, Schedule, CheckIn, BELT_ORDER,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

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
    notes: r.notes ?? "", whatWorked: r.what_worked ?? "", whatDidntWork: r.what_didnt_work ?? "",
    focus: r.focus ?? "", scheduleId: r.schedule_id ?? undefined,
  };
}
function sessionToRow(s: TrainingSession, userId: string) {
  return {
    id: s.id, user_id: userId, date: s.date, gym: s.gym, duration: s.duration, gi: s.gi,
    intensity: s.intensity, positions: s.positions,
    submissions_given: s.submissionsGiven ?? [], submissions_received: s.submissionsReceived ?? [],
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
  return { id: r.id, name: r.name, dayOfWeek: r.day_of_week, time: r.time,
    duration: r.duration, gi: r.gi, gym: r.gym ?? "", active: r.active };
}
function scheduleToRow(s: Schedule, userId: string) {
  return { id: s.id, user_id: userId, name: s.name, day_of_week: s.dayOfWeek, time: s.time,
    duration: s.duration, gi: s.gi, gym: s.gym, active: s.active };
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

  loadFromCloud: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useTrainingStore = create<TrainingStore>()((set, get) => ({
  userId: null,
  loaded: false,
  sessions: [],
  currentBelt: "white",
  currentStripes: 0,
  promotions: [],
  tournaments: [],
  schedules: [],
  checkIns: [],

  // ── LOAD ──
  loadFromCloud: async (userId) => {
    const c = sb();
    const [ses, pro, tou, sch, chk] = await Promise.all([
      c.from("training_sessions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      c.from("belt_promotions").select("*").eq("user_id", userId).order("date", { ascending: true }),
      c.from("tournaments").select("*").eq("user_id", userId).order("date", { ascending: false }),
      c.from("schedules").select("*").eq("user_id", userId),
      c.from("check_ins").select("*").eq("user_id", userId),
    ]);
    const promotions = (pro.data ?? []).map(rowToPromo);
    const { belt, stripes } = deriveCurrentBelt(promotions);
    set({
      userId, loaded: true,
      sessions: (ses.data ?? []).map(rowToSession),
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
    schedules: [], checkIns: [], currentBelt: "white", currentStripes: 0,
  }),

  // ── SESSIONS ──
  addSession: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ sessions: [s, ...st.sessions] }));
    sb().from("training_sessions").insert(sessionToRow(s, uid)).then();
  },
  updateSession: (s) => {
    const uid = get().userId; if (!uid) return;
    set(st => ({ sessions: st.sessions.map(x => x.id === s.id ? s : x) }));
    sb().from("training_sessions").update(sessionToRow(s, uid)).eq("id", s.id).then();
  },
  deleteSession: (id) => {
    set(st => ({ sessions: st.sessions.filter(x => x.id !== id) }));
    sb().from("training_sessions").delete().eq("id", id).then();
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
}));
