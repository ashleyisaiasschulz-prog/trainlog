"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, Check, HeartPulse, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useInjuryStore, bodyPartLabel, injuryTypeLabel, Injury } from "@/store/useInjuryStore";
import { useTagStore } from "@/store/useTagStore";
import { format, differenceInDays } from "date-fns";
import { randomId } from "@/lib/id";

const SEV_LABEL = ["", "Mild", "Moderate", "Serious"];
const SEV_COLOR = ["", "text-amber-400 bg-amber-500/10", "text-orange-400 bg-orange-500/10", "text-red-400 bg-red-500/10"];

function blank(): Omit<Injury, "id"> {
  return {
    bodyPart: "", type: "", severity: 1,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: null, notes: "",
  };
}

export default function InjuriesPage() {
  return <Suspense><InjuriesPageInner /></Suspense>;
}

function InjuriesPageInner() {
  const { injuries, add, remove, heal } = useInjuryStore();
  const { bodyParts, injuryTypes } = useTagStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState<Omit<Injury, "id">>(blank());
  const [recovered, setRecovered] = useState(false);
  const searchParams = useSearchParams();

  // Fill in defaults from the customizable tag lists
  const withDefaults = (base: Omit<Injury, "id">): Omit<Injury, "id"> => ({
    ...base,
    bodyPart: base.bodyPart || bodyParts[0] || "",
    type:     base.type     || injuryTypes[0] || "",
  });

  // Open the form prefilled when arriving from the calendar with ?date=
  useEffect(() => {
    const date = searchParams.get("date");
    if (date) {
      setForm(withDefaults({ ...blank(), startDate: date }));
      setRecovered(false);
      setAdding(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const active = injuries.filter((i) => !i.endDate);
  const healed = injuries.filter((i) => !!i.endDate);

  const today = format(new Date(), "yyyy-MM-dd");
  // Validation: start can't be in the future; if recovered, end must be on/after start.
  const startInFuture = form.startDate > today;
  const endBeforeStart = recovered && !!form.endDate && form.endDate < form.startDate;
  const endMissing     = recovered && !form.endDate;
  const canSave = !startInFuture && !endBeforeStart && !endMissing;

  const openForm = () => {
    setForm(withDefaults(blank()));
    setRecovered(false);
    setAdding(true);
  };

  const save = () => {
    if (!canSave) return;
    add({ id: randomId(), ...form, endDate: recovered ? form.endDate : null });
    setForm(blank());
    setRecovered(false);
    setAdding(false);
  };

  const markHealed = (id: string) => {
    heal(id, format(new Date(), "yyyy-MM-dd"));
  };

  const daysActive = (i: Injury) => {
    const end = i.endDate ? new Date(i.endDate + "T12:00:00") : new Date();
    return Math.max(0, differenceInDays(end, new Date(i.startDate + "T12:00:00")));
  };

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Injury Tracker</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {active.length > 0 ? `${active.length} active · ${healed.length} healed` : `${healed.length} healed`}
            </p>
          </div>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-3 py-2 text-sm active:scale-95 transition-all">
          <Plus size={15} /> Log
        </button>
      </div>

      {/* Active injuries banner */}
      {active.length > 0 && !adding && (
        <div className="bg-red-950/40 border border-red-900/40 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={15} className="text-red-400" />
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Active Injuries</p>
          </div>
          {active.map((i) => (
            <div key={i.id} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SEV_COLOR[i.severity]}`}>
                {SEV_LABEL[i.severity]}
              </span>
              <span className="text-xs text-zinc-200 font-medium">
                {bodyPartLabel(i.bodyPart)} · {injuryTypeLabel(i.type)}
              </span>
              <span className="text-[11px] text-zinc-500 ml-auto">{daysActive(i)}d</span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Log Injury</p>

          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Body Part</p>
            <div className="flex flex-wrap gap-1.5">
              {bodyParts.map((label) => (
                <button key={label} type="button" onClick={() => setForm((f) => ({ ...f, bodyPart: label }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.bodyPart === label
                      ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {injuryTypes.map((label) => (
                <button key={label} type="button" onClick={() => setForm((f) => ({ ...f, type: label }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.type === label
                      ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Severity</p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((sev) => (
                <button key={sev} type="button" onClick={() => setForm((f) => ({ ...f, severity: sev }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    form.severity === sev ? SEV_COLOR[sev] + " ring-1 ring-current/30" : "bg-zinc-800 text-zinc-500"
                  }`}>
                  {SEV_LABEL[sev]}
                </button>
              ))}
            </div>
          </div>

          {/* Status: still injured vs already recovered */}
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Status</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setRecovered(false); setForm((f) => ({ ...f, endDate: null })); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  !recovered ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800 text-zinc-500"
                }`}>
                Still injured
              </button>
              <button type="button" onClick={() => { setRecovered(true); setForm((f) => ({ ...f, endDate: f.endDate ?? today })); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  recovered ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-800 text-zinc-500"
                }`}>
                Recovered
              </button>
            </div>
          </div>

          <div className={recovered ? "grid grid-cols-2 gap-2" : ""}>
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">{recovered ? "Injured on" : "Injured since"}</p>
              <input type="date" value={form.startDate} max={today}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
            </div>
            {recovered && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Recovered on</p>
                <input type="date" value={form.endDate ?? ""} min={form.startDate} max={today}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
              </div>
            )}
          </div>

          {(startInFuture || endBeforeStart || endMissing) && (
            <p className="text-[11px] text-red-400">
              {startInFuture ? "Injury date can't be in the future."
                : endMissing ? "Pick the date you recovered."
                : "Recovery date can't be before the injury date."}
            </p>
          )}

          <textarea placeholder="Notes (optional)..." value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />

          <div className="flex gap-2">
            <button onClick={() => setAdding(false)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold py-2.5 rounded-xl text-sm">
              <X size={14} /> Cancel
            </button>
            <button onClick={save} disabled={!canSave}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40 disabled:pointer-events-none">
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Active list */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Active</p>
          {active.map((i) => (
            <InjuryCard key={i.id} injury={i} onHeal={() => markHealed(i.id)} onDelete={() => remove(i.id)} daysActive={daysActive(i)} />
          ))}
        </div>
      )}

      {/* Healed list */}
      {healed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Healed</p>
          {healed.map((i) => (
            <InjuryCard key={i.id} injury={i} onDelete={() => remove(i.id)} daysActive={daysActive(i)} />
          ))}
        </div>
      )}

      {injuries.length === 0 && !adding && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <HeartPulse size={32} className="text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">No injuries logged</p>
          <p className="text-xs text-zinc-600 max-w-[220px]">Stay on the mat — track injuries to know when to rest</p>
        </div>
      )}
    </div>
  );
}

function InjuryCard({ injury: i, onHeal, onDelete, daysActive }: {
  injury: Injury; onHeal?: () => void; onDelete: () => void; daysActive: number;
}) {
  const isActive = !i.endDate;
  return (
    <div className={`bg-zinc-900 border rounded-2xl p-4 space-y-2 ${isActive ? "border-red-900/30" : "border-zinc-800"}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SEV_COLOR[i.severity]}`}>
              {SEV_LABEL[i.severity]}
            </span>
            {isActive ? (
              <span className="text-[10px] font-semibold text-red-400">● Active · {daysActive}d</span>
            ) : (
              <span className="text-[10px] text-zinc-600">Healed in {daysActive}d</span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-100">
            {bodyPartLabel(i.bodyPart)}
            <span className="text-zinc-500 font-normal"> · {injuryTypeLabel(i.type)}</span>
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {format(new Date(i.startDate + "T12:00:00"), "MMM d, yyyy")}
            {i.endDate ? ` → ${format(new Date(i.endDate + "T12:00:00"), "MMM d, yyyy")}` : ""}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {isActive && onHeal && (
            <button onClick={onHeal}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors">
              Healed
            </button>
          )}
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {i.notes && <p className="text-xs text-zinc-400 leading-relaxed">{i.notes}</p>}
    </div>
  );
}
