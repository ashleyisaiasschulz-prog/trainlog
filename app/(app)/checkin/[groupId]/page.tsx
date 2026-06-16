"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Check, Loader2, CalendarX, ArrowRight } from "lucide-react";
import { format } from "date-fns";

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
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [rsvpd, setRsvpd]         = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState<string | null>(null);
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
      const todays = (s ?? []).filter((x: Sess) =>
        x.recurring ? x.day_of_week === todayDow : x.date === today
      );
      setSessions(todays);

      // What did I already check into today?
      const { data: att } = await sb.from("attendance")
        .select("trainer_session_id").eq("group_id", groupId).eq("user_id", user.id).eq("date", today);
      setCheckedIn(new Set((att ?? []).map((a: any) => a.trainer_session_id)));

      // Which of today's sessions did I RSVP "going" to? (just to highlight)
      const { data: rs } = await sb.from("session_rsvps")
        .select("trainer_session_id")
        .eq("user_id", user.id).eq("status", "going").eq("occurrence_date", today)
        .in("trainer_session_id", todays.map(t => t.id));
      setRsvpd(new Set((rs ?? []).map((r: any) => r.trainer_session_id)));

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupId]);

  // A class can be checked into until 1 hour after it ends. After that the
  // window is closed (keeps attendance honest).
  const GRACE_MIN = 60;
  const isClosed = (s: Sess) => {
    if (!s.time) return false;
    const [h, m] = s.time.split(":").map(Number);
    const end = new Date(today + "T00:00:00");
    end.setHours(h, m + (s.duration ?? 60) + GRACE_MIN, 0, 0);
    return new Date() > end;
  };

  const toggle = async (sessionId: string) => {
    if (!user || busy) return;
    setBusy(sessionId);
    setError("");
    const already = checkedIn.has(sessionId);

    if (already) {
      // Un-check (mis-tap)
      const { error } = await sb.from("attendance")
        .delete()
        .eq("trainer_session_id", sessionId).eq("user_id", user.id).eq("date", today);
      if (error) { setError(error.message); setBusy(null); return; }
      setCheckedIn(prev => { const n = new Set(prev); n.delete(sessionId); return n; });
    } else {
      const { error } = await sb.from("attendance").insert({
        group_id: groupId, trainer_session_id: sessionId, user_id: user.id, date: today,
      });
      if (error && !error.message.includes("duplicate")) { setError(error.message); setBusy(null); return; }
      setCheckedIn(prev => new Set(prev).add(sessionId));
    }
    setBusy(null);
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
          Go to Gym <ArrowRight size={15} />
        </Link>
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

  const anyChecked = checkedIn.size > 0;

  return (
    <Wrap>
      <p className="text-base font-bold text-zinc-100">{groupName}</p>
      <p className="text-sm text-zinc-500">
        {anyChecked ? "You're checked in 🥋 — tap to change" : "Which class are you here for?"}
      </p>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="w-full max-w-sm space-y-2 mt-2">
        {sessions.map(s => {
          const on = checkedIn.has(s.id);
          const mineRsvp = rsvpd.has(s.id);
          const closed = isClosed(s) && !on;   // checked-in stays visible/locked
          return (
            <button key={s.id} onClick={() => toggle(s.id)} disabled={!!busy || closed}
              className={`w-full rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.99] transition-all disabled:opacity-60 border ${
                on ? "bg-emerald-500/10 border-emerald-500/40" : "bg-zinc-900 border-zinc-800 hover:border-red-500/40"
              }`}>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-100">{s.title}</p>
                  {mineRsvp && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md">signed up</span>
                  )}
                  {closed && (
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md">closed</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{s.time?.slice(0,5)} · {s.duration}min · {s.gi ? "Gi" : "No-Gi"}</p>
              </div>
              {busy === s.id ? (
                <Loader2 size={18} className="animate-spin text-red-400" />
              ) : (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  on ? "bg-emerald-500 border-emerald-500" : "border-zinc-600"
                }`}>
                  {on && <Check size={14} className="text-white" strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {anyChecked && (
        <Link href="/dashboard" className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline">Done · go to app</Link>
      )}
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
