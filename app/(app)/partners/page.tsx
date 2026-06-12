"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, Users2, Search } from "lucide-react";
import Link from "next/link";
import { usePartnerStore, PARTNER_TAGS, Partner } from "@/store/usePartnerStore";
import { format } from "date-fns";

function randomId() { return Math.random().toString(36).slice(2, 10); }

const BELT_COLORS: Record<string, string> = {
  white:  "bg-zinc-200 text-zinc-800",
  blue:   "bg-blue-500 text-white",
  purple: "bg-violet-500 text-white",
  brown:  "bg-amber-800 text-white",
  black:  "bg-zinc-900 text-white border border-zinc-600",
};

const BELTS = ["White", "Blue", "Purple", "Brown", "Black", "—"];

function blank(): Omit<Partner, "id"> {
  return { name: "", belt: "—", gym: "", notes: "", watchFor: "", tags: [], date: format(new Date(), "yyyy-MM-dd") };
}

export default function PartnersPage() {
  const { partners, add, update, remove } = usePartnerStore();
  const [editing, setEditing] = useState<Partner | null>(null);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState<Omit<Partner, "id">>(blank());
  const [search, setSearch]   = useState("");

  const startAdd  = () => { setForm(blank()); setAdding(true); setEditing(null); };
  const startEdit = (p: Partner) => { setForm({ name: p.name, belt: p.belt, gym: p.gym, notes: p.notes, watchFor: p.watchFor, tags: p.tags, date: p.date }); setEditing(p); setAdding(false); };
  const cancel    = () => { setAdding(false); setEditing(null); };

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) update({ ...editing, ...form });
    else add({ id: randomId(), ...form });
    cancel();
  };

  const visible = search
    ? partners.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.gym.toLowerCase().includes(search.toLowerCase()))
    : partners;

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Training Partners</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">{partners.length} partner{partners.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-3 py-2 text-sm active:scale-95 transition-all">
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Search */}
      {partners.length > 3 && !adding && !editing && (
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" placeholder="Search partners..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
        </div>
      )}

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            {editing ? "Edit Partner" : "New Training Partner"}
          </p>
          <input type="text" placeholder="Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Belt</p>
              <div className="flex flex-wrap gap-1.5">
                {BELTS.map((belt) => (
                  <button key={belt} type="button" onClick={() => setForm((f) => ({ ...f, belt }))}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      form.belt === belt
                        ? (BELT_COLORS[belt.toLowerCase()] ?? "bg-zinc-700 text-zinc-300")
                        : "bg-zinc-800 text-zinc-500"
                    }`}>
                    {belt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Gym (optional)</p>
              <input type="text" placeholder="Gym name" value={form.gym}
                onChange={(e) => setForm((f) => ({ ...f, gym: e.target.value }))}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Style Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.tags.includes(tag)
                      ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <textarea placeholder="Watch for… (e.g. strong darce from turtle, shoots doubles)" value={form.watchFor}
            onChange={(e) => setForm((f) => ({ ...f, watchFor: e.target.value }))}
            rows={2}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />

          <textarea placeholder="General notes on their game..." value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />

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

      {/* List */}
      {visible.length === 0 && !adding ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Users2 size={32} className="text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">No partners added yet</p>
          <p className="text-xs text-zinc-600 max-w-[220px]">Build your scouting notes — know your training partners inside out</p>
          <button onClick={startAdd}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
            Add Partner
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 hover:border-zinc-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  BELT_COLORS[p.belt.toLowerCase()] ?? "bg-zinc-800 text-zinc-400"
                }`}>
                  {p.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">{p.name}</p>
                  <p className="text-xs text-zinc-500">
                    {p.belt !== "—" ? `${p.belt} Belt` : ""}
                    {p.belt !== "—" && p.gym ? " · " : ""}
                    {p.gym}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">{tag}</span>
                  ))}
                </div>
              )}
              {p.watchFor && (
                <div className="bg-red-950/30 border border-red-900/20 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Watch For</p>
                  <p className="text-xs text-zinc-300">{p.watchFor}</p>
                </div>
              )}
              {p.notes && <p className="text-xs text-zinc-400 leading-relaxed">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
