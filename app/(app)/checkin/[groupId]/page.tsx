"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Check, Loader2, CalendarX, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { DAY_NAMES_FULL } from "@/lib/types";

interface Sess {
  id: string; title: string; time: string | null; duration: number | null;
  gi: boolean; recurring: boolean; day_of_week: number | null; date: string | null;
}

export default function CheckinPage() {
  const { groupId } = useParams();
  const { user } = useAuthStore();
  const sb = createClient();

  const [groupName, setGroupName] = useState("");
  const [isMember, setIsMember]   = useState(false);
  const [sessions, setSessions]   = useState<Sess[]>([]);
  const [done, setDone]           = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [checking, setChecking]   = useState<string | null>(null);
  const [error, setError]         = useState("");

  const today    = format(new Date(), "yyyy-MM-dd");
  const todayDow = new Date().getDay();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: g } = await sb.from("groups").select("name").eq("id", groupId).maybeSingle();
      setGroupName(g?.name ?? "");

      const { data: mem } = await sb.from("group_members")
        .select("user_id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
      setIsMember(!!mem);

      const { data: s } = await sb.from("trainer_sessions")
        .select("id,title,time,duration,gi,recurring,day_of_week,date")
        .eq("group_id", groupId).eq("active", true);
      // Only today's classes (recurring on this weekday, or a one-off dated today)
      const todays = (s ?? []).filter((x: Sess) =>
        x.recurring ? x.day_of_week === todayDow : x.date === today
      );
      setSessions(todays);

      // Already checked in today?
      const { data: att } = await sb.from("attendance")
        .select("trainer_session_id").eq("group_id", groupId).eq("user_id", user.id).eq("date", today);
      if (att && att.length > 0) setDone(att[0].trainer_session_id);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupId]);

  const checkIn = async (sessionId: string) => {
    if (!user) return;
    setChecking(sessionId);
    setError("");
    const { error } = await sb.from("attendance").insert({
      group_id: groupId, trainer_session_id: sessionId, user_id: user.id, date: today,
    });
    if (error && !error.message.includes("duplicate")) {
      setError(error.message); setChecking(null); return;
    }
    setDone(sessionId);
    setChecking(null);
  };

  if (!user) {
    return (
      <Wrap>
        <p className="text-sm text-zinc-400 text-center">Sign in to check in to your class.</p>
        <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl text-sm">Sign In</Link>
      </Wrap>
    );
  }
  if (loading) return <Wrap><Loader2 className="animate-spin text-zinc-500" /></Wrap>;

  if (!isMember) {
    return (
      <Wrap>
        <p className="text-base font-semibold text-zinc-200">Join {groupName || "this gym"} first</p>
        <p className="text-sm text-zinc-500 text-center">Ask your coach for the invite code, then check in.</p>
        <Link href="/groups" className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-5 py-2.5 rounded-xl text-sm">
          Go to Groups <ArrowRight size={15} />
        </Link>
      </Wrap>
    );
  }

  if (done) {
    return (
      <Wrap>
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check size={32} className="text-emerald-400" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-zinc-100">You're checked in! 🥋</p>
        <p className="text-sm text-zinc-500">{groupName} · {format(new Date(), "EEEE, MMM d")}</p>
        <Link href="/dashboard" className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline">Go to app</Link>
      </Wrap>
    );
  }

  if (sessions.length === 0) {
    return (
      <Wrap>
        <CalendarX size={32} className="text-zinc-700" />
        <p className="text-sm font-medium text-zinc-300">No class scheduled right now</p>
        <p className="text-xs text-zinc-600 text-center">There's no class for {groupName} today.</p>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <p className="text-base font-bold text-zinc-100">{groupName}</p>
      <p className="text-sm text-zinc-500">Tap your class to check in</p>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="w-full max-w-sm space-y-2 mt-2">
        {sessions.map(s => (
          <button key={s.id} onClick={() => checkIn(s.id)} disabled={!!checking}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.99] transition-all disabled:opacity-60">
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-zinc-100">{s.title}</p>
              <p className="text-xs text-zinc-500">{s.time?.slice(0,5)} · {s.duration}min · {s.gi ? "Gi" : "No-Gi"}</p>
            </div>
            {checking === s.id ? <Loader2 size={18} className="animate-spin text-red-400" /> : <Check size={18} className="text-zinc-600" />}
          </button>
        ))}
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 gap-4 text-center">
      {children}
    </div>
  );
}
