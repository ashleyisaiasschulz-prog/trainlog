"use client";
import { randomId } from "@/lib/id";

import { useState } from "react";
import { useTrainingStore } from "@/store/useTrainingStore";
import { Schedule, DAY_NAMES, DAY_NAMES_FULL, DayOfWeek } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";


const defaultSchedule = (): Omit<Schedule, "id"> => ({
  name: "", dayOfWeek: 2, time: "18:00", duration: 90, gi: true, gym: "", active: true,
});

export default function SchedulePage() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useTrainingStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultSchedule());
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addSchedule({ ...form, id: randomId() });
    setForm(defaultSchedule());
    setShowForm(false);
  };

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex-1">My Schedule</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus size={15} strokeWidth={2.5} /> Add Class
        </button>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed -mt-1">
        Set up recurring classes. The dashboard will prompt you to check in after each one.
      </p>

      {/* ── Add form ── */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-zinc-100">New Recurring Class</p>

          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Class Name</label>
            <input type="text" value={form.name} onChange={e => setF("name", e.target.value)}
              placeholder="e.g. Tuesday Evening No-Gi" className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
          </div>

          {/* Day of week */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Day</label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_NAMES.map((name, dow) => (
                <button key={dow} type="button" onClick={() => setF("dayOfWeek", dow as DayOfWeek)}
                  className={`py-3 rounded-xl text-xs font-semibold transition-all ${
                    form.dayOfWeek === dow
                      ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-600"
                      : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-400"
                  }`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => setF("time", e.target.value)} className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setF("duration", Number(e.target.value))} min={15} max={240} className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
          </div>

          {/* Gi/No-Gi + Gym */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setF("gi", true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${form.gi ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30" : "bg-zinc-800/80 text-zinc-500"}`}>
                  Gi
                </button>
                <button type="button" onClick={() => setF("gi", false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${!form.gi ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30" : "bg-zinc-800/80 text-zinc-500"}`}>
                  No-Gi
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Gym</label>
              <input type="text" value={form.gym} onChange={e => setF("gym", e.target.value)} placeholder="Alliance HQ" className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="bg-zinc-800 hover:bg-zinc-700 active:scale-[0.97] text-zinc-300 font-medium rounded-xl transition-all flex-1 py-3 text-sm">Cancel</button>
            <button type="button" onClick={handleAdd} disabled={!form.name.trim()}
              className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex-1 py-3 text-sm disabled:opacity-30">Save Class</button>
          </div>
        </div>
      )}

      {/* ── Schedule list ── */}
      {schedules.length === 0 && !showForm ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">📅</span>
          <p className="text-sm font-medium text-zinc-400">No classes set up yet</p>
          <p className="text-xs text-zinc-600">Tap "Add Class" to get started</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from({ length: 7 }).map((_, dow) => {
            const daySchedules = schedules.filter(s => s.dayOfWeek === dow);
            if (daySchedules.length === 0) return null;
            return (
              <div key={dow}>
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">{DAY_NAMES_FULL[dow]}</p>
                <div className="space-y-2">
                  {daySchedules.map(s => (
                    <div key={s.id} className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 transition-opacity ${s.active ? "" : "opacity-40"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={11} className="text-zinc-600" />
                          <span className="text-xs text-zinc-500">{s.time} · {s.duration}m</span>
                          {s.gym && <span className="text-xs text-zinc-600 truncate">· {s.gym}</span>}
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            s.gi ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                          }`}>
                            {s.gi ? "Gi" : "No-Gi"}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => updateSchedule({ ...s, active: !s.active })}
                        className={`transition-colors ${s.active ? "text-red-500" : "text-zinc-700"}`}>
                        {s.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button onClick={() => deleteSchedule(s.id)}
                        className="text-zinc-700 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
