"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Code, X, Plus, LogIn, Trash2 } from "lucide-react";

interface DevAccount { label: string; email: string; password: string }

const KEY = "trainlog-dev-accounts";

export default function DevSwitcher() {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<DevAccount[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", email: "", password: "" });
  const [busy, setBusy] = useState("");
  const { user, profile } = useAuthStore();

  useEffect(() => {
    try { setAccounts(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);

  const save = (next: DevAccount[]) => {
    setAccounts(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const switchTo = async (acc: DevAccount) => {
    setBusy(acc.email);
    const sb = createClient();
    await sb.auth.signOut();
    const { error } = await sb.auth.signInWithPassword({ email: acc.email, password: acc.password });
    if (error) { alert(`Login failed for ${acc.label}: ${error.message}`); setBusy(""); return; }
    window.location.assign("/dashboard");
  };

  const addCurrent = () => {
    if (!user) return;
    setForm({ label: profile?.username || user.email?.split("@")[0] || "Account", email: user.email || "", password: "" });
    setAdding(true);
  };

  const saveNew = () => {
    if (!form.email || !form.password) return;
    save([...accounts.filter(a => a.email !== form.email), form].slice(0, 5));
    setForm({ label: "", email: "", password: "" });
    setAdding(false);
  };

  // Only render in development
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <>
      {/* Floating toggle */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-4 z-[60] w-11 h-11 rounded-full bg-amber-500 text-black shadow-lg flex items-center justify-center hover:bg-amber-400 transition-colors"
        title="Dev account switcher">
        {open ? <X size={18}/> : <Code size={18}/>}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-[60] w-72 bg-zinc-900 border border-amber-500/30 rounded-2xl p-3 shadow-2xl space-y-2">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-1">Dev Account Switcher</p>

          {accounts.length === 0 && !adding && (
            <p className="text-xs text-zinc-500 px-1 py-2">No saved accounts. Add up to 5.</p>
          )}

          {accounts.map(acc => (
            <div key={acc.email} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl p-2">
              <button onClick={() => switchTo(acc)} disabled={!!busy}
                className="flex-1 flex items-center gap-2 text-left min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  user?.email === acc.email ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-300"
                }`}>
                  {acc.label[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate">{acc.label}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{acc.email}</p>
                </div>
              </button>
              {user?.email === acc.email
                ? <span className="text-[9px] text-amber-400 font-bold shrink-0">ACTIVE</span>
                : <LogIn size={13} className="text-zinc-500 shrink-0"/>}
              <button onClick={() => save(accounts.filter(a => a.email !== acc.email))}
                className="text-zinc-600 hover:text-red-400 shrink-0"><Trash2 size={12}/></button>
            </div>
          ))}

          {adding ? (
            <div className="space-y-1.5 pt-1">
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}
                placeholder="Label" className="w-full bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"/>
              <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                placeholder="Email" className="w-full bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"/>
              <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                type="password" placeholder="Password" className="w-full bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"/>
              <div className="flex gap-1.5">
                <button onClick={()=>setAdding(false)} className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs">Cancel</button>
                <button onClick={saveNew} className="flex-1 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => setAdding(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700">
                <Plus size={12}/> Add
              </button>
              {user && (
                <button onClick={addCurrent}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700">
                  Save current
                </button>
              )}
            </div>
          )}
          <p className="text-[9px] text-zinc-600 px-1">Dev only · stored locally · never shipped to prod</p>
        </div>
      )}
    </>
  );
}
