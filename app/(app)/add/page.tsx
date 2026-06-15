"use client";
import { randomId } from "@/lib/id";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { TrainingSession } from "@/lib/types";
import { useTagStore } from "@/store/useTagStore";
import TagSelector from "@/components/TagSelector";
import IntensityPicker from "@/components/IntensityPicker";
import { format } from "date-fns";
import { ArrowLeft, Check, Swords, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useToastStore } from "@/store/useToastStore";
import { useT } from "@/lib/i18n";


function defaultForm(pre?: Partial<Omit<TrainingSession, "id">>): Omit<TrainingSession, "id"> {
  return {
    date: format(new Date(), "yyyy-MM-dd"),
    gym: "",
    duration: 60,
    gi: true,
    intensity: 3,
    positions: [],
    submissionsGiven: [],
    submissionsReceived: [],
    sweepsGiven: [],
    sweepsReceived: [],
    escapesGiven: [],
    escapesReceived: [],
    notes: "",
    whatWorked: "",
    whatDidntWork: "",
    focus: "",
    ...pre,
  };
}

/* ── Reusable form section wrapper ── */
function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

/* ── Reusable label + input row ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-zinc-500 block mb-1.5">{children}</label>;
}

function AddPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const { addSession, updateSession, upsertCheckIn, schedules, getSession } = useTrainingStore();
  const { trackSubmissions, trackSweeps, trackEscapes } = usePrefsStore();
  const { positions: POSITIONS, submissions: SUBMISSIONS, sweeps: SWEEP_TYPES, escapes: ESCAPE_TYPES } = useTagStore();

  const scheduleId = params.get("scheduleId") ?? undefined;
  const dateParam  = params.get("date") ?? undefined;
  const editId     = params.get("edit") ?? undefined;
  const schedule   = scheduleId ? schedules.find((s) => s.id === scheduleId) : undefined;
  const existing   = editId ? getSession(editId) : undefined;

  const [form, setForm] = useState(defaultForm(
    existing
      ? { ...existing }
      : schedule
        ? { date: dateParam ?? format(new Date(), "yyyy-MM-dd"), gym: schedule.gym, duration: schedule.duration, gi: schedule.gi, scheduleId }
        : dateParam
          ? { date: dateParam }
          : undefined
  ));
  const [saved, setSaved] = useState(false);
  const toast = useToastStore();
  const t = useT();

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId && existing) {
      updateSession({ ...form, id: editId });
    } else {
      const sessionId = randomId();
      addSession({ ...form, id: sessionId });
      if (scheduleId && dateParam) {
        upsertCheckIn({ id: randomId(), scheduleId, date: dateParam, attended: true, sessionId });
      }
    }
    toast.show(editId ? t.sessionUpdated : t.sessionSaved, "success");
    setSaved(true);
    setTimeout(() => router.push(editId ? `/session/${editId}` : "/dashboard"), 500);
  };

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={editId ? `/session/${editId}` : "/dashboard"} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">{editId ? "Edit Session" : "Log Training"}</h1>
          {schedule && <p className="text-[11px] text-red-400 mt-0.5">{schedule.name}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Date & Gym ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Date</FieldLabel>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
          </div>
          <div>
            <FieldLabel>Gym (optional)</FieldLabel>
            <input type="text" value={form.gym} onChange={(e) => set("gym", e.target.value)} placeholder="Alliance HQ" className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
          </div>
        </div>

        {/* ── Duration & Type ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Duration (min)</FieldLabel>
            <div className="flex items-center bg-zinc-800/60 border border-zinc-800 rounded-xl overflow-hidden">
              <button type="button"
                onClick={() => set("duration", Math.max(15, form.duration - 15))}
                className="px-3 h-full py-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors text-base font-bold">
                ‹
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-zinc-100 tabular-nums">
                {form.duration}
              </span>
              <button type="button"
                onClick={() => set("duration", Math.min(300, form.duration + 15))}
                className="px-3 h-full py-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors text-base font-bold">
                ›
              </button>
            </div>
          </div>
          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="flex gap-2">
              <button type="button" onClick={() => set("gi", true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${form.gi ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30" : "bg-zinc-800/80 text-zinc-500"}`}>
                Gi
              </button>
              <button type="button" onClick={() => set("gi", false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${!form.gi ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30" : "bg-zinc-800/80 text-zinc-500"}`}>
                No-Gi
              </button>
            </div>
          </div>
        </div>

        {/* ── Intensity ── */}
        <FormSection label="Intensity">
          <IntensityPicker value={form.intensity} onChange={(v) => set("intensity", v)} />
        </FormSection>

        {/* ── Positions ── */}
        <FormSection label="Positions Worked">
          <TagSelector options={POSITIONS} selected={form.positions} onChange={(v) => set("positions", v)} />
        </FormSection>

        {/* ── Submissions (split) ── */}
        {trackSubmissions && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Submissions</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Swords size={11} className="text-emerald-500" />
              </div>
              <span className="text-xs font-medium text-emerald-400">You tapped them</span>
              {form.submissionsGiven.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-emerald-600">{form.submissionsGiven.length}×</span>
              )}
            </div>
            <TagSelector options={SUBMISSIONS} selected={form.submissionsGiven} onChange={(v) => set("submissionsGiven", v)} activeColor="green" />
          </div>

          <div className="h-px bg-zinc-800" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center">
                <Shield size={11} className="text-red-500" />
              </div>
              <span className="text-xs font-medium text-red-400">You got tapped</span>
              {form.submissionsReceived.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-red-700">{form.submissionsReceived.length}×</span>
              )}
            </div>
            <TagSelector options={SUBMISSIONS} selected={form.submissionsReceived} onChange={(v) => set("submissionsReceived", v)} activeColor="red" />
          </div>
        </div>}

        {/* ── Sweeps ── */}
        {trackSweeps && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Sweeps</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp size={11} className="text-blue-400" />
                </div>
                <span className="text-xs font-medium text-blue-400">You swept them</span>
                {form.sweepsGiven.length > 0 && (
                  <span className="ml-auto text-[11px] font-semibold text-blue-600">{form.sweepsGiven.length}×</span>
                )}
              </div>
              <TagSelector options={SWEEP_TYPES} selected={form.sweepsGiven} onChange={(v) => set("sweepsGiven", v)} activeColor="blue" />
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp size={11} className="text-orange-400 rotate-180" />
                </div>
                <span className="text-xs font-medium text-orange-400">They swept you</span>
                {form.sweepsReceived.length > 0 && (
                  <span className="ml-auto text-[11px] font-semibold text-orange-700">{form.sweepsReceived.length}×</span>
                )}
              </div>
              <TagSelector options={SWEEP_TYPES} selected={form.sweepsReceived} onChange={(v) => set("sweepsReceived", v)} activeColor="orange" />
            </div>
          </div>
        )}

        {/* ── Escapes ── */}
        {trackEscapes && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Escapes</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-violet-500/10 flex items-center justify-center">
                  <Zap size={11} className="text-violet-400" />
                </div>
                <span className="text-xs font-medium text-violet-400">You escaped</span>
                {form.escapesGiven.length > 0 && (
                  <span className="ml-auto text-[11px] font-semibold text-violet-600">{form.escapesGiven.length}×</span>
                )}
              </div>
              <TagSelector options={ESCAPE_TYPES} selected={form.escapesGiven} onChange={(v) => set("escapesGiven", v)} activeColor="purple" />
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-pink-500/10 flex items-center justify-center">
                  <Zap size={11} className="text-pink-400" />
                </div>
                <span className="text-xs font-medium text-pink-400">They escaped from you</span>
                {form.escapesReceived.length > 0 && (
                  <span className="ml-auto text-[11px] font-semibold text-pink-700">{form.escapesReceived.length}×</span>
                )}
              </div>
              <TagSelector options={ESCAPE_TYPES} selected={form.escapesReceived} onChange={(v) => set("escapesReceived", v)} activeColor="pink" />
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        <FormSection label="Notes">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What happened today?" rows={3}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none" />
        </FormSection>

        {/* ── Reflection ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Reflection</p>
          <div>
            <p className="text-xs font-medium text-emerald-400 mb-1.5">✓ What worked?</p>
            <textarea value={form.whatWorked} onChange={(e) => set("whatWorked", e.target.value)} placeholder="Techniques that clicked today…" rows={2}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none text-xs" />
          </div>
          <div>
            <p className="text-xs font-medium text-red-400 mb-1.5">✗ What didn&apos;t work?</p>
            <textarea value={form.whatDidntWork} onChange={(e) => set("whatDidntWork", e.target.value)} placeholder="Areas that need improvement…" rows={2}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none text-xs" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-400 mb-1.5">→ Focus next session</p>
            <textarea value={form.focus} onChange={(e) => set("focus", e.target.value)} placeholder="One thing to drill next time…" rows={2}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none text-xs" />
          </div>
        </div>

        {/* ── Submit ── */}
        <button type="submit" disabled={saved}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 ${
            saved ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all"
          }`}>
          {saved
            ? <span className="flex items-center justify-center gap-2"><Check size={18} strokeWidth={2.5} /> Saved!</span>
            : "Save Session"
          }
        </button>
      </form>
    </div>
  );
}

export default function AddPage() {
  return <Suspense><AddPageInner /></Suspense>;
}
