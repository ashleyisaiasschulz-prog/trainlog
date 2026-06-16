"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTechniqueStore, TECHNIQUE_CATEGORIES, TechniqueCategory, TechniqueNote } from "@/store/useTechniqueStore";
import { format } from "date-fns";
import { randomId } from "@/lib/id";

const CAT_COLOR: Record<TechniqueCategory, string> = {
  guard:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  passing:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  submissions: "bg-red-500/10 text-red-400 border-red-500/20",
  takedowns:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  defense:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  back:        "bg-orange-500/10 text-orange-400 border-orange-500/20",
  general:     "bg-zinc-700/50 text-zinc-400 border-zinc-600/20",
};

function blank(): Omit<TechniqueNote, "id"> {
  return { name: "", category: "general", notes: "", date: format(new Date(), "yyyy-MM-dd") };
}

export default function TechniquesPage() {
  const { techniques, add, update, remove } = useTechniqueStore();
  const [editing, setEditing] = useState<TechniqueNote | null>(null);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState(blank());
  const [filter, setFilter]   = useState<TechniqueCategory | "all">("all");

  const startAdd = () => { setForm(blank()); setAdding(true); setEditing(null); };
  const startEdit = (t: TechniqueNote) => { setForm({ name: t.name, category: t.category, notes: t.notes, date: t.date }); setEditing(t); setAdding(false); };
  const cancel = () => { setAdding(false); setEditing(null); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      update({ ...editing, ...form });
    } else {
      add({ id: randomId(), ...form });
    }
    cancel();
  };

  const visible = filter === "all" ? techniques : techniques.filter((t) => t.category === filter);

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Technique Notes</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">{techniques.length} note{techniques.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-3 py-2 text-sm active:scale-95 transition-all">
          <Plus size={15} /> New
        </button>
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            {editing ? "Edit Note" : "New Technique Note"}
          </p>
          <input
            type="text"
            placeholder="Technique name (e.g. Arm Drag to Back)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <div className="flex flex-wrap gap-1.5">
            {TECHNIQUE_CATEGORIES.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, category: value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.category === value ? CAT_COLOR[value] : "bg-zinc-800 text-zinc-500 border-zinc-800"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Your notes — what works, what doesn't, key details..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={4}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={cancel}
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold py-2.5 rounded-xl text-sm">
              <X size={14} /> Cancel
            </button>
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm">
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      {techniques.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button onClick={() => setFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "all" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-400"}`}>
            All
          </button>
          {TECHNIQUE_CATEGORIES.map(({ value, label }) =>
            techniques.some((t) => t.category === value) ? (
              <button key={value} onClick={() => setFilter(value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filter === value ? CAT_COLOR[value] : "bg-zinc-800 text-zinc-500 border-zinc-800"
                }`}>
                {label}
              </button>
            ) : null
          )}
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <BookOpen size={32} className="text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">No technique notes yet</p>
          <p className="text-xs text-zinc-600 max-w-[220px]">Start building your personal technique library — notes that stick</p>
          <button onClick={startAdd}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
            Add First Note
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${CAT_COLOR[t.category]}`}>
                      {TECHNIQUE_CATEGORIES.find((c) => c.value === t.category)?.label}
                    </span>
                    <span className="text-[10px] text-zinc-600">{format(new Date(t.date), "MMM d, yyyy")}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(t)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(t.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {t.notes && (
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{t.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
