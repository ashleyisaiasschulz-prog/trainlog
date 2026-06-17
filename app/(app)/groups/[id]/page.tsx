"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Plus, Calendar, Users, Clock, Check, X, Trash2, Target, BarChart2, MessageCircle, Send, Crown, Trophy, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { DAY_NAMES_FULL, BELT_COLORS, Belt } from "@/lib/types";
import { format, differenceInDays, parseISO } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

// Belt → avatar styling (bg + text + ring)
function beltAvatar(belt?: string) {
  const b = (belt ?? "white") as Belt;
  const c = BELT_COLORS[b] ?? BELT_COLORS.white;
  // white belt needs dark text; others white text
  const text = b === "white" ? "text-zinc-900" : "text-white";
  return `${c.bg} ${text}`;
}

interface Group {
  id: string; name: string; description: string | null;
  gym: string | null; trainer_id: string; invite_code: string;
  max_coaches?: number | null; is_gym?: boolean | null;
}
interface MiniProfile { username: string; display_name: string | null; belt: string; stripes: number }
interface Member { user_id: string; role: string; joined_at?: string | null; profiles: MiniProfile }
interface TrainerSession {
  id: string; title: string; description: string | null; focus: string | null;
  date: string | null; time: string | null; duration: number | null;
  gi: boolean; recurring: boolean; day_of_week: number | null; active: boolean;
}
interface Rsvp { id: string; trainer_session_id: string; user_id: string; status: string; occurrence_date: string | null }
interface Occurrence { session: TrainerSession; date: string; key: string }
interface CoachNote { general: string; promotion: string }
interface ChatMessage {
  id: string; user_id: string; content: string; created_at: string;
  profiles?: { username: string; display_name: string | null };
}

export default function GroupDetailPage() {
  return <Suspense><GroupDetailInner /></Suspense>;
}

function GroupDetailInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const sb = createClient();

  const [group, setGroup]       = useState<Group | null>(null);
  const [members, setMembers]   = useState<Member[]>([]);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [rsvps, setRsvps]       = useState<Rsvp[]>([]);
  const [coachNotes, setCoachNotes] = useState<Record<string, CoachNote>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState<CoachNote>({ general: "", promotion: "" });
  const [attendance, setAttendance] = useState<{ trainer_session_id: string; user_id: string; date: string }[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const [tab, setTab]           = useState<"sessions" | "members" | "chat" | "insights" | "board">("board");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", focus: "", date: format(new Date(), "yyyy-MM-dd"),
    time: "19:00", duration: 90, gi: true, recurring: false, day_of_week: 2,
  });

  const isGym   = !!group?.is_gym;
  const isOwner = group?.trainer_id === user?.id;   // the group admin
  const myRole  = members.find(m => m.user_id === user?.id)?.role;
  // Coaching privileges (schedule, insights) exist only in a paid gym.
  const canCoach = isGym && (isOwner || myRole === "trainer" || myRole === "coach");

  const isCoachRole = (m: Member) => m.role === "trainer" || m.role === "coach" || m.user_id === group?.trainer_id;
  const coaches  = members.filter(isCoachRole);
  const students = members.filter(m => !isCoachRole(m));
  const maxCoaches = group?.max_coaches ?? 3;
  const canAddCoach = coaches.length < maxCoaches;

  const setRole = async (uid: string, role: "coach" | "student") => {
    await sb.from("group_members").update({ role }).eq("group_id", id).eq("user_id", uid);
    await load();
  };

  const kickMember = async (uid: string) => {
    if (!confirm("Remove this member from the group?")) return;
    await sb.from("group_members").delete().eq("group_id", id).eq("user_id", uid);
    await load();
  };

  const deleteGroup = async () => {
    if (!confirm("Delete this group permanently? This cannot be undone.")) return;
    await sb.from("groups").delete().eq("id", id);
    router.push("/groups");
  };

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError]     = useState("");

  const saveCoachNote = async (studentId: string) => {
    if (!user) return;
    await sb.from("coach_notes").upsert({
      group_id: id, student_id: studentId,
      general: noteForm.general, promotion: noteForm.promotion,
      updated_by: user.id, updated_at: new Date().toISOString(),
    }, { onConflict: "group_id,student_id" });
    setEditingNote(null);
    await load();
  };

  const upgradeToGym = async () => {
    if (!user) return;
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/gym-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, groupId: id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setBillingError(data.error ?? "Could not start checkout"); setBillingLoading(false); }
    } catch {
      setBillingError("Network error"); setBillingLoading(false);
    }
  };

  const load = async () => {
    if (!user) return;
    const { data: g } = await sb.from("groups").select("*").eq("id", id).single();
    setGroup(g);
    const { data: m } = await sb.from("group_members")
      .select("user_id, role, joined_at, profiles(username,display_name,belt,stripes)")
      .eq("group_id", id);
    setMembers((m as unknown as Member[]) ?? []);
    const { data: s } = await sb.from("trainer_sessions")
      .select("*").eq("group_id", id).eq("active", true).order("date", { ascending: true });
    setSessions((s as TrainerSession[]) ?? []);
    const { data: r } = await sb.from("session_rsvps").select("id,trainer_session_id,user_id,status,occurrence_date");
    setRsvps((r as Rsvp[]) ?? []);
    // Coach notes (RLS returns rows only for coaches of a paid gym)
    const { data: cn } = await sb.from("coach_notes")
      .select("student_id, general, promotion").eq("group_id", id);
    const map: Record<string, CoachNote> = {};
    (cn ?? []).forEach((n: any) => { map[n.student_id] = { general: n.general ?? "", promotion: n.promotion ?? "" }; });
    setCoachNotes(map);
    // Attendance (RLS: coaches see all, students see their own)
    const { data: att } = await sb.from("attendance")
      .select("trainer_session_id, user_id, date").eq("group_id", id);
    setAttendance((att as any) ?? []);
  };

  useEffect(() => { load(); }, [user, id]);

  // Default to the Plan tab in a gym (Board for social groups). Runs once.
  const tabInitRef = useRef(false);
  useEffect(() => {
    if (!group || tabInitRef.current) return;
    tabInitRef.current = true;
    if (group.is_gym) setTab("sessions");
  }, [group]);

  // Realtime: refresh RSVPs + attendance when they change
  useEffect(() => {
    const channel = sb
      .channel(`group-rsvps-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "session_rsvps" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `group_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // After a gym checkout, confirm payment and unlock the group.
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    (async () => {
      try {
        await fetch("/api/stripe/verify-gym", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch { /* ignore */ }
      router.replace(`/groups/${id}`);
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Resolve a user_id → display name using the loaded member list
  const nameOf = (uid: string) => {
    const m = members.find(x => x.user_id === uid);
    return m?.profiles?.display_name || m?.profiles?.username || "Someone";
  };
  const beltOf = (uid: string) =>
    members.find(x => x.user_id === uid)?.profiles?.belt ?? "white";
  const goingUsers = (sid: string, date: string) =>
    rsvps.filter(r => r.trainer_session_id === sid && r.occurrence_date === date && r.status === "going").map(r => r.user_id);

  const attendedOn = (sid: string, date: string) =>
    attendance.filter(a => a.trainer_session_id === sid && a.date === date).map(a => a.user_id);
  const checkinUrl = `${origin}/checkin/${id}`;

  // Expand recurring templates into concrete dated occurrences (next 4 weeks),
  // one-off sessions stay as their single date. Each occurrence gets its own
  // RSVP / attendance via occurrence_date.
  const WEEKS_AHEAD = 4;
  const buildOccurrences = (): Occurrence[] => {
    const out: Occurrence[] = [];
    for (const s of sessions) {
      if (s.recurring && s.day_of_week != null) {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        const diff = (s.day_of_week - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        for (let i = 0; i < WEEKS_AHEAD; i++) {
          const dateStr = format(d, "yyyy-MM-dd");
          out.push({ session: s, date: dateStr, key: `${s.id}-${dateStr}` });
          d.setDate(d.getDate() + 7);
        }
      } else if (s.date) {
        out.push({ session: s, date: s.date, key: `${s.id}-${s.date}` });
      }
    }
    out.sort((a, b) =>
      (a.date + (a.session.time ?? "")).localeCompare(b.date + (b.session.time ?? ""))
    );
    return out;
  };

  const resetForm = () =>
    setForm({
      title: "", description: "", focus: "", date: format(new Date(), "yyyy-MM-dd"),
      time: "19:00", duration: 90, gi: true, recurring: false, day_of_week: 2,
    });

  const startCreate = () => { setEditingId(null); resetForm(); setShowForm(true); };

  const startEdit = (s: TrainerSession) => {
    setEditingId(s.id);
    setForm({
      title: s.title, description: s.description ?? "", focus: s.focus ?? "",
      date: s.date ?? format(new Date(), "yyyy-MM-dd"),
      time: (s.time ?? "19:00").slice(0, 5), duration: s.duration ?? 90, gi: s.gi,
      recurring: s.recurring, day_of_week: s.day_of_week ?? 2,
    });
    setShowForm(true);
  };

  const saveSession = async () => {
    if (!user || !form.title.trim()) return;
    const payload = {
      title: form.title, description: form.description, focus: form.focus,
      date: form.recurring ? null : form.date,
      time: form.time, duration: form.duration, gi: form.gi,
      recurring: form.recurring, day_of_week: form.recurring ? form.day_of_week : null,
    };
    if (editingId) {
      await sb.from("trainer_sessions").update(payload).eq("id", editingId);
    } else {
      await sb.from("trainer_sessions").insert({ ...payload, group_id: id, trainer_id: user.id });
    }
    setShowForm(false);
    setEditingId(null);
    resetForm();
    await load();
  };

  const deleteSession = async (sid: string) => {
    await sb.from("trainer_sessions").update({ active: false }).eq("id", sid);
    await load();
  };

  const myRsvp = (sid: string, date: string) =>
    rsvps.find(r => r.trainer_session_id === sid && r.occurrence_date === date && r.user_id === user?.id);

  const toggleRsvp = async (sid: string, date: string, going: boolean) => {
    if (!user) return;
    const existing = myRsvp(sid, date);
    if (existing) {
      await sb.from("session_rsvps").update({ status: going ? "going" : "not_going" }).eq("id", existing.id);
    } else {
      await sb.from("session_rsvps").insert({
        trainer_session_id: sid, user_id: user.id, status: going ? "going" : "not_going",
        occurrence_date: date,
      });
    }
    await load();
  };

  if (!group) {
    return <div className="px-4 pt-5 pb-28 text-center text-zinc-500 text-sm">Loading…</div>;
  }

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={isGym ? "/groups?list=1" : "/friends"} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18}/>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 truncate">{group.name}</h1>
          <p className="text-xs text-zinc-500">
            {group.gym && `${group.gym} · `}{members.length} member{members.length !== 1 ? "s" : ""} · Code <span className="font-mono text-zinc-400">{group.invite_code}</span>
          </p>
        </div>
        {/* Members check in by scanning the gym QR */}
        {isGym && !canCoach && (
          <Link href="/scan"
            className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-2 rounded-xl text-sm transition-colors">
            <QrCode size={15}/> Check in
          </Link>
        )}
      </div>

      {/* Upgrade-to-Gym banner (free group, owner only) */}
      {isOwner && !isGym && (
        <button onClick={upgradeToGym} disabled={billingLoading}
          className="w-full bg-gradient-to-r from-amber-500/15 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all disabled:opacity-60">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Crown size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-100">Upgrade to a Gym</p>
            <p className="text-xs text-zinc-500">Add up to 3 coaches, schedule classes & see gym analytics</p>
          </div>
          {billingLoading ? <Loader2 size={16} className="text-amber-400 animate-spin" /> : <span className="text-xs font-bold text-amber-400 shrink-0">€29/mo</span>}
        </button>
      )}
      {billingError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{billingError}</p>}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 overflow-x-auto no-scrollbar">
        {([
          ...(isGym ? [["sessions","Plan",Calendar]] as const : []),
          ["chat","Chat",MessageCircle],["board","Board",Trophy],["members","Members",Users],
          ...(canCoach ? [["insights","Stats",BarChart2]] as const : []),
        ] as const).map(([k,label,Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
              tab === k ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon size={13}/> {label}
          </button>
        ))}
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab === "sessions" && isGym && (
        <div className="space-y-4">
          {canCoach && (
            <div className="flex gap-2">
              <button onClick={() => showForm ? (setShowForm(false), setEditingId(null)) : startCreate()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <Plus size={15}/> Schedule
              </button>
              <button onClick={() => setShowQR(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <QrCode size={16}/> Check-in QR
              </button>
            </div>
          )}

          {showForm && canCoach && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-100">{editingId ? "Edit session" : "New session"}</p>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                placeholder="Session title (e.g. Guard Passing)"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              <textarea value={form.focus} onChange={e=>setForm(f=>({...f,focus:e.target.value}))}
                placeholder="What will we work on? (focus / techniques)" rows={2}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />

              {/* Recurring toggle */}
              <button type="button" onClick={()=>setForm(f=>({...f,recurring:!f.recurring}))}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  form.recurring ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800/60 text-zinc-400"
                }`}>
                <Calendar size={14}/> {form.recurring ? "Recurring weekly" : "One-time session"}
              </button>

              {form.recurring ? (
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES_FULL.map((d, i) => (
                    <button key={i} type="button" onClick={()=>setForm(f=>({...f,day_of_week:i}))}
                      className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                        form.day_of_week===i ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/60 text-zinc-500"
                      }`}>{d.slice(0,2)}</button>
                  ))}
                </div>
              ) : (
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
              )}

              <div className="grid grid-cols-3 gap-2">
                <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                  className="bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
                <input type="number" value={form.duration} onChange={e=>setForm(f=>({...f,duration:Number(e.target.value)}))}
                  className="bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" placeholder="min" />
                <button type="button" onClick={()=>setForm(f=>({...f,gi:!f.gi}))}
                  className={`rounded-xl text-sm font-semibold ${form.gi ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400"}`}>
                  {form.gi ? "Gi" : "No-Gi"}
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={()=>{ setShowForm(false); setEditingId(null); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                <button onClick={saveSession} disabled={!form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-30">{editingId ? "Save" : "Schedule"}</button>
              </div>
            </div>
          )}

          {/* Occurrence list — recurring templates expanded into dated classes */}
          {(() => {
            const occs = buildOccurrences();
            if (occs.length === 0) {
              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                  <Calendar size={26} className="text-zinc-700 mx-auto mb-2"/>
                  <p className="text-sm text-zinc-500">No sessions scheduled yet</p>
                </div>
              );
            }
            return (
              <div className="flex flex-col gap-2">
                {occs.map(({ session: s, date, key }) => {
                  const mine = myRsvp(s.id, date);
                  const going = goingUsers(s.id, date);
                  return (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-100">{s.title}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${s.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>
                              {s.gi ? "Gi" : "No-Gi"}
                            </span>
                            {s.recurring && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-500">weekly</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Clock size={11}/>
                            {format(new Date(date+"T12:00:00"),"EEE, MMM d")}
                            {" · "}{s.time?.slice(0,5)} · {s.duration}min
                          </p>
                          {s.focus && (
                            <div className="mt-2 flex items-start gap-1.5 bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                              <Target size={12} className="text-red-400 mt-0.5 shrink-0"/>
                              <p className="text-xs text-zinc-300">{s.focus}</p>
                            </div>
                          )}
                          {/* Who's coming */}
                          <div className="mt-2.5">
                            {going.length === 0 ? (
                              <p className="text-[11px] text-zinc-600">No one confirmed yet</p>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-zinc-500">{going.length} coming:</span>
                                {going.map(uid => (
                                  <span key={uid} className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border border-black/20 ${beltAvatar(beltOf(uid))}`}>
                                      {nameOf(uid)[0].toUpperCase()}
                                    </span>
                                    {nameOf(uid)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Attendance (coach view): who came + no-shows for THIS date */}
                          {canCoach && (() => {
                            const came = attendedOn(s.id, date);
                            const sessionOver = (() => {
                              if (!s.time) return false;
                              const [h, m] = s.time.split(":").map(Number);
                              const end = new Date(date+"T00:00:00");
                              end.setHours(h, m + (s.duration ?? 60), 0, 0);
                              return new Date() >= end;
                            })();
                            const noShow = sessionOver ? going.filter(uid => !came.includes(uid)) : [];
                            if (came.length === 0 && noShow.length === 0) return null;
                            return (
                              <div className="mt-2 space-y-1.5">
                                {came.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                      <Check size={11}/> {came.length} came:
                                    </span>
                                    {came.map(uid => (
                                      <span key={uid} className="text-[11px] text-zinc-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">{nameOf(uid)}</span>
                                    ))}
                                  </div>
                                )}
                                {noShow.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                                      <X size={11}/> {noShow.length} said yes but didn't show:
                                    </span>
                                    {noShow.map(uid => (
                                      <span key={uid} className="text-[11px] text-zinc-400 bg-amber-500/10 px-2 py-0.5 rounded-md">{nameOf(uid)}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {canCoach && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={()=>startEdit(s)} className="text-zinc-700 hover:text-zinc-300 p-1">
                              <Pencil size={14}/>
                            </button>
                            <button onClick={()=>deleteSession(s.id)} className="text-zinc-700 hover:text-red-500 p-1">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* RSVP buttons (per date) */}
                      {!canCoach && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                          <button onClick={()=>toggleRsvp(s.id, date, true)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              mine?.status==="going" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-800 text-zinc-400"
                            }`}>
                            <Check size={13}/> I'll be there
                          </button>
                          <button onClick={()=>toggleRsvp(s.id, date, false)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              mine?.status==="not_going" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800 text-zinc-400"
                            }`}>
                            <X size={13}/> Can't make it
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="space-y-4">
          {/* Admin (free) / Coaches (gym) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{isGym ? "Coaches" : "Admin"}</p>
              {isGym && <span className="text-[11px] text-zinc-600">{coaches.length}/{maxCoaches} seats</span>}
            </div>
            <div className="flex flex-col gap-2">
              {coaches.map(m => {
                const owner = m.user_id === group.trainer_id;
                return (
                  <div key={m.user_id} className="bg-zinc-900 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                      {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">@{m.profiles?.username}</p>
                      <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt · {m.profiles?.stripes} stripes</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                      <Crown size={10}/> {!isGym ? "Admin" : owner ? "Owner" : "Coach"}
                    </span>
                    {/* Owner can remove a non-owner coach (gym only) */}
                    {isGym && isOwner && !owner && (
                      <button onClick={() => setRole(m.user_id, "student")}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-red-400 transition-colors shrink-0">
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {isGym && isOwner && !canAddCoach && (
              <p className="text-[11px] text-zinc-600 mt-2">All {maxCoaches} coach seats used. Remove a coach to add another.</p>
            )}
          </div>

          {/* Students */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Members <span className="text-zinc-600 ml-1">{students.length}</span>
            </p>
            <div className="flex flex-col gap-2">
              {students.map(m => {
                const note = coachNotes[m.user_id];
                const hasNote = !!note && (note.general.trim() || note.promotion.trim());
                const open = editingNote === m.user_id;
                return (
                <div key={m.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                      {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">@{m.profiles?.username}</p>
                      <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt · {m.profiles?.stripes} stripes</p>
                    </div>
                    {/* Coach: open notes (gym only) */}
                    {canCoach && (
                      <button onClick={() => { setEditingNote(open ? null : m.user_id); setNoteForm(note ?? { general: "", promotion: "" }); }}
                        className={`text-[10px] font-semibold transition-colors shrink-0 ${hasNote ? "text-amber-400 hover:text-amber-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                        {hasNote ? "📝 Note" : "+ Note"}
                      </button>
                    )}
                    {/* Owner can promote a student to coach (gym only, if seats left) */}
                    {isGym && isOwner && (
                      <button onClick={() => setRole(m.user_id, "coach")} disabled={!canAddCoach}
                        className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors shrink-0">
                        Make coach
                      </button>
                    )}
                    {isOwner && (
                      <button onClick={() => kickMember(m.user_id)}
                        className="text-zinc-700 hover:text-red-500 transition-colors p-1 shrink-0">
                        <X size={14}/>
                      </button>
                    )}
                  </div>

                  {/* Coach note editor */}
                  {canCoach && open && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Promotion readiness</p>
                        <textarea value={noteForm.promotion} onChange={e => setNoteForm(f => ({ ...f, promotion: e.target.value }))}
                          rows={2} placeholder="e.g. Ready for blue — guard solid, needs takedown defense"
                          className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">General note</p>
                        <textarea value={noteForm.general} onChange={e => setNoteForm(f => ({ ...f, general: e.target.value }))}
                          rows={2} placeholder="Attendance, attitude, injuries, focus…"
                          className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingNote(null)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold">Cancel</button>
                        <button onClick={() => saveCoachNote(m.user_id)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold">Save note</button>
                      </div>
                    </div>
                  )}

                  {/* Note preview (collapsed) */}
                  {canCoach && !open && hasNote && (
                    <div className="mt-2 space-y-1">
                      {note.promotion.trim() && <p className="text-xs text-amber-400/90">🥋 {note.promotion}</p>}
                      {note.general.trim() && <p className="text-xs text-zinc-500">{note.general}</p>}
                    </div>
                  )}
                </div>
                );
              })}
              {students.length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-500">
                  No members yet — share the invite code
                </div>
              )}
            </div>
          </div>

          {/* Delete group (owner only) */}
          {isOwner && (
            <button onClick={deleteGroup}
              className="w-full mt-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
              Delete Group
            </button>
          )}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <GroupChat groupId={id as string} userId={user?.id ?? ""} nameOf={nameOf} />
      )}

      {/* ── LEADERBOARD TAB ── */}
      {tab === "board" && (
        <GroupLeaderboard members={members} currentUserId={user?.id ?? ""}
          isGym={isGym} attendance={attendance} />
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === "insights" && canCoach && (
        <div className="space-y-4">
          <GymInsights attendance={attendance} members={members} sessions={sessions} coachNotes={coachNotes} />
          <GroupInsights groupId={id as string} isTrainer={canCoach} memberCount={members.length} />
        </div>
      )}

      {/* ── CHECK-IN QR MODAL ── */}
      {showQR && (
        <div onClick={() => setShowQR(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div onClick={e => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xs w-full flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-bold text-zinc-100">Check-in QR</p>
            <p className="text-xs text-zinc-500 -mt-2">Print this and hang it at the door. Members scan to check in.</p>
            <div className="bg-white rounded-xl p-4">
              {origin && <QRCodeSVG value={checkinUrl} size={200} />}
            </div>
            <p className="text-[10px] text-zinc-600 break-all">{checkinUrl}</p>
            <button onClick={() => setShowQR(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2.5 rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Gym Insights: the coach's command center (gym-only, check-in driven) ── */
function GymInsights({ attendance, members, sessions, coachNotes }: {
  attendance: { trainer_session_id: string; user_id: string; date: string }[];
  members: Member[];
  sessions: TrainerSession[];
  coachNotes: Record<string, CoachNote>;
}) {
  const now = new Date();
  const monthKey = format(now, "yyyy-MM");
  const nameOf = (m: Member) => m.profiles?.display_name || m.profiles?.username || "?";

  // ── KPIs (this month, from check-ins) ──
  const thisMonth   = attendance.filter(a => a.date.startsWith(monthKey));
  const checkinsMonth = thisMonth.length;
  const classesHeld = new Set(thisMonth.map(a => a.trainer_session_id + a.date)).size;
  const avgPerClass = classesHeld ? Math.round((checkinsMonth / classesHeld) * 10) / 10 : 0;
  const activeMembers = new Set(thisMonth.map(a => a.user_id)).size;

  // ── 6-month trend (attendance + new members) ──
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
  const trend = months.map(mo => ({
    ...mo,
    checkins: attendance.filter(a => a.date.startsWith(mo.key)).length,
    joined:   members.filter(m => (m.joined_at ?? "").startsWith(mo.key)).length,
  }));
  const trendMax  = Math.max(1, ...trend.map(t => t.checkins));
  const growthMax = Math.max(1, ...trend.map(t => t.joined));

  // ── Per-member stats ──
  const rows = members.map(m => {
    const dates = attendance.filter(a => a.user_id === m.user_id).map(a => a.date).sort();
    const last = dates.length ? dates[dates.length - 1] : null;
    const daysSince = last ? differenceInDays(now, parseISO(last)) : null;
    const last30 = dates.filter(d => differenceInDays(now, parseISO(d)) <= 30).length;
    return { m, last, daysSince, last30, total: dates.length, weekly: Math.round((last30 / 4.3) * 10) / 10 };
  });

  // Retention radar: previously-active members who slipped (most-active first)
  const atRisk = rows
    .filter(r => r.total > 0 && (r.daysSince === null || r.daysSince >= 14))
    .sort((a, b) => b.last30 - a.last30 || (b.daysSince ?? 0) - (a.daysSince ?? 0))
    .slice(0, 8);
  const topActive = rows.filter(r => r.last30 > 0).sort((a, b) => b.last30 - a.last30).slice(0, 10);

  // Class performance (last 30 days)
  const classRows = sessions.map(s => ({
    s,
    c: attendance.filter(a => a.trainer_session_id === s.id && differenceInDays(now, parseISO(a.date)) <= 30).length,
  })).sort((a, b) => b.c - a.c);
  const classMax = Math.max(1, ...classRows.map(c => c.c));

  // Promotion board: most consistent members + their belt + coach note
  const promo = rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <div className="space-y-4">
      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi value={checkinsMonth} label="Check-ins this month" accent />
        <Kpi value={activeMembers} label="Active members" />
        <Kpi value={avgPerClass} label="Avg per class" />
        <Kpi value={members.length} label="Total members" />
      </div>

      {/* ── Attendance trend ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Attendance · last 6 months</p>
        <div className="flex items-end gap-2 h-28">
          {trend.map(t => (
            <div key={t.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{t.checkins}</span>
              <div className="w-full bg-zinc-800 rounded-md overflow-hidden flex items-end" style={{ height: "100%" }}>
                <div className="w-full bg-red-500/70 rounded-md" style={{ height: `${(t.checkins / trendMax) * 100}%` }} />
              </div>
              <span className="text-[10px] text-zinc-600">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Retention radar ── */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">⚠ Retention radar</p>
          <p className="text-xs text-zinc-600">Members who were training but haven't shown in 2+ weeks — reach out before they quit</p>
        </div>
        {atRisk.length === 0 ? (
          <p className="text-xs text-zinc-500">Everyone active is still showing up 🔥</p>
        ) : (
          <div className="flex flex-col gap-2">
            {atRisk.map(({ m, daysSince, total }) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                  {nameOf(m)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{nameOf(m)}</p>
                  <p className="text-[10px] text-zinc-600">{total} total check-ins</p>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 shrink-0">
                  {daysSince === null ? "Never" : `${daysSince}d ago`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Most active ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Most active · last 30 days</p>
        {topActive.length === 0 ? (
          <p className="text-xs text-zinc-500">No check-ins yet. Hang up the QR and let members scan in.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topActive.map(({ m, last30, weekly }, i) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-zinc-600">#{i + 1}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                  {nameOf(m)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{nameOf(m)}</p>
                  <p className="text-[10px] text-zinc-600">~{weekly}×/week</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-zinc-100 shrink-0">{last30}</span>
                <span className="text-[10px] text-zinc-600 shrink-0">classes</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Class performance ── */}
      {classRows.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Class performance · last 30 days</p>
          <div className="space-y-2">
            {classRows.map(({ s, c }) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-28 truncate">{s.title}</span>
                <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${(c / classMax) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-zinc-300 w-6 text-right">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Member growth ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">New members · last 6 months</p>
        <div className="flex items-end gap-2 h-24">
          {trend.map(t => (
            <div key={t.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{t.joined}</span>
              <div className="w-full bg-zinc-800 rounded-md overflow-hidden flex items-end" style={{ height: "100%" }}>
                <div className="w-full bg-emerald-500/70 rounded-md" style={{ height: `${(t.joined / growthMax) * 100}%` }} />
              </div>
              <span className="text-[10px] text-zinc-600">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promotion board ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Promotion board · most consistent</p>
        {promo.length === 0 ? (
          <p className="text-xs text-zinc-500">No attendance data yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {promo.map(({ m, total, last30 }) => {
              const note = coachNotes[m.user_id]?.promotion?.trim();
              return (
                <div key={m.user_id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-black/20 shrink-0 ${beltAvatar(m.profiles?.belt)}`}>
                    {nameOf(m)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {nameOf(m)} <span className="text-[11px] text-zinc-500 capitalize">· {m.profiles?.belt} {m.profiles?.stripes ? `${m.profiles.stripes}★` : ""}</span>
                    </p>
                    {note ? <p className="text-[11px] text-amber-400/90">🥋 {note}</p>
                          : <p className="text-[10px] text-zinc-600">{total} check-ins · {last30} last 30d</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-red-950/20 border-red-500/30" : "bg-zinc-900 border-zinc-800"}`}>
      <p className={`text-2xl font-black tabular-nums ${accent ? "text-red-400" : "text-zinc-100"}`}>{value}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ── Group Leaderboard ── */
function GroupLeaderboard({ members, currentUserId, isGym, attendance }: {
  members: Member[]; currentUserId: string;
  isGym: boolean; attendance: { user_id: string; date: string }[];
}) {
  const sb = createClient();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const month = format(new Date(), "yyyy-MM");
  const memberIds = members.map(m => m.user_id);

  useEffect(() => {
    // Gym = count actual class check-ins this month; free group = count
    // members' self-logged sessions this month.
    if (isGym) {
      const c: Record<string, number> = {};
      attendance
        .filter(a => a.date >= `${month}-01`)
        .forEach(a => { c[a.user_id] = (c[a.user_id] ?? 0) + 1; });
      setCounts(c);
      setLoading(false);
      return;
    }
    if (memberIds.length === 0) { setLoading(false); return; }
    sb.from("sessions")
      .select("user_id")
      .in("user_id", memberIds)
      .gte("date", `${month}-01`)
      .then(({ data }) => {
        const c: Record<string, number> = {};
        (data ?? []).forEach((r: any) => { c[r.user_id] = (c[r.user_id] ?? 0) + 1; });
        setCounts(c);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIds.join(","), month, isGym, attendance.length]);

  const ranked = [...members]
    .sort((a, b) => (counts[b.user_id] ?? 0) - (counts[a.user_id] ?? 0));

  if (loading) {
    return <div className="py-10 text-center text-zinc-500 text-sm">Loading…</div>;
  }

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          {isGym ? "Classes Attended This Month" : "Sessions This Month"}
        </p>
        <p className="text-[11px] text-zinc-600">{monthLabel}</p>
      </div>
      {ranked.map((m, idx) => {
        const count = counts[m.user_id] ?? 0;
        const medal = idx === 0 && count > 0 ? "🥇" : idx === 1 && count > 0 ? "🥈" : idx === 2 && count > 0 ? "🥉" : null;
        const isMe  = m.user_id === currentUserId;
        return (
          <div key={m.user_id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
              isMe ? "bg-red-950/20 border-red-500/30" : "bg-zinc-900 border-zinc-800"
            }`}>
            <div className="w-6 text-center shrink-0">
              {medal ? <span className="text-base">{medal}</span>
                : <span className="text-xs font-bold text-zinc-600">#{idx + 1}</span>}
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
              {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {m.profiles?.display_name || m.profiles?.username}
                {isMe && <span className="text-xs text-red-400 font-normal ml-1">(you)</span>}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-black tabular-nums text-zinc-100">{count}</p>
              <p className="text-[10px] text-zinc-600">{isGym ? (count === 1 ? "class" : "classes") : (count === 1 ? "session" : "sessions")}</p>
            </div>
          </div>
        );
      })}
      {ranked.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-sm text-zinc-500">
          No data yet for this month
        </div>
      )}
    </div>
  );
}

/* ── Group Chat with realtime ── */
function GroupChat({ groupId, userId, nameOf }: { groupId: string; userId: string; nameOf: (uid: string) => string }) {
  const sb = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Resolve a display name: prefer fetched cache, fall back to member list
  const resolveName = (uid: string) => names[uid] || nameOf(uid);

  // Fetch + cache names for any user_ids we don't know yet
  const ensureNames = async (ids: string[]) => {
    const missing = [...new Set(ids)].filter(id => !names[id]);
    if (missing.length === 0) return;
    const { data } = await sb.from("profiles")
      .select("id,username,display_name").in("id", missing);
    if (data) {
      setNames(prev => {
        const next = { ...prev };
        data.forEach((p: any) => { next[p.id] = p.display_name || p.username; });
        return next;
      });
    }
  };

  useEffect(() => {
    let active = true;
    sb.from("group_messages").select("*").eq("group_id", groupId)
      .order("created_at", { ascending: true }).limit(200)
      .then(({ data }) => {
        if (!active) return;
        const msgs = (data as ChatMessage[]) ?? [];
        setMessages(msgs);
        ensureNames(msgs.map(m => m.user_id));
      });

    const channel = sb.channel(`chat:${groupId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(m => m.some(x => x.id === msg.id) ? m : [...m, msg]);
          ensureNames([msg.user_id]);
        })
      .subscribe();

    return () => { active = false; sb.removeChannel(channel); };
  }, [groupId]);

  // Auto-scroll to newest
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    await sb.from("group_messages").insert({ group_id: groupId, user_id: userId, content });
    setSending(false);
  };

  const avatarColor = (uid: string) => {
    const colors = ["bg-red-500/20 text-red-300","bg-blue-500/20 text-blue-300","bg-emerald-500/20 text-emerald-300","bg-violet-500/20 text-violet-300","bg-amber-500/20 text-amber-300"];
    let h = 0; for (const c of uid) h = (h + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageCircle size={28} className="text-zinc-700"/>
            <p className="text-sm text-zinc-500">No messages yet — say hi 👋</p>
          </div>
        ) : messages.map(m => {
          const mine = m.user_id === userId;
          const name = mine ? "You" : resolveName(m.user_id);
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                mine ? "bg-red-500/20 text-red-300" : avatarColor(m.user_id)
              }`}>
                {name[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[72%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="text-[10px] font-medium text-zinc-400 mb-0.5 px-1">
                  {name}
                  <span className="text-zinc-600 font-normal ml-1.5">{format(new Date(m.created_at), "HH:mm")}</span>
                </span>
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  mine ? "bg-red-600 text-white rounded-br-md" : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 pt-2 border-t border-zinc-800">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Message…"
          className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"/>
        <button onClick={send} disabled={!text.trim() || sending}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 rounded-xl transition-colors">
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}

/* ── Trainer insights: aggregate positions & submissions from members ── */
interface InsightRow { kind: string; name: string; count: number }

function GroupInsights({ groupId, memberCount, isTrainer }: { groupId: string; isTrainer: boolean; memberCount: number }) {
  const sb = createClient();
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isTrainer) { setLoading(false); return; }
    sb.rpc("group_insights", { gid: groupId }).then(({ data }) => {
      setRows((data as InsightRow[]) ?? []);
      setLoading(false);
    });
  }, [groupId, isTrainer]);

  if (!isTrainer) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-sm text-zinc-500">Only coaches can view aggregated group analytics.</p>
      </div>
    );
  }

  const byKind = (k: string) =>
    rows.filter(r => r.kind === k).sort((a, b) => b.count - a.count).slice(0, 6);

  const positions    = byKind("position");
  const subsGiven     = byKind("sub_given");
  const subsReceived  = byKind("sub_received");
  const maxOf = (arr: InsightRow[]) => Math.max(1, ...arr.map(r => r.count));

  const Bars = ({ data, color }: { data: InsightRow[]; color: string }) => {
    const max = maxOf(data);
    return (
      <div className="space-y-2">
        {data.map(r => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-28 text-right truncate">{r.name}</span>
            <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(r.count/max)*100}%`, background: color }} />
            </div>
            <span className="text-xs font-semibold text-zinc-300 w-6 text-right">{r.count}</span>
          </div>
        ))}
      </div>
    );
  };

  const hasData = positions.length || subsGiven.length || subsReceived.length;

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-2xl font-bold text-zinc-100">{memberCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Members</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-2xl font-bold text-zinc-100">{positions.reduce((a,r)=>a+r.count,0)}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Positions logged</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-sm text-zinc-500">Loading insights…</div>
      ) : !hasData ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-400">No shared data yet</p>
          <p className="text-xs text-zinc-600 mt-1">Members must enable "Share with groups" in their privacy settings.</p>
        </div>
      ) : (
        <>
          {positions.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Most Trained Positions</p>
              <Bars data={positions} color="#ef4444" />
            </div>
          )}
          {subsGiven.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-widest">Strongest Submissions</p>
              <Bars data={subsGiven} color="#22c55e" />
            </div>
          )}
          {subsReceived.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-widest">Weakest Areas (most tapped by)</p>
              <Bars data={subsReceived} color="#f87171" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
