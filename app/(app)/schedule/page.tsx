"use client";
import { randomId } from "@/lib/id";

import { useState, useEffect } from "react";
import { useTrainingStore } from "@/store/useTrainingStore";
import { Schedule, DAY_NAMES, DAY_NAMES_FULL, DayOfWeek } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Clock, ToggleLeft, ToggleRight, RefreshCw, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

const defaultForm = (): Omit<Schedule, "id"> => ({
  type: "recurring", name: "", dayOfWeek: 2, date: undefined,
  time: "18:00", duration: 90, gi: true, gym: "", active: true,
});

export default function SchedulePage() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useTrainingStore();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm());
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Auto-open edit form if ?edit=id in URL
  useEffect(() => {
    const id = searchParams.get("edit");
    if (id) {
      const s = schedules.find(x => x.id === id);
      if (s) openEdit(s);
    }
  }, [searchParams, schedules]);

  const openEdit = (s: Schedule) => {
    setEditId(s.id);
    setForm({ type: s.type, name: s.name, dayOfWeek: s.dayOfWeek, date: s.date,
      time: s.time, duration: s.duration, gi: s.gi, gym: s.gym, active: s.active });
    setShowForm(true);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    if (form.type === "once" && !form.date) return;
    if (editId) {
      updateSchedule({ ...form, id: editId });
      setEditId(null);
    } else {
      addSchedule({ ...form, id: randomId() });
    }
    setForm(defaultForm());
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm(defaultForm());
  };

  const recurring = schedules.filter(s => s.type !== "once");
  const oneTime   = schedules.filter(s => s.type === "once").sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? "")
  );

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex-1">Schedule</h1>
        <button onClick={() => { setForm(defaultForm()); setShowForm(v => !v); }}
          className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus size={15} strokeWidth={2.5} /> Add
        </button>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">

          {/* Type toggle */}
          <p className="text-sm font-semibold text-zinc-100">{editId ? "Edit Session" : "New Session"}</p>

          <div className="flex gap-2 p-1 bg-zinc-800/60 rounded-xl">
            <button type="button" onClick={() => setF("type", "recurring")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                form.type === "recurring" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500"
              }`}>
              <RefreshCw size={13} /> Recurring
            </button>
            <button type="button" onClick={() => setF("type", "once")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                form.type === "once" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500"
              }`}>
              <Calendar size={13} /> One-time
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={e => setF("name", e.target.value)}
              placeholder={form.type === "once" ? "e.g. Open Mat Saturday" : "e.g. Tuesday No-Gi"}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
          </div>

          {/* Day picker — recurring OR one-time date */}
          {form.type === "recurring" ? (
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
          ) : (
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Date</label>
              <input type="date" value={form.date ?? ""} onChange={e => setF("date", e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
          )}

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => setF("time", e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setF("duration", Number(e.target.value))}
                min={15} max={240}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
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
              <input type="text" value={form.gym} onChange={e => setF("gym", e.target.value)}
                placeholder="Alliance HQ"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleCancel}
              className="bg-zinc-800 hover:bg-zinc-700 active:scale-[0.97] text-zinc-300 font-medium rounded-xl transition-all flex-1 py-3 text-sm">
              Cancel
            </button>
            <button type="button" onClick={handleAdd}
              disabled={!form.name.trim() || (form.type === "once" && !form.date)}
              className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex-1 py-3 text-sm disabled:opacity-30">
              {editId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* ── One-time events ── */}
      {oneTime.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">One-time</p>
          {oneTime.map(s => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{s.date ? format(new Date(s.date + "T12:00:00"), "EEE, MMM d") : ""}</span>
                  <span className="text-zinc-700 text-xs">·</span>
                  <span className="text-xs text-zinc-500">{s.time} · {s.duration}m</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    s.gi ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                  }`}>{s.gi ? "Gi" : "No-Gi"}</span>
                </div>
              </div>
              <button onClick={() => openEdit(s)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                <Pencil size={14} />
              </button>
              <button onClick={() => deleteSchedule(s.id)} className="text-zinc-700 hover:text-red-500 transition-colors p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Recurring by day ── */}
      {recurring.length > 0 && (
        <div className="space-y-5">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Recurring</p>
          {Array.from({ length: 7 }).map((_, dow) => {
            const daySchedules = recurring.filter(s => s.dayOfWeek === dow);
            if (daySchedules.length === 0) return null;
            return (
              <div key={dow}>
                <p className="text-[11px] font-semibold text-zinc-600 mb-2">{DAY_NAMES_FULL[dow]}</p>
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
                          }`}>{s.gi ? "Gi" : "No-Gi"}</span>
                        </div>
                      </div>
                      <button onClick={() => openEdit(s)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => updateSchedule({ ...s, active: !s.active })}
                        className={`transition-colors ${s.active ? "text-red-500" : "text-zinc-700"}`}>
                        {s.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button onClick={() => deleteSchedule(s.id)} className="text-zinc-700 hover:text-red-500 transition-colors p-1">
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

      {schedules.length === 0 && !showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">📅</span>
          <p className="text-sm font-medium text-zinc-400">No sessions scheduled yet</p>
          <p className="text-xs text-zinc-600">Add a one-time event or a recurring class</p>
        </div>
      )}
    </div>
  );
}
