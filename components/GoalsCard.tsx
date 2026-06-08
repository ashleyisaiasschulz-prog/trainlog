"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Target, Plus, Check, X } from "lucide-react";
import { randomId } from "@/lib/id";

interface Goal { id: string; text: string; done: boolean }

export default function GoalsCard() {
  const { user } = useAuthStore();
  const sb = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!user) return;
    sb.from("goals").select("id,text,done").eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setGoals((data as Goal[]) ?? []));
  }, [user]);

  const add = async () => {
    if (!user || !text.trim()) return;
    const g = { id: randomId(), text: text.trim(), done: false };
    setGoals(gs => [...gs, g]);
    setText(""); setAdding(false);
    await sb.from("goals").insert({ ...g, user_id: user.id });
  };

  const toggle = async (g: Goal) => {
    setGoals(gs => gs.map(x => x.id === g.id ? { ...x, done: !x.done } : x));
    await sb.from("goals").update({ done: !g.done }).eq("id", g.id);
  };

  const remove = async (id: string) => {
    setGoals(gs => gs.filter(x => x.id !== id));
    await sb.from("goals").delete().eq("id", id);
  };

  const openCount = goals.filter(g => !g.done).length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-red-400"/>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            Goals {openCount > 0 && <span className="text-zinc-400 ml-1">{openCount} open</span>}
          </p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="text-zinc-500 hover:text-zinc-300">
          <Plus size={16}/>
        </button>
      </div>

      {adding && (
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="e.g. Land 10 triangles this month" autoFocus
            className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"/>
          <button onClick={add} className="bg-red-600 hover:bg-red-500 text-white px-3 rounded-xl text-sm">Add</button>
        </div>
      )}

      {goals.length === 0 && !adding ? (
        <p className="text-xs text-zinc-600">Set a goal to stay focused on your progress.</p>
      ) : (
        <div className="space-y-1.5">
          {goals.map(g => (
            <div key={g.id} className="flex items-center gap-2.5 group">
              <button onClick={() => toggle(g)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  g.done ? "bg-emerald-500 border-emerald-500" : "border-zinc-600 hover:border-zinc-500"
                }`}>
                {g.done && <Check size={12} className="text-white" strokeWidth={3}/>}
              </button>
              <span className={`flex-1 text-sm ${g.done ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
                {g.text}
              </span>
              <button onClick={() => remove(g.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
