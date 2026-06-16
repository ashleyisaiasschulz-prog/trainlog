"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Users, Plus, LogIn, ChevronRight, Hash } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string; name: string; description: string | null;
  gym: string | null; trainer_id: string; invite_code: string;
  memberCount?: number;
}

export default function GroupsPage() {
  const { user, profile } = useAuthStore();
  const [myGroups, setMyGroups]   = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]   = useState(false);
  const [code, setCode]           = useState("");
  const [form, setForm]           = useState({ name: "", description: "", gym: "" });
  const [error, setError]         = useState("");
  const sb = createClient();

  const isGroupOwner = myGroups.some(g => g.trainer_id === user?.id);

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await sb
      .from("group_members")
      .select("groups(id,name,description,gym,trainer_id,invite_code)")
      .eq("user_id", user.id);
    setMyGroups((data?.map((d: any) => d.groups) ?? []) as Group[]);
  };

  useEffect(() => { loadGroups(); }, [user]);

  const createGroup = async () => {
    if (!user || !form.name.trim()) return;
    setError("");
    const { data, error: err } = await sb.from("groups")
      .insert({ name: form.name, description: form.description, gym: form.gym, trainer_id: user.id })
      .select().single();
    if (err || !data) { setError("Could not create group: " + (err?.message ?? "unknown")); return; }
    // Add creator as trainer member
    const { error: memErr } = await sb.from("group_members")
      .insert({ group_id: data.id, user_id: user.id, role: "trainer" });
    if (memErr) { setError("Group made but join failed: " + memErr.message); }
    setForm({ name: "", description: "", gym: "" });
    setShowCreate(false);
    await loadGroups();
  };

  const joinGroup = async () => {
    if (!user || !code.trim()) return;
    setError("");
    const { data: result, error: err } = await sb.rpc("join_group", { p_code: code.trim() });
    if (err) { setError(err.message); return; }
    if (result === "not_found")      { setError("Invalid invite code"); return; }
    if (result === "already_member") { setError("You're already in this group"); return; }
    setCode(""); setShowJoin(false);
    await loadGroups();
  };

  if (!user) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users size={40} className="text-zinc-700" />
        <p className="text-zinc-400 font-medium text-center">Sign in to access groups</p>
        <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2">
          <LogIn size={16}/> Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Groups</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowJoin(v=>!v); setShowCreate(false); }}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5">
            <Hash size={14}/> Join
          </button>
          {(isGroupOwner || myGroups.length === 0) && (
            <button onClick={() => { setShowCreate(v=>!v); setShowJoin(false); }}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5">
              <Plus size={14}/> Create
            </button>
          )}
        </div>
      </div>

      {/* Join by code */}
      {showJoin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-100">Join with Invite Code</p>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123" maxLength={6}
              className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 tracking-widest font-mono uppercase" />
            <button onClick={joinGroup}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-3 rounded-xl text-sm">
              Join
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Create group */}
      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-100">Create Group</p>
          <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
            placeholder="Group name (e.g. Alliance Adults)" required
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          <input value={form.gym} onChange={e => setForm(f=>({...f,gym:e.target.value}))}
            placeholder="Gym name (optional)"
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)}
              className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 text-sm font-medium">Cancel</button>
            <button onClick={createGroup} disabled={!form.name.trim()}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-30">Create</button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {myGroups.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Users size={28} className="text-zinc-700 mx-auto mb-3"/>
          <p className="text-sm font-medium text-zinc-400">No groups yet</p>
          <p className="text-xs text-zinc-600 mt-1">
            Create a group as a coach, or join one with an invite code.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {myGroups.map(g => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 active:scale-[0.985] transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-base shrink-0">
                  {g.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{g.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {g.gym && `${g.gym} · `}Code: <span className="font-mono text-zinc-400">{g.invite_code}</span>
                  </p>
                </div>
                {g.trainer_id === user.id && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">Admin</span>
                )}
                <ChevronRight size={15} className="text-zinc-700 shrink-0"/>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
