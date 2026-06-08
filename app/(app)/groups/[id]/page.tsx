"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Plus, Calendar, Users, Clock, Check, X, Trash2, Target, BarChart2, MessageCircle, Send, Crown } from "lucide-react";
import Link from "next/link";
import { DAY_NAMES_FULL, BELT_COLORS, Belt } from "@/lib/types";
import { format } from "date-fns";

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
}
interface MiniProfile { username: string; display_name: string | null; belt: string; stripes: number }
interface Member { user_id: string; role: string; profiles: MiniProfile }
interface TrainerSession {
  id: string; title: string; description: string | null; focus: string | null;
  date: string | null; time: string | null; duration: number | null;
  gi: boolean; recurring: boolean; day_of_week: number | null; active: boolean;
}
interface Rsvp { id: string; trainer_session_id: string; user_id: string; status: string }
interface ChatMessage {
  id: string; user_id: string; content: string; created_at: string;
  profiles?: { username: string; display_name: string | null };
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const sb = createClient();

  const [group, setGroup]       = useState<Group | null>(null);
  const [members, setMembers]   = useState<Member[]>([]);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [rsvps, setRsvps]       = useState<Rsvp[]>([]);
  const [tab, setTab]           = useState<"sessions" | "members" | "chat" | "insights">("sessions");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", focus: "", date: format(new Date(), "yyyy-MM-dd"),
    time: "19:00", duration: 90, gi: true, recurring: false, day_of_week: 2,
  });

  const isTrainer = group?.trainer_id === user?.id;

  const load = async () => {
    if (!user) return;
    const { data: g } = await sb.from("groups").select("*").eq("id", id).single();
    setGroup(g);
    const { data: m } = await sb.from("group_members")
      .select("user_id, role, profiles(username,display_name,belt,stripes)")
      .eq("group_id", id);
    setMembers((m as unknown as Member[]) ?? []);
    const { data: s } = await sb.from("trainer_sessions")
      .select("*").eq("group_id", id).eq("active", true).order("date", { ascending: true });
    setSessions((s as TrainerSession[]) ?? []);
    const { data: r } = await sb.from("session_rsvps").select("id,trainer_session_id,user_id,status");
    setRsvps((r as Rsvp[]) ?? []);
  };

  useEffect(() => { load(); }, [user, id]);

  // Resolve a user_id → display name using the loaded member list
  const nameOf = (uid: string) => {
    const m = members.find(x => x.user_id === uid);
    return m?.profiles?.display_name || m?.profiles?.username || "Someone";
  };
  const beltOf = (uid: string) =>
    members.find(x => x.user_id === uid)?.profiles?.belt ?? "white";
  const goingUsers = (sid: string) =>
    rsvps.filter(r => r.trainer_session_id === sid && r.status === "going").map(r => r.user_id);

  const createSession = async () => {
    if (!user || !form.title.trim()) return;
    await sb.from("trainer_sessions").insert({
      group_id: id, trainer_id: user.id,
      title: form.title, description: form.description, focus: form.focus,
      date: form.recurring ? null : form.date,
      time: form.time, duration: form.duration, gi: form.gi,
      recurring: form.recurring, day_of_week: form.recurring ? form.day_of_week : null,
    });
    setShowForm(false);
    setForm({ ...form, title: "", description: "", focus: "" });
    await load();
  };

  const deleteSession = async (sid: string) => {
    await sb.from("trainer_sessions").update({ active: false }).eq("id", sid);
    await load();
  };

  const myRsvp = (sid: string) => rsvps.find(r => r.trainer_session_id === sid && r.user_id === user?.id);

  const toggleRsvp = async (sid: string, going: boolean) => {
    if (!user) return;
    const existing = myRsvp(sid);
    if (existing) {
      await sb.from("session_rsvps").update({ status: going ? "going" : "not_going" }).eq("id", existing.id);
    } else {
      await sb.from("session_rsvps").insert({
        trainer_session_id: sid, user_id: user.id, status: going ? "going" : "not_going",
      });
    }
    await load();
  };

  const goingCount = (sid: string) => rsvps.filter(r => r.trainer_session_id === sid && r.status === "going").length;

  if (!group) {
    return <div className="px-4 pt-5 pb-24 text-center text-zinc-500 text-sm">Loading…</div>;
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/groups" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18}/>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 truncate">{group.name}</h1>
          <p className="text-xs text-zinc-500">
            {group.gym && `${group.gym} · `}{members.length} member{members.length !== 1 ? "s" : ""} · Code <span className="font-mono text-zinc-400">{group.invite_code}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {([["sessions","Plan",Calendar],["chat","Chat",MessageCircle],["members","Members",Users],["insights","Stats",BarChart2]] as const).map(([k,label,Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
              tab === k ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon size={13}/> {label}
          </button>
        ))}
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {isTrainer && (
            <button onClick={() => setShowForm(v => !v)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus size={15}/> Schedule a Session
            </button>
          )}

          {showForm && isTrainer && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
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
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                <button onClick={createSession} disabled={!form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-30">Schedule</button>
              </div>
            </div>
          )}

          {/* Session list */}
          {sessions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Calendar size={26} className="text-zinc-700 mx-auto mb-2"/>
              <p className="text-sm text-zinc-500">No sessions scheduled yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map(s => {
                const mine = myRsvp(s.id);
                return (
                  <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-100">{s.title}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${s.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>
                            {s.gi ? "Gi" : "No-Gi"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11}/>
                          {s.recurring ? `Every ${DAY_NAMES_FULL[s.day_of_week ?? 0]}` : (s.date && format(new Date(s.date+"T12:00:00"),"EEE, MMM d"))}
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
                          {goingUsers(s.id).length === 0 ? (
                            <p className="text-[11px] text-zinc-600">No one confirmed yet</p>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-zinc-500">{goingUsers(s.id).length} coming:</span>
                              {goingUsers(s.id).map(uid => (
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
                      </div>
                      {isTrainer && (
                        <button onClick={()=>deleteSession(s.id)} className="text-zinc-700 hover:text-red-500 p-1">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>

                    {/* RSVP buttons */}
                    {!isTrainer && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                        <button onClick={()=>toggleRsvp(s.id, true)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            mine?.status==="going" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-800 text-zinc-400"
                          }`}>
                          <Check size={13}/> I'll be there
                        </button>
                        <button onClick={()=>toggleRsvp(s.id, false)}
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
          )}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="space-y-4">
          {/* Admin / coach */}
          {members.filter(m => m.role === "trainer").map(m => (
            <div key={m.user_id}>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Group Admin</p>
              <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                  {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">@{m.profiles?.username}</p>
                  <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt · {m.profiles?.stripes} stripes</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                  <Crown size={10}/> Coach
                </span>
              </div>
            </div>
          ))}

          {/* Students */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Members <span className="text-zinc-600 ml-1">{members.filter(m => m.role !== "trainer").length}</span>
            </p>
            <div className="flex flex-col gap-2">
              {members.filter(m => m.role !== "trainer").map(m => (
                <div key={m.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                    {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">@{m.profiles?.username}</p>
                    <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt · {m.profiles?.stripes} stripes</p>
                  </div>
                </div>
              ))}
              {members.filter(m => m.role !== "trainer").length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-500">
                  No students yet — share the invite code
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <GroupChat groupId={id as string} userId={user?.id ?? ""} nameOf={nameOf} />
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === "insights" && (
        <GroupInsights groupId={id as string} isTrainer={isTrainer} memberCount={members.length} />
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
        <p className="text-sm text-zinc-500">Only trainers can view aggregated group analytics.</p>
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
