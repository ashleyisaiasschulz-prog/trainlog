"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Clock, Calendar, Zap, Lock, Plus, X, Check, StickyNote, Pencil, HeartPulse } from "lucide-react";
import Link from "next/link";
import BeltBadge from "@/components/BeltBadge";
import { usePartnerStore } from "@/store/usePartnerStore";
import { format, startOfWeek } from "date-fns";
import { useTagStore } from "@/store/useTagStore";
import type { Belt } from "@/lib/types";

interface Profile {
  id: string; username: string; display_name: string | null;
  gym: string | null; belt: string; stripes: number;
  share_stats: boolean; share_belt: boolean; is_trainer: boolean;
}

interface SparringRecord {
  id: string;
  logger_id: string;
  opponent_id: string;
  date: string;
  result: "win" | "loss" | "draw";
  finish_type: string;
  submission: string;
  notes: string;
}

const FINISH_OPTIONS = ["submission", "points", "advantages", "other"] as const;

export default function FriendStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const sb = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [records, setRecords] = useState<SparringRecord[]>([]);
  const [activeInjuries, setActiveInjuries] = useState<{ body_part: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Log match form state
  const { partners, add: addPartner, update: updatePartner } = usePartnerStore();
  const { submissions: SUBMISSIONS } = useTagStore();
  const partnerNote = partners.find((p) => p.name === profile?.username || p.name === profile?.display_name);
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState(false);

  const saveNote = () => {
    if (!profile) return;
    const name = profile.display_name || profile.username;
    if (partnerNote) {
      updatePartner({ ...partnerNote, notes: noteText });
    } else {
      addPartner({ id: Math.random().toString(36).slice(2), name, belt: profile.belt, gym: profile.gym ?? "", notes: noteText, watchFor: "", tags: [], date: format(new Date(), "yyyy-MM-dd") });
    }
    setEditingNote(false);
  };

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formResult, setFormResult] = useState<"win" | "loss" | "draw">("win");
  const [formFinish, setFormFinish] = useState("submission");
  const [formSub, setFormSub] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const { data: p } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile(p);

    if (p?.share_stats) {
      const { data: s } = await sb
        .from("training_sessions").select("*").eq("user_id", id)
        .order("date", { ascending: false });
      setSessions(s ?? []);

      const { data: inj } = await sb
        .from("injuries").select("body_part").eq("user_id", id).is("end_date", null);
      setActiveInjuries(inj ?? []);
    }

    if (user) {
      const { data: r } = await sb
        .from("sparring_records").select("*")
        .or(`and(logger_id.eq.${user.id},opponent_id.eq.${id}),and(logger_id.eq.${id},opponent_id.eq.${user.id})`)
        .order("date", { ascending: false });
      setRecords((r ?? []) as SparringRecord[]);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id, user]);

  const logMatch = async () => {
    if (!user) return;
    setSaving(true);
    await sb.from("sparring_records").insert({
      logger_id: user.id,
      opponent_id: id,
      date: formDate,
      result: formResult,
      finish_type: formFinish,
      submission: formFinish === "submission" ? formSub : "",
      notes: formNotes,
    });
    setShowForm(false);
    setFormResult("win");
    setFormFinish("submission");
    setFormSub("");
    setFormNotes("");
    setSaving(false);
    await loadData();
  };

  const deleteRecord = async (recordId: string) => {
    await sb.from("sparring_records").delete().eq("id", recordId);
    setRecords(r => r.filter(x => x.id !== recordId));
  };

  if (loading) return <div className="px-4 pt-5 text-center text-zinc-500 text-sm">Loading…</div>;
  if (!profile) return <div className="px-4 pt-5 text-center text-zinc-500 text-sm">Profile not found.</div>;

  // Head-to-head score from my perspective
  const myWins = records.filter(r =>
    (r.logger_id === user?.id && r.result === "win") ||
    (r.logger_id === id && r.result === "loss")
  ).length;
  const myLosses = records.filter(r =>
    (r.logger_id === user?.id && r.result === "loss") ||
    (r.logger_id === id && r.result === "win")
  ).length;
  const draws = records.filter(r => r.result === "draw").length;

  // Stats
  const totalHours = Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeek = sessions.filter(s => new Date(s.date + "T12:00:00") >= weekStart).length;

  const topItems = (key: string) => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => (s[key] ?? []).forEach((x: string) => (counts[x] = (counts[x] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const positions = topItems("positions");
  const subsGiven = topItems("submissions_given");
  const subsRecvd = topItems("submissions_received");
  const maxVal = (arr: [string, number][]) => Math.max(1, ...arr.map(x => x[1]));

  const Bars = ({ data, color }: { data: [string, number][]; color: string }) => (
    <div className="space-y-2">
      {data.map(([name, n]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 w-28 text-right truncate">{name}</span>
          <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(n / maxVal(data)) * 100}%`, background: color }} />
          </div>
          <span className="text-xs font-semibold text-zinc-300 w-5 text-right">{n}</span>
        </div>
      ))}
    </div>
  );

  const resultLabel = (r: SparringRecord) => {
    const isMe = r.logger_id === user?.id;
    const myResult = isMe ? r.result : r.result === "win" ? "loss" : r.result === "loss" ? "win" : "draw";
    return myResult;
  };

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/friends" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">@{profile.username}</h1>
        {activeInjuries.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0">
            <HeartPulse size={12} /> Currently injured
          </span>
        )}
      </div>

      {/* ── My Notes on this person ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StickyNote size={13} className="text-zinc-500" />
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">My Notes</p>
          </div>
          {!editingNote && (
            <button onClick={() => { setNoteText(partnerNote?.notes ?? ""); setEditingNote(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors">
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editingNote ? (
          <div className="space-y-2">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Notes on their game, tendencies, things to watch for…"
              rows={3} autoFocus
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setEditingNote(false)}
                className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold py-2 rounded-xl text-xs">
                <X size={12} /> Cancel
              </button>
              <button onClick={saveNote}
                className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded-xl text-xs">
                <Check size={12} /> Save
              </button>
            </div>
          </div>
        ) : partnerNote?.notes ? (
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{partnerNote.notes}</p>
        ) : (
          <button onClick={() => { setNoteText(""); setEditingNote(true); }}
            className="w-full text-left text-xs text-zinc-600 hover:text-zinc-400 py-1 transition-colors">
            + Add notes about their game…
          </button>
        )}
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

      {/* ── Head-to-Head ── */}
      {user && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Head-to-Head</p>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <Plus size={13} /> Log Match
            </button>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400 tabular-nums">{myWins}</p>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-zinc-400 tabular-nums">{draws}</p>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Draws</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-red-400 tabular-nums">{myLosses}</p>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Losses</p>
            </div>
          </div>

          {/* Log match form */}
          {showForm && (
            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400">Log a match vs @{profile.username}</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Result</label>
                  <div className="flex gap-1">
                    {(["win","loss","draw"] as const).map(r => (
                      <button key={r} type="button" onClick={() => setFormResult(r)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                          formResult === r
                            ? r === "win" ? "bg-emerald-600 text-white" : r === "loss" ? "bg-red-700 text-white" : "bg-zinc-600 text-white"
                            : "bg-zinc-800 text-zinc-500"
                        }`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">How</label>
                <div className="flex gap-1 flex-wrap">
                  {FINISH_OPTIONS.map(f => (
                    <button key={f} type="button" onClick={() => setFormFinish(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        formFinish === f ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {formFinish === "submission" && (
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Submission</label>
                  <div className="flex flex-wrap gap-1">
                    {SUBMISSIONS.map(s => (
                      <button key={s} type="button" onClick={() => setFormSub(formSub === s ? "" : s)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          formSub === s ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Notes (optional)</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  placeholder="How did it go?"
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  <X size={14}/> Cancel
                </button>
                <button onClick={logMatch} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  <Check size={14}/> {saving ? "Saving…" : "Save Match"}
                </button>
              </div>
            </div>
          )}

          {/* Match history */}
          {records.length > 0 && (
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Match History</p>
              {records.map(r => {
                const res = resultLabel(r);
                const isMyLog = r.logger_id === user?.id;
                return (
                  <div key={r.id} className="flex items-center gap-2 py-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      res === "win" ? "bg-emerald-900/50 text-emerald-400"
                      : res === "loss" ? "bg-red-900/50 text-red-400"
                      : "bg-zinc-700 text-zinc-400"
                    }`}>
                      {res.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400 flex-1">
                      {format(new Date(r.date + "T12:00:00"), "MMM d, yyyy")}
                      {r.finish_type === "submission" && r.submission && ` · ${r.submission}`}
                      {r.finish_type !== "submission" && ` · ${r.finish_type}`}
                    </span>
                    {r.notes && <span className="text-[10px] text-zinc-600 truncate max-w-[80px]">{r.notes}</span>}
                    {isMyLog && (
                      <button onClick={() => deleteRecord(r.id)} className="text-zinc-700 hover:text-red-500 transition-colors shrink-0">
                        <X size={12}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {records.length === 0 && !showForm && (
            <p className="text-xs text-zinc-600 text-center py-1">No matches logged yet — tap "Log Match" to start tracking</p>
          )}
        </div>
      )}

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
