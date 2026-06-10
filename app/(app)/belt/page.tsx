"use client";
import { randomId } from "@/lib/id";

import { useState } from "react";
import { useTrainingStore } from "@/store/useTrainingStore";
import BeltBadge from "@/components/BeltBadge";
import { Belt, BELT_ORDER, BELT_LABELS, BELT_COLORS, BeltPromotion } from "@/lib/types";
import { format, differenceInMonths, differenceInYears, differenceInDays } from "date-fns";
import { Plus, Trash2, Award } from "lucide-react";


function timeInBeltStr(dateStr: string) {
  const from  = new Date(dateStr + "T12:00:00");
  const days  = differenceInDays(new Date(), from);
  const years = differenceInYears(new Date(), from);
  if (days === 0) return "Today";
  if (years === 0) return `${days}d`;
  const remainingDays = differenceInDays(new Date(), new Date(
    from.getFullYear() + years, from.getMonth(), from.getDate()
  ));
  return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years}y`;
}

const defaultPromo = (): Omit<BeltPromotion, "id"> => ({
  date: format(new Date(), "yyyy-MM-dd"),
  fromBelt: null,
  toBelt: "blue",
  stripes: 0,
  gym: "",
  coachNote: "",
});

export default function BeltPage() {
  const { currentBelt, currentStripes, promotions, addPromotion, deletePromotion } = useTrainingStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultPromo());
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const nextIdx  = BELT_ORDER.indexOf(currentBelt) + 1;
  const nextBelt = nextIdx < BELT_ORDER.length ? BELT_ORDER[nextIdx] : null;
  const currentPromoDate = [...promotions].reverse().find(p => p.toBelt === currentBelt)?.date;
  const sorted = [...promotions].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = () => {
    addPromotion({ ...form, id: randomId() });
    setForm(defaultPromo());
    setShowForm(false);
  };

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Belt Tracker</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus size={15} strokeWidth={2.5} /> Promotion
        </button>
      </div>

      {/* ── Current belt hero ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <BeltBadge belt={currentBelt} stripes={currentStripes} size="lg" showLabel={true} />

        {currentPromoDate && (
          <div className="flex items-center gap-6 pt-3 border-t border-zinc-800">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Time in belt</p>
              <p className="text-sm font-semibold text-zinc-200">{timeInBeltStr(currentPromoDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Since</p>
              <p className="text-sm font-semibold text-zinc-200">
                {format(new Date(currentPromoDate + "T12:00:00"), "MMM yyyy")}
              </p>
            </div>
          </div>
        )}

        {/* Next milestone */}
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Next Milestone</p>
          {currentStripes < 4 ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`w-5 h-2.5 rounded-sm ${i < currentStripes ? "bg-red-500" : "bg-zinc-700"}`} />
                ))}
              </div>
              <span className="text-sm text-zinc-300">
                {4 - currentStripes} more stripe{4 - currentStripes !== 1 ? "s" : ""}
              </span>
            </div>
          ) : nextBelt ? (
            <div className="flex items-center gap-3">
              <BeltBadge belt={nextBelt} stripes={0} size="sm" showLabel={false} />
              <span className="text-sm font-medium text-zinc-200">{BELT_LABELS[nextBelt]} awaits</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-amber-400">🏆 Black Belt achieved</p>
          )}
        </div>
      </div>

      {/* ── Add Promotion form ── */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-zinc-100">Log Promotion</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setF("date", e.target.value)} className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Gym</label>
              <input type="text" value={form.gym} onChange={e => setF("gym", e.target.value)} placeholder="Alliance HQ" className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
            </div>
          </div>

          {/* Belt select */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">New Belt</label>
            <div className="grid grid-cols-5 gap-1.5">
              {BELT_ORDER.map(belt => {
                const c = BELT_COLORS[belt];
                return (
                  <button key={belt} type="button" onClick={() => setF("toBelt", belt)}
                    className={`py-2.5 rounded-xl text-[11px] font-bold transition-all border-2 ${c.bg} ${c.text} ${
                      form.toBelt === belt ? "border-red-500 scale-[1.05]" : "border-transparent opacity-50"
                    }`}>
                    {belt.slice(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stripes */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Stripes</label>
            <div className="flex gap-2">
              {[0,1,2,3,4].map(n => (
                <button key={n} type="button" onClick={() => setF("stripes", n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    form.stripes === n ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-600" : "bg-zinc-800/80 text-zinc-500"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Coach note */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Coach Note</label>
            <textarea value={form.coachNote} onChange={e => setF("coachNote", e.target.value)}
              placeholder="What your coach said…" rows={2} className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none text-xs" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-zinc-800 hover:bg-zinc-700 active:scale-[0.97] text-zinc-300 font-medium rounded-xl transition-all flex-1 py-3 text-sm">Cancel</button>
            <button type="button" onClick={handleAdd}
              className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex-1 py-3 text-sm">Save</button>
          </div>
        </div>
      )}

      {/* ── Promotion history ── */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">History</p>
          {sorted.map((p, i) => {
            const c = BELT_COLORS[p.toBelt];
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                  <Award size={17} className={c.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">
                    {BELT_LABELS[p.toBelt]}
                    {p.stripes > 0 && <span className="text-zinc-500 font-normal text-xs ml-1.5">{p.stripes} stripe{p.stripes !== 1 ? "s" : ""}</span>}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {format(new Date(p.date + "T12:00:00"), "MMMM d, yyyy")}
                    {p.gym ? ` · ${p.gym}` : ""}
                  </p>
                  {p.coachNote && <p className="text-xs text-zinc-500 mt-1 italic">"{p.coachNote}"</p>}
                  <p className={`text-[11px] mt-1 font-medium ${i === 0 ? "text-red-400" : "text-zinc-600"}`}>
                    {timeInBeltStr(p.date)} ago
                  </p>
                </div>
                <button onClick={() => deletePromotion(p.id)}
                  className="text-zinc-700 hover:text-red-500 transition-colors p-1 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">🥋</span>
          <p className="text-sm font-medium text-zinc-400">No promotions logged yet</p>
          <p className="text-xs text-zinc-600">Record your first belt or stripe</p>
        </div>
      )}
    </div>
  );
}
