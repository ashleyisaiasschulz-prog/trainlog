"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, RotateCcw, Check, Pencil } from "lucide-react";
import { useTagStore, TagCategory } from "@/store/useTagStore";

type Accent = "red" | "green" | "blue" | "orange" | "purple";

const ACCENT: Record<Accent, string> = {
  red:    "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  green:  "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  blue:   "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  orange: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  purple: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
};

const SECTIONS: { cat: TagCategory; title: string; desc: string; accent: Accent }[] = [
  { cat: "positions",   title: "Positions",    desc: "Positions you work in training",         accent: "red"    },
  { cat: "submissions", title: "Submissions",  desc: "Submissions you give & receive",          accent: "green"  },
  { cat: "sweeps",      title: "Sweeps",       desc: "Sweeps you hit & get hit with",           accent: "blue"   },
  { cat: "escapes",     title: "Escapes",      desc: "Escapes you complete & allow",            accent: "purple" },
  { cat: "bodyParts",   title: "Body Parts",   desc: "Body parts for the injury tracker",       accent: "orange" },
  { cat: "injuryTypes", title: "Injury Types", desc: "Injury types for the injury tracker",      accent: "orange" },
];

export default function CustomizePage() {
  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/account" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Customize Tags</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Add, rename or remove your tracking options</p>
        </div>
      </div>

      {SECTIONS.map((s) => <TagEditor key={s.cat} {...s} />)}
    </div>
  );
}

function TagEditor({ cat, title, desc, accent }: { cat: TagCategory; title: string; desc: string; accent: Accent }) {
  const items = useTagStore((s) => s[cat]);
  const { add, remove, rename, reset } = useTagStore();
  const [newVal, setNewVal] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const submitNew = () => {
    if (!newVal.trim()) return;
    add(cat, newVal);
    setNewVal("");
  };

  const submitEdit = () => {
    if (editing && editVal.trim()) rename(cat, editing, editVal);
    setEditing(null);
    setEditVal("");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-200">{title}</p>
          <p className="text-xs text-zinc-600">{desc}</p>
        </div>
        <button onClick={() => reset(cat)}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          editing === item ? (
            <div key={item} className="flex items-center gap-1">
              <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") { setEditing(null); } }}
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500" />
              <button onClick={submitEdit} className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Check size={13} />
              </button>
            </div>
          ) : (
            <div key={item} className={`flex items-center rounded-lg ${ACCENT[accent]}`}>
              <button onClick={() => { setEditing(item); setEditVal(item); }}
                className="pl-3 pr-1.5 py-1.5 text-xs font-medium flex items-center gap-1">
                {item}
                <Pencil size={10} className="opacity-50" />
              </button>
              <button onClick={() => remove(cat, item)}
                className="px-1.5 py-1.5 text-xs font-bold opacity-60 hover:opacity-100 border-l border-black/10">
                <X size={12} />
              </button>
            </div>
          )
        ))}
        {items.length === 0 && <p className="text-xs text-zinc-600">No tags — add one below.</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <input value={newVal} onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
          placeholder={`Add ${title.toLowerCase()}…`}
          className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
        <button onClick={submitNew} disabled={!newVal.trim()}
          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-semibold px-3 rounded-xl text-sm transition-colors">
          <Plus size={15} /> Add
        </button>
      </div>
    </div>
  );
}
