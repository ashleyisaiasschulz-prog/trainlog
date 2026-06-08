"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { UserPlus, Users, Check, X, Search, ChevronRight, LogIn, UsersRound } from "lucide-react";
import Link from "next/link";
import BeltBadge from "@/components/BeltBadge";
import type { Belt } from "@/lib/types";

interface Profile {
  id: string; username: string; display_name: string | null;
  gym: string | null; belt: string; stripes: number;
  share_stats: boolean; share_belt: boolean; is_trainer: boolean;
}

function RoleBadge({ isTrainer }: { isTrainer?: boolean }) {
  return isTrainer ? (
    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md shrink-0">👨‍🏫 Coach</span>
  ) : (
    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-700/50 px-2 py-0.5 rounded-md shrink-0">Student</span>
  );
}

interface FriendEntry { id: string; profiles: Profile }

const PROFILE_COLS = "id,username,display_name,gym,belt,stripes,share_stats,share_belt,is_trainer";

export default function FriendsPage() {
  const { user, profile } = useAuthStore();
  const [friends, setFriends]     = useState<FriendEntry[]>([]);
  const [pending, setPending]     = useState<FriendEntry[]>([]);
  const [search, setSearch]       = useState("");
  const [results, setResults]     = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const sb = createClient();

  const loadFriends = async () => {
    if (!user) return;

    // Step 1: accepted friendship rows (IDs only, no JOIN — avoids RLS null issues)
    const { data } = await sb
      .from("friendships")
      .select("id, requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    // Pick the "other" person's ID, dedupe
    const seen = new Set<string>();
    const entries: Array<{ id: string; friendId: string }> = [];
    for (const row of (data ?? [] as any[])) {
      const friendId = row.requester_id === user.id ? row.addressee_id : row.requester_id;
      if (!seen.has(friendId)) {
        seen.add(friendId);
        entries.push({ id: row.id, friendId });
      }
    }

    // Step 2: fetch profiles separately so an update to belt/stripes doesn't break the JOIN
    const profileMap = new Map<string, Profile>();
    if (entries.length > 0) {
      const { data: profileData } = await sb
        .from("profiles")
        .select(PROFILE_COLS)
        .in("id", entries.map(e => e.friendId));
      for (const p of (profileData as Profile[] ?? [])) profileMap.set(p.id, p);
    }

    const mapped: FriendEntry[] = entries.map(e => ({
      id: e.id,
      profiles: profileMap.get(e.friendId) as Profile,
    }));

    // Incoming pending requests — also use separate profile fetch
    const { data: pendingData } = await sb
      .from("friendships")
      .select("id, requester_id")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    const pendingProfileMap = new Map<string, Profile>();
    const pendingIds = (pendingData ?? [] as any[]).map((r: any) => r.requester_id);
    if (pendingIds.length > 0) {
      const { data: pendingProfiles } = await sb
        .from("profiles")
        .select(PROFILE_COLS)
        .in("id", pendingIds);
      for (const p of (pendingProfiles as Profile[] ?? [])) pendingProfileMap.set(p.id, p);
    }

    const pendingMapped: FriendEntry[] = (pendingData ?? [] as any[]).map((row: any) => ({
      id: row.id,
      profiles: pendingProfileMap.get(row.requester_id) as Profile,
    }));

    setFriends(mapped);
    setPending(pendingMapped);
  };

  useEffect(() => { loadFriends(); }, [user]);

  const handleSearch = async () => {
    if (!search.trim() || !user) return;
    setSearching(true);
    const { data } = await sb
      .from("profiles")
      .select(PROFILE_COLS)
      .ilike("username", `%${search}%`)
      .neq("id", user.id)
      .limit(10);
    setResults((data as Profile[]) ?? []);
    setSearching(false);
  };

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    // Don't create a duplicate if a friendship already exists in either direction
    const { data: existing } = await sb
      .from("friendships")
      .select("id")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
      .maybeSingle();
    if (!existing) {
      await sb.from("friendships").insert({ requester_id: user.id, addressee_id: addresseeId });
    }
    setResults(r => r.filter(p => p.id !== addresseeId));
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) {
      await sb.from("friendships").update({ status: "accepted" }).eq("id", id);
    } else {
      await sb.from("friendships").delete().eq("id", id);
    }
    await loadFriends();
  };

  const removeFriend = async (id: string) => {
    await sb.from("friendships").delete().eq("id", id);
    setFriends(f => f.filter(x => x.id !== id));
  };

  if (!user) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users size={40} className="text-zinc-700" />
        <p className="text-zinc-400 font-medium text-center">Sign in to connect with training partners</p>
        <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2">
          <LogIn size={16}/> Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Friends</h1>
        <Link href="/groups"
          className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-3 py-2 rounded-xl transition-colors">
          <UsersRound size={15}/> Groups
        </Link>
      </div>

      {/* Search */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Find Training Partners</p>
        <div className="flex gap-2">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by username…"
            className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button onClick={handleSearch}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl transition-colors">
            <Search size={16}/>
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                  {(p.display_name || p.username)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-zinc-100">@{p.username}</p>
                    <RoleBadge isTrainer={p.is_trainer}/>
                  </div>
                  {p.gym && <p className="text-xs text-zinc-500">{p.gym}</p>}
                </div>
                {p.share_belt && (
                  <div className="w-20">
                    <BeltBadge belt={p.belt as Belt} stripes={p.stripes} size="sm" showLabel={false}/>
                  </div>
                )}
                <button onClick={() => sendRequest(p.id)}
                  className="bg-red-600/10 text-red-400 hover:bg-red-600/20 p-2 rounded-lg transition-colors">
                  <UserPlus size={15}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            Friend Requests <span className="text-red-400 ml-1">{pending.length}</span>
          </p>
          {pending.map(f => (
            <div key={f.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                {(f.profiles?.display_name || f.profiles?.username || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-zinc-100">@{f.profiles?.username}</p>
                  <RoleBadge isTrainer={f.profiles?.is_trainer}/>
                </div>
                {f.profiles?.gym && <p className="text-xs text-zinc-500">{f.profiles.gym}</p>}
              </div>
              <button onClick={() => respond(f.id, true)}
                className="w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg flex items-center justify-center transition-colors">
                <Check size={15}/>
              </button>
              <button onClick={() => respond(f.id, false)}
                className="w-8 h-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                <X size={15}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          My Friends <span className="text-zinc-600 ml-1">{friends.length}</span>
        </p>
        {friends.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <Users size={28} className="text-zinc-700 mx-auto mb-2"/>
            <p className="text-sm text-zinc-500">No friends yet — search by username above</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(f => {
              const p = f.profiles;
              return (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                    {(p?.display_name || p?.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-zinc-100">@{p?.username}</p>
                      <RoleBadge isTrainer={p?.is_trainer}/>
                    </div>
                    {p?.gym && <p className="text-xs text-zinc-500">{p.gym}</p>}
                    {p?.share_belt && (
                      <div className="mt-1 w-28">
                        <BeltBadge belt={p.belt as Belt} stripes={p.stripes} size="sm" showLabel={true}/>
                      </div>
                    )}
                  </div>
                  {p?.share_stats && (
                    <Link href={`/friends/${p.id}`}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      Stats <ChevronRight size={12}/>
                    </Link>
                  )}
                  <button onClick={() => removeFriend(f.id)}
                    className="text-zinc-700 hover:text-red-500 transition-colors p-1">
                    <X size={14}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
