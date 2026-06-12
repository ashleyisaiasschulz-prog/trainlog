"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import BeltBadge from "@/components/BeltBadge";
import type { Belt } from "@/lib/types";
import { startOfMonth, format } from "date-fns";

interface LeaderEntry {
  userId: string;
  username: string;
  displayName: string | null;
  belt: Belt;
  stripes: number;
  gym: string | null;
  count: number;
  isMe: boolean;
}

export default function LeaderboardPage() {
  const { user, profile } = useAuthStore();
  const [rows, setRows]   = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState<string | null>(null);
  const sb = createClient();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    setLoading(true);
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const myGym = profile?.gym ?? null;
    setGymName(myGym);

    // Fetch sessions from this month for all users, plus their profiles
    let sessQuery = sb
      .from("sessions")
      .select("user_id")
      .gte("date", monthStart);

    const { data: sessionData, error: sessErr } = await sessQuery;
    if (sessErr || !sessionData) { setLoading(false); return; }

    // Count sessions per user
    const counts: Record<string, number> = {};
    for (const row of sessionData) {
      counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
    }

    const userIds = Object.keys(counts);
    if (userIds.length === 0) { setRows([]); setLoading(false); return; }

    // Fetch profiles for those users
    let profileQuery = sb
      .from("profiles")
      .select("id,username,display_name,belt,stripes,gym")
      .in("id", userIds);

    // Filter by same gym if user has one
    if (myGym) {
      profileQuery = profileQuery.ilike("gym", myGym);
    }

    const { data: profileData } = await profileQuery;

    const entries: LeaderEntry[] = (profileData ?? []).map((p) => ({
      userId:      p.id,
      username:    p.username,
      displayName: p.display_name,
      belt:        (p.belt ?? "white") as Belt,
      stripes:     p.stripes ?? 0,
      gym:         p.gym,
      count:       counts[p.id] ?? 0,
      isMe:        p.id === user!.id,
    }));

    // Sort by count desc
    entries.sort((a, b) => b.count - a.count);
    setRows(entries);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-zinc-100">Leaderboard</h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Trophy size={32} className="text-zinc-700" />
          <p className="text-sm text-zinc-400">Sign in to see the leaderboard</p>
          <Link href="/login" className="flex items-center gap-1.5 bg-red-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
            <LogIn size={15} /> Sign In
          </Link>
        </div>
      </div>
    );
  }

  const month = format(new Date(), "MMMM yyyy");

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Leaderboard</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {gymName ? gymName : "Global"} · {month}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="text-zinc-600 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Trophy size={32} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">No training data this month yet</p>
          {gymName && (
            <p className="text-xs text-zinc-600 max-w-[240px]">No gym mates found for "{gymName}" — make sure your gym name matches exactly</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((entry, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
            return (
              <div key={entry.userId}
                className={`flex items-center gap-3 bg-zinc-900 border rounded-2xl px-4 py-3 transition-all ${
                  entry.isMe ? "border-red-500/40 bg-red-950/20" : "border-zinc-800"
                }`}>
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-zinc-600 tabular-nums">#{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  entry.isMe ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {(entry.displayName || entry.username)[0].toUpperCase()}
                </div>

                {/* Name + belt */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">
                    {entry.displayName || entry.username}
                    {entry.isMe && <span className="text-xs text-red-400 font-normal ml-1">(you)</span>}
                  </p>
                  <div className="mt-0.5">
                    <BeltBadge belt={entry.belt} stripes={entry.stripes} size="sm" />
                  </div>
                </div>

                {/* Session count */}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-zinc-100 tabular-nums">{entry.count}</p>
                  <p className="text-[10px] text-zinc-600">session{entry.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!gymName && (
        <p className="text-xs text-zinc-600 text-center">
          Add your gym in <Link href="/account" className="text-zinc-500 underline">Account</Link> to see your gym&apos;s leaderboard
        </p>
      )}
    </div>
  );
}
