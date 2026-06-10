"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, Calendar, Zap, Lock } from "lucide-react";
import Link from "next/link";
import BeltBadge from "@/components/BeltBadge";
import type { Belt } from "@/lib/types";

interface Profile {
  id: string; username: string; display_name: string | null;
  gym: string | null; belt: string; stripes: number;
  share_stats: boolean; share_belt: boolean; is_trainer: boolean;
}

export default function FriendStatsPage() {
  const { id } = useParams();
  const sb = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
      setProfile(p);
      if (p?.share_stats) {
        // RLS only returns rows if we're an accepted friend & they share_stats
        const { data: s } = await sb
          .from("training_sessions").select("*").eq("user_id", id)
          .order("date", { ascending: false });
        setSessions(s ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="px-4 pt-5 text-center text-zinc-500 text-sm">Loading…</div>;
  if (!profile) return <div className="px-4 pt-5 text-center text-zinc-500 text-sm">Profile not found.</div>;

  // Aggregate stats
  const totalHours = Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60);
  const thisWeek = sessions.filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 864e5)).length;

  const topItems = (key: string) => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => (s[key] ?? []).forEach((x: string) => (counts[x] = (counts[x] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const positions = topItems("positions");
  const subsGiven = topItems("submissions_given");
  const subsRecvd = topItems("submissions_received");
  const max = (arr: [string, number][]) => Math.max(1, ...arr.map(x => x[1]));

  const Bars = ({ data, color }: { data: [string, number][]; color: string }) => {
    const m = max(data);
    return (
      <div className="space-y-2">
        {data.map(([name, n]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-28 text-right truncate">{name}</span>
            <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(n / m) * 100}%`, background: color }} />
            </div>
            <span className="text-xs font-semibold text-zinc-300 w-5 text-right">{n}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/friends" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">@{profile.username}</h1>
      </div>

      {/* Profile card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-2xl font-bold text-red-400">
          {(profile.display_name || profile.username)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-zinc-100">{profile.display_name || profile.username}</p>
            {profile.is_trainer ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">👨‍🏫 Coach</span>
            ) : (
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-700/50 px-2 py-0.5 rounded-md">Student</span>
            )}
          </div>
          {profile.gym && <p className="text-xs text-zinc-500">{profile.gym}</p>}
          {profile.share_belt && (
            <div className="mt-2 w-32"><BeltBadge belt={profile.belt as Belt} stripes={profile.stripes} size="sm" showLabel={true}/></div>
          )}
        </div>
      </div>

      {!profile.share_stats ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Lock size={24} className="text-zinc-700 mx-auto mb-2"/>
          <p className="text-sm text-zinc-500">This user keeps their stats private.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-500">No training sessions logged yet.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: sessions.length === 1 ? "Session" : "Sessions", value: sessions.length },
              { icon: Clock, label: "Hours", value: `${totalHours}h` },
              { icon: Zap, label: "This week", value: thisWeek },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
                <Icon size={14} className="text-zinc-600 mx-auto mb-1.5"/>
                <p className="text-lg font-bold text-zinc-100 tabular-nums leading-none">{value}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {positions.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Most Worked Positions</p>
              <Bars data={positions} color="#ef4444"/>
            </div>
          )}
          {subsGiven.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-widest">Submissions Landed</p>
              <Bars data={subsGiven} color="#22c55e"/>
            </div>
          )}
          {subsRecvd.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-widest">Got Caught By</p>
              <Bars data={subsRecvd} color="#f87171"/>
            </div>
          )}
        </>
      )}
    </div>
  );
}
