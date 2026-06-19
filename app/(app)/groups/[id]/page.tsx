"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { useTagStore } from "@/store/useTagStore";
import { ArrowLeft, Plus, Calendar, Users, Clock, Check, X, Trash2, Target, BarChart2, MessageCircle, Send, Crown, Trophy, Loader2, Pencil, Settings as SettingsIcon, MapPin, Megaphone, StickyNote, Flame, Award, Hourglass } from "lucide-react";
import Link from "next/link";
import { DAY_NAMES_FULL, BELT_COLORS, BELT_ORDER, BELT_LABELS, Belt } from "@/lib/types";
import { format, differenceInDays, parseISO, startOfWeek, subWeeks } from "date-fns";
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
  address?: string | null; country?: string | null; lat?: number | null; lng?: number | null;
}
interface OpenMat {
  id: string; title: string; date: string; time: string | null; gi: boolean; notes: string | null;
}
interface MiniProfile { username: string; display_name: string | null; belt: string; stripes: number }
interface Member { user_id: string; role: string; joined_at?: string | null; profiles: MiniProfile }
interface TrainerSession {
  id: string; title: string; description: string | null; focus: string | null;
  date: string | null; time: string | null; duration: number | null;
  gi: boolean; recurring: boolean; day_of_week: number | null; active: boolean;
  positions: string[] | null; capacity: number | null;
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
  const [tab, setTab]           = useState<"sessions" | "members" | "chat" | "insights" | "board" | "settings">("board");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [occOverrides, setOccOverrides] = useState<Record<string, { focus: string | null; positions: string[]; cancelled?: boolean }>>({});
  const [expandedOcc, setExpandedOcc] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [openMats, setOpenMats] = useState<OpenMat[]>([]);
  const [omCounts, setOmCounts] = useState<Record<string, number>>({});
  const [announcements, setAnnouncements] = useState<{ id: string; text: string; created_at: string; author_id: string }[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [joinReqs, setJoinReqs] = useState<{ user_id: string; profiles: MiniProfile }[]>([]);
  const [noteEntries, setNoteEntries] = useState<Record<string, { id: string; text: string; created_at: string }[]>>({});
  const [newNoteText, setNewNoteText] = useState("");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editEntryText, setEditEntryText] = useState("");
  const [promoteBelt, setPromoteBelt] = useState<string>("white");
  const [promoteStripes, setPromoteStripes] = useState<number>(0);
  const [addressInput, setAddressInput] = useState("");
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressErr, setAddressErr] = useState("");
  const [addressResolved, setAddressResolved] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; lat: number; lng: number; country: string | null }>>([]);
  const [showOmForm, setShowOmForm] = useState(false);
  const [omForm, setOmForm] = useState({ title: "Open Mat", date: format(new Date(), "yyyy-MM-dd"), time: "11:00", gi: false, notes: "" });
  const [form, setForm] = useState({
    title: "", description: "", focus: "", date: format(new Date(), "yyyy-MM-dd"),
    time: "19:00", duration: 90, gi: true, recurring: false, day_of_week: 2,
    positions: [] as string[], capacity: 0,
  });
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const positionTags = useTagStore((s) => s.positions);

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
    // Per-date plan overrides (positions + notes for a specific occurrence)
    const { data: socc } = await sb.from("session_occurrences")
      .select("trainer_session_id, date, focus, positions, cancelled").eq("group_id", id);
    const om: Record<string, { focus: string | null; positions: string[]; cancelled?: boolean }> = {};
    (socc ?? []).forEach((o: any) => { om[`${o.trainer_session_id}-${o.date}`] = { focus: o.focus, positions: o.positions ?? [], cancelled: o.cancelled ?? false }; });
    setOccOverrides(om);
    // This gym's upcoming open mats
    const { data: oms } = await sb.from("open_mats")
      .select("id,title,date,time,gi,notes").eq("group_id", id)
      .gte("date", format(new Date(), "yyyy-MM-dd")).order("date", { ascending: true });
    setOpenMats((oms as OpenMat[]) ?? []);
    const omIds = (oms ?? []).map((o: any) => o.id);
    if (omIds.length) {
      const { data: omr } = await sb.from("open_mat_rsvps").select("open_mat_id").in("open_mat_id", omIds);
      const c: Record<string, number> = {};
      (omr ?? []).forEach((r: any) => { c[r.open_mat_id] = (c[r.open_mat_id] ?? 0) + 1; });
      setOmCounts(c);
    } else setOmCounts({});
    // Pending join requests (RLS returns rows only to coaches/owner)
    const { data: jr } = await sb.from("join_requests")
      .select("user_id, profiles(username,display_name,belt,stripes)").eq("group_id", id);
    setJoinReqs((jr as unknown as { user_id: string; profiles: MiniProfile }[]) ?? []);
    // Dated coach note entries (RLS: coaches only)
    const { data: ne } = await sb.from("coach_note_entries")
      .select("id, student_id, text, created_at").eq("group_id", id)
      .order("created_at", { ascending: false });
    const nm: Record<string, { id: string; text: string; created_at: string }[]> = {};
    (ne ?? []).forEach((n: any) => { (nm[n.student_id] ||= []).push({ id: n.id, text: n.text, created_at: n.created_at }); });
    setNoteEntries(nm);
    // Announcements (broadcast)
    const { data: anns } = await sb.from("gym_announcements")
      .select("id, text, created_at, author_id").eq("group_id", id)
      .order("created_at", { ascending: false }).limit(5);
    setAnnouncements((anns as any) ?? []);
  };

  const postAnnouncement = async () => {
    if (!user || !newAnnouncement.trim()) return;
    await sb.from("gym_announcements").insert({ group_id: id, author_id: user.id, text: newAnnouncement.trim() });
    setNewAnnouncement("");
    await load();
  };
  const deleteAnnouncement = async (aid: string) => {
    await sb.from("gym_announcements").delete().eq("id", aid);
    await load();
  };

  const addNoteEntry = async (studentId: string) => {
    if (!user || !newNoteText.trim()) return;
    await sb.from("coach_note_entries").insert({
      group_id: id, student_id: studentId, author_id: user.id, text: newNoteText.trim(),
    });
    setNewNoteText("");
    await load();
  };
  const deleteNoteEntry = async (entryId: string) => {
    await sb.from("coach_note_entries").delete().eq("id", entryId);
    await load();
  };
  const updateNoteEntry = async (entryId: string) => {
    if (!editEntryText.trim()) return;
    await sb.from("coach_note_entries").update({ text: editEntryText.trim() }).eq("id", entryId);
    setEditingEntry(null);
    await load();
  };

  const promoteMember = async (uid: string) => {
    await sb.rpc("promote_member", { p_group: id, p_user: uid, p_belt: promoteBelt, p_stripes: promoteStripes });
    await load();
  };

  const approveJoin = async (uid: string) => {
    await sb.rpc("approve_join", { p_group: id, p_user: uid });
    await load();
  };
  const denyJoin = async (uid: string) => {
    await sb.rpc("deny_join", { p_group: id, p_user: uid });
    await load();
  };

  useEffect(() => { load(); }, [user, id]);

  // Default to the Plan tab in a gym (Board for social groups). Runs once.
  const tabInitRef = useRef(false);
  useEffect(() => {
    if (!group || tabInitRef.current) return;
    tabInitRef.current = true;
    if (group.is_gym) setTab("sessions");
  }, [group]);

  useEffect(() => { if (group) setAddressInput(group.address ?? ""); }, [group?.address]);

  // Address autocomplete (debounced Nominatim suggestions)
  useEffect(() => {
    const q = addressInput.trim();
    if (!isOwner || q.length < 3 || q === addressResolved || q === (group?.address ?? "")) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?suggest=1&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressInput]);

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
  const isCancelled = (sid: string, date: string) => !!occOverrides[`${sid}-${date}`]?.cancelled;
  const buildOccurrences = (): Occurrence[] => {
    const out: Occurrence[] = [];
    for (const s of sessions) {
      if (s.recurring && s.day_of_week != null) {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        const diff = (s.day_of_week - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        for (let i = 0; i < WEEKS_AHEAD; i++) {
          const dateStr = format(d, "yyyy-MM-dd");
          if (!isCancelled(s.id, dateStr)) out.push({ session: s, date: dateStr, key: `${s.id}-${dateStr}` });
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

  // Positions and notes are class fields. Per-day changes split into a one-off.
  const effPositions = (s: TrainerSession) => s.positions ?? [];
  const effFocus = (s: TrainerSession) => s.focus ?? null;

  const saveAddress = async () => {
    if (!addressInput.trim()) return;
    setAddressBusy(true); setAddressErr(""); setAddressResolved("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addressInput.trim())}`);
      const geo = await res.json();
      if (!res.ok) {
        setAddressErr(res.status === 404 ? "That address doesn't exist — check it and try again." : (geo.error ?? "Couldn't verify that address"));
        setAddressBusy(false); return;
      }
      const { error } = await sb.from("groups").update({
        address: geo.displayName ?? addressInput.trim(), country: geo.country, lat: geo.lat, lng: geo.lng,
      }).eq("id", id);
      if (error) { setAddressErr(error.message); setAddressBusy(false); return; }
      setAddressResolved(geo.displayName ?? "");
      await load();
    } catch { setAddressErr("Network error"); }
    setAddressBusy(false);
  };

  const selectSuggestion = async (geo: { displayName: string; lat: number; lng: number; country: string | null }) => {
    setAddressErr("");
    const { error } = await sb.from("groups").update({
      address: geo.displayName, country: geo.country, lat: geo.lat, lng: geo.lng,
    }).eq("id", id);
    if (error) { setAddressErr(error.message); return; }
    setAddressInput(geo.displayName);
    setAddressResolved(geo.displayName);
    setSuggestions([]);
    await load();
  };

  const createOpenMat = async () => {
    if (!user || !group?.lat || !omForm.title.trim()) return;
    await sb.from("open_mats").insert({
      group_id: id, gym_name: group.name, title: omForm.title, date: omForm.date,
      time: omForm.time, gi: omForm.gi, notes: omForm.notes || null,
      address: group.address, country: group.country, lat: group.lat, lng: group.lng,
    });
    setShowOmForm(false);
    setOmForm(f => ({ ...f, notes: "" }));
    await load();
  };

  const deleteOpenMat = async (mid: string) => {
    await sb.from("open_mats").delete().eq("id", mid);
    await load();
  };

  const resetForm = () =>
    setForm({
      title: "", description: "", focus: "", date: format(new Date(), "yyyy-MM-dd"),
      time: "19:00", duration: 90, gi: true, recurring: false, day_of_week: 2,
      positions: [], capacity: 0,
    });

  const startCreate = () => { setEditingId(null); setEditingDate(null); setFormError(""); resetForm(); setShowForm(true); };

  const startEdit = (s: TrainerSession, date: string) => {
    setEditingId(s.id);
    setEditingDate(date);
    setFormError("");
    setForm({
      title: s.title, description: s.description ?? "", focus: s.focus ?? "",
      date: s.date ?? format(new Date(), "yyyy-MM-dd"),
      time: (s.time ?? "19:00").slice(0, 5), duration: s.duration ?? 90, gi: s.gi,
      recurring: s.recurring, day_of_week: s.day_of_week ?? 2,
      positions: s.positions ?? [], capacity: s.capacity ?? 0,
    });
    setShowForm(true);
  };

  const togglePosition = (p: string) =>
    setForm(f => ({ ...f, positions: f.positions.includes(p) ? f.positions.filter(x => x !== p) : [...f.positions, p] }));

  // scope: "day" = split this occurrence into a one-off; "all" = edit the series.
  const saveSession = async (scope?: "day" | "all") => {
    if (!user || !form.title.trim()) return;
    setFormError("");
    const fields = {
      title: form.title, description: form.description, focus: form.focus,
      time: form.time, duration: form.duration, gi: form.gi,
      positions: form.positions, capacity: form.capacity || null,
    };
    let error = null;
    if (editingId && form.recurring && scope === "day" && editingDate) {
      // Split: cancel this occurrence of the series + create a one-off for it.
      await sb.from("session_occurrences").upsert(
        { group_id: id, trainer_session_id: editingId, date: editingDate, cancelled: true },
        { onConflict: "trainer_session_id,date" });
      ({ error } = await sb.from("trainer_sessions").insert({
        ...fields, group_id: id, trainer_id: user.id, date: editingDate, recurring: false, day_of_week: null }));
    } else if (editingId) {
      ({ error } = await sb.from("trainer_sessions").update({
        ...fields, date: form.recurring ? null : form.date,
        recurring: form.recurring, day_of_week: form.recurring ? form.day_of_week : null,
      }).eq("id", editingId));
    } else {
      ({ error } = await sb.from("trainer_sessions").insert({
        ...fields, group_id: id, trainer_id: user.id,
        date: form.recurring ? null : form.date,
        recurring: form.recurring, day_of_week: form.recurring ? form.day_of_week : null,
      }));
    }
    if (error) { setFormError(error.message); return; }
    setShowForm(false);
    setEditingId(null);
    setEditingDate(null);
    resetForm();
    await load();
  };

  const deleteSession = async (sid: string) => {
    await sb.from("trainer_sessions").update({ active: false }).eq("id", sid);
    setConfirmDelete(null);
    await load();
  };
  // Cancel just one occurrence of a recurring class (mark that date cancelled).
  const cancelOccurrence = async (sid: string, date: string) => {
    await sb.from("session_occurrences").upsert(
      { group_id: id, trainer_session_id: sid, date, cancelled: true },
      { onConflict: "trainer_session_id,date" }
    );
    setConfirmDelete(null);
    await load();
  };

  const myRsvp = (sid: string, date: string) =>
    rsvps.find(r => r.trainer_session_id === sid && r.occurrence_date === date && r.user_id === user?.id);

  const goingCountFor = (sid: string, date: string, excludeUser?: string) =>
    rsvps.filter(r => r.trainer_session_id === sid && r.occurrence_date === date && r.status === "going" && r.user_id !== excludeUser).length;

  const toggleRsvp = async (sid: string, date: string, going: boolean) => {
    if (!user) return;
    const existing = myRsvp(sid, date);
    const session = sessions.find(s => s.id === sid);
    const cap = session?.capacity ?? 0;

    if (going) {
      // Full → join the waitlist instead of "going".
      const status = cap > 0 && goingCountFor(sid, date, user.id) >= cap ? "waitlist" : "going";
      if (existing) await sb.from("session_rsvps").update({ status }).eq("id", existing.id);
      else await sb.from("session_rsvps").insert({ trainer_session_id: sid, user_id: user.id, status, occurrence_date: date });
    } else {
      if (existing) await sb.from("session_rsvps").update({ status: "not_going" }).eq("id", existing.id);
      // A spot freed up → promote the earliest person on the waitlist.
      if (cap > 0 && goingCountFor(sid, date, user.id) < cap) {
        const { data: wl } = await sb.from("session_rsvps")
          .select("id").eq("trainer_session_id", sid).eq("occurrence_date", date).eq("status", "waitlist")
          .order("created_at", { ascending: true }).limit(1);
        if (wl && wl.length) await sb.from("session_rsvps").update({ status: "going" }).eq("id", wl[0].id);
      }
    }
    await load();
  };

  const waitlistUsers = (sid: string, date: string) =>
    rsvps.filter(r => r.trainer_session_id === sid && r.occurrence_date === date && r.status === "waitlist").map(r => r.user_id);

  if (!group) {
    return <div className="px-4 pt-5 pb-28 text-center text-zinc-500 text-sm">Loading…</div>;
  }

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={isGym ? "/groups?list=1" : "/friends"} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
          <ArrowLeft size={18}/>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-lg shrink-0">
          {group.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100 truncate leading-tight">{group.name}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-zinc-500">{members.length} member{members.length !== 1 ? "s" : ""}</span>
            <span className="text-zinc-700 text-xs">·</span>
            <span className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{group.invite_code}</span>
          </div>
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

      {/* Announcements (broadcast) */}
      {(announcements.length > 0 || canCoach) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 space-y-2">
          {canCoach && (
            <div className="flex gap-2">
              <input value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                onKeyDown={e => e.key === "Enter" && postAnnouncement()}
                placeholder="Announce to members…"
                className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              <button onClick={postAnnouncement} disabled={!newAnnouncement.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 rounded-lg text-xs font-bold disabled:opacity-30">Post</button>
            </div>
          )}
          {announcements.slice(0, 3).map(an => (
            <div key={an.id} className="flex items-start gap-2">
              <Megaphone size={12} className="text-amber-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 leading-snug">{an.text}</p>
                <p className="text-[10px] text-zinc-600">{nameOf(an.author_id)} · {format(new Date(an.created_at), "MMM d, HH:mm")}</p>
              </div>
              {canCoach && (
                <button onClick={() => deleteAnnouncement(an.id)} className="text-zinc-700 hover:text-red-500 p-0.5 shrink-0"><X size={12}/></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
        {([
          ...(isGym ? [["sessions","Plan",Calendar]] as const : []),
          ["chat","Chat",MessageCircle],["board","Board",Trophy],["members","Members",Users],
          ...(canCoach ? [["insights","Stats",BarChart2]] as const : []),
          ...(canCoach ? [["settings","Settings",SettingsIcon]] as const : []),
        ] as const).map(([k,label,Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-colors ${
              tab === k ? "bg-red-500/10 text-red-400" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon size={16} strokeWidth={tab === k ? 2.4 : 1.9}/> {label}
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
              {/* Positions drilled for this class */}
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Positions</p>
                <div className="flex flex-wrap gap-1.5">
                  {positionTags.map(p => {
                    const on = form.positions.includes(p);
                    return (
                      <button key={p} type="button" onClick={()=>togglePosition(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          on ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800/60 text-zinc-400"
                        }`}>{p}</button>
                    );
                  })}
                </div>
              </div>

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

              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Class limit</p>
                <input type="number" min={0} value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:Number(e.target.value)}))}
                  placeholder="Max spots — leave 0 for unlimited"
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Notes</p>
                <textarea value={form.focus} onChange={e=>setForm(f=>({...f,focus:e.target.value}))}
                  placeholder="What's the focus? (e.g. Single Leg X, guard retention)" rows={2}
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
              </div>

              {formError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>}

              {/* Editing a recurring class → choose scope */}
              {editingId && form.recurring && editingDate ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-500">Apply changes to:</p>
                  <div className="flex gap-2">
                    <button onClick={()=>{ setShowForm(false); setEditingId(null); setEditingDate(null); setFormError(""); }}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                    <button onClick={()=>saveSession("day")} disabled={!form.title.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-sm font-semibold disabled:opacity-30">Just {format(new Date(editingDate+"T12:00:00"),"MMM d")}</button>
                    <button onClick={()=>saveSession("all")} disabled={!form.title.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-30">All weekly</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={()=>{ setShowForm(false); setEditingId(null); setEditingDate(null); setFormError(""); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                  <button onClick={()=>saveSession()} disabled={!form.title.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-30">{editingId ? "Save" : "Schedule"}</button>
                </div>
              )}
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
                  const cap = s.capacity ?? 0;
                  const waitlist = waitlistUsers(s.id, date);
                  const isFull = cap > 0 && going.length >= cap;
                  const dToday = date === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div key={key} className={`bg-zinc-900 border rounded-2xl p-4 ${dToday ? "border-red-500/30" : "border-zinc-800"}`}>
                      <div className="flex items-start gap-3">
                        {/* Date badge */}
                        <div className={`w-12 shrink-0 text-center rounded-xl py-1.5 ${dToday ? "bg-red-500/10" : "bg-zinc-800/50"}`}>
                          <p className={`text-[9px] font-bold uppercase tracking-wide leading-none ${dToday ? "text-red-400" : "text-zinc-500"}`}>{format(new Date(date+"T12:00:00"),"EEE")}</p>
                          <p className={`text-xl font-black leading-tight tabular-nums ${dToday ? "text-red-400" : "text-zinc-100"}`}>{format(new Date(date+"T12:00:00"),"d")}</p>
                          <p className="text-[9px] text-zinc-600 leading-none">{format(new Date(date+"T12:00:00"),"MMM")}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {s.time?.slice(0,5)} · {s.duration}min
                          </p>
                          {/* Planned positions for THIS date — tap to see notes */}
                          {(() => {
                            const pos = effPositions(s);
                            const notes = effFocus(s);
                            const expanded = expandedOcc === key;
                            if (pos.length === 0 && !notes) return null;
                            return (
                              <div className="mt-2">
                                <button onClick={()=>setExpandedOcc(expanded ? null : key)}
                                  className="flex items-center gap-1.5 flex-wrap text-left">
                                  <Target size={12} className="text-red-400 shrink-0"/>
                                  {pos.length > 0 ? pos.map(p => (
                                    <span key={p} className="text-[11px] text-red-300 bg-red-500/10 px-2 py-0.5 rounded-md">{p}</span>
                                  )) : <span className="text-[11px] text-zinc-500">Notes</span>}
                                  {notes && <span className="text-[10px] text-zinc-600">{expanded ? "▲" : "▼"}</span>}
                                </button>
                                {expanded && notes && (
                                  <p className="mt-1.5 text-xs text-zinc-300 bg-zinc-800/50 rounded-lg px-2.5 py-1.5">{notes}</p>
                                )}
                              </div>
                            );
                          })()}
                          {/* Who's coming */}
                          <div className="mt-2.5">
                            {going.length === 0 ? (
                              <p className="text-[11px] text-zinc-600">No one confirmed yet{cap > 0 ? ` · 0/${cap} spots` : ""}</p>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-zinc-500">{going.length}{cap > 0 ? `/${cap}` : ""} coming:</span>
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
                            {waitlist.length > 0 && (
                              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1"><Hourglass size={11}/> {waitlist.length} waitlisted{canCoach ? `: ${waitlist.map(nameOf).join(", ")}` : ""}</p>
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
                            <button onClick={()=>startEdit(s, date)} title="Edit" className="text-zinc-700 hover:text-zinc-300 p-1">
                              <Pencil size={14}/>
                            </button>
                            <button onClick={()=> s.recurring ? setConfirmDelete(key) : deleteSession(s.id)} title="Delete" className="text-zinc-700 hover:text-red-500 p-1">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete choice for a recurring class */}
                      {canCoach && confirmDelete === key && (
                        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                          <p className="text-[11px] text-zinc-500">Delete which?</p>
                          <div className="flex gap-2">
                            <button onClick={()=>cancelOccurrence(s.id, date)}
                              className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold">Just {format(new Date(date+"T12:00:00"),"MMM d")}</button>
                            <button onClick={()=>deleteSession(s.id)}
                              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold">All weekly</button>
                          </div>
                          <button onClick={()=>setConfirmDelete(null)} className="w-full text-[11px] text-zinc-500 hover:text-zinc-300">Cancel</button>
                        </div>
                      )}

                      {/* RSVP buttons (per date) */}
                      {!canCoach && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                          <button onClick={()=>toggleRsvp(s.id, date, true)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              mine?.status==="going" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                              : mine?.status==="waitlist" ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                              : "bg-zinc-800 text-zinc-400"
                            }`}>
                            {mine?.status==="waitlist"
                              ? <><Hourglass size={13}/> Waitlisted</>
                              : <><Check size={13}/> {isFull && mine?.status!=="going" ? "Join waitlist" : "I'll be there"}</>}
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

          {/* ── OPEN MATS (coach) — post & manage ── */}
          {canCoach && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Open Mats · public</p>
                <Link href="/openmats" className="text-[11px] text-zinc-500 hover:text-zinc-300">Browse all →</Link>
              </div>
              <p className="text-xs text-zinc-600 -mt-1">Post a public open mat so anyone can find it by country or distance.</p>

              {group.lat == null ? (
                <p className="text-[11px] text-zinc-600">Set your gym address in Settings first to post an open mat.</p>
              ) : !showOmForm ? (
                <button onClick={()=>setShowOmForm(true)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Plus size={15}/> Post open mat
                </button>
              ) : (
                <div className="space-y-2 bg-zinc-800/40 rounded-xl p-3">
                  <input value={omForm.title} onChange={e=>setOmForm(f=>({...f,title:e.target.value}))}
                    placeholder="Title (e.g. Sunday Open Mat)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="date" value={omForm.date} onChange={e=>setOmForm(f=>({...f,date:e.target.value}))}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
                    <input type="time" value={omForm.time} onChange={e=>setOmForm(f=>({...f,time:e.target.value}))}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
                    <button type="button" onClick={()=>setOmForm(f=>({...f,gi:!f.gi}))}
                      className={`rounded-lg text-sm font-semibold ${omForm.gi ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400"}`}>
                      {omForm.gi ? "Gi" : "No-Gi"}
                    </button>
                  </div>
                  <textarea value={omForm.notes} onChange={e=>setOmForm(f=>({...f,notes:e.target.value}))}
                    placeholder="Notes (optional) — drop-in fee, who's welcome…" rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={()=>setShowOmForm(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-semibold">Cancel</button>
                    <button onClick={createOpenMat} disabled={!omForm.title.trim()}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-30">Post</button>
                  </div>
                </div>
              )}

              {openMats.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {openMats.map(om => (
                    <div key={om.id} className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{om.title} <span className="text-[10px] text-zinc-500">{om.gi ? "Gi" : "No-Gi"}</span></p>
                        <p className="text-[11px] text-zinc-500">{format(new Date(om.date+"T12:00:00"),"EEE, MMM d")}{om.time && ` · ${om.time.slice(0,5)}`} · {omCounts[om.id] ?? 0} going</p>
                      </div>
                      <button onClick={()=>deleteOpenMat(om.id)} className="text-zinc-700 hover:text-red-500 p-1 shrink-0"><Trash2 size={13}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB (coach/owner) ── */}
      {tab === "settings" && canCoach && (
        <div className="space-y-4">
          {/* Gym address — owner only, must geocode to a real place */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Gym address</p>
              <p className="text-xs text-zinc-600">Used to place your gym on the public Open Mat directory.</p>
            </div>
            {isOwner ? (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input value={addressInput} onChange={e=>{ setAddressInput(e.target.value); setAddressResolved(""); }}
                      placeholder="Start typing your address…"
                      className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                    {suggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                        {suggestions.map((sug, i) => (
                          <button key={i} onClick={()=>selectSuggestion(sug)}
                            className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 flex items-start gap-1.5">
                            <MapPin size={12} className="text-zinc-600 mt-0.5 shrink-0" />
                            <span>{sug.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={saveAddress} disabled={addressBusy || !addressInput.trim()}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5">
                    {addressBusy ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>
                </div>
                {addressErr && <p className="text-xs text-red-400">{addressErr}</p>}
                {(addressResolved || group.lat != null) && (
                  <p className="text-[11px] text-emerald-400 flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    {addressResolved || `${group.address ?? "Location set"}${group.country ? ` · ${group.country}` : ""}`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">{group.address ?? "No address set yet."}</p>
            )}
          </div>
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="space-y-4">
          {/* Pending join requests (coach approves) */}
          {canCoach && joinReqs.length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">
                Join requests <span className="ml-1">{joinReqs.length}</span>
              </p>
              {joinReqs.map(r => (
                <div key={r.user_id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(r.profiles?.belt)}`}>
                    {(r.profiles?.display_name || r.profiles?.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">@{r.profiles?.username}</p>
                    <p className="text-xs text-zinc-500 capitalize">{r.profiles?.belt} belt</p>
                  </div>
                  <button onClick={() => approveJoin(r.user_id)}
                    className="w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg flex items-center justify-center transition-colors">
                    <Check size={15}/>
                  </button>
                  <button onClick={() => denyJoin(r.user_id)}
                    className="w-8 h-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                    <X size={15}/>
                  </button>
                </div>
              ))}
            </div>
          )}

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
                const entries = noteEntries[m.user_id] ?? [];
                const open = editingNote === m.user_id;
                return (
                <div key={m.user_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  {/* Row — tap to open actions */}
                  <button onClick={() => {
                      const next = open ? null : m.user_id;
                      setEditingNote(next);
                      setNewNoteText("");
                      if (next) {
                        setNoteForm(note ?? { general: "", promotion: "" });
                        setPromoteBelt(m.profiles?.belt ?? "white");
                        setPromoteStripes(m.profiles?.stripes ?? 0);
                      }
                    }}
                    className="w-full flex items-center gap-3 text-left">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
                      {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">@{m.profiles?.username}</p>
                      <p className="text-xs text-zinc-500 capitalize">{m.profiles?.belt} belt · {m.profiles?.stripes} stripes</p>
                    </div>
                    {canCoach && entries.length > 0 && (
                      <span className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1"><StickyNote size={11}/> {entries.length}</span>
                    )}
                    <span className={`text-[10px] text-zinc-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
                  </button>

                  {/* Expanded actions (coach) */}
                  {canCoach && open && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                      {/* Owner actions */}
                      {isOwner && (
                        <div className="flex gap-2">
                          {isGym && (
                            <button onClick={() => setRole(m.user_id, "coach")} disabled={!canAddCoach}
                              className="flex-1 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold disabled:opacity-30">
                              Make coach
                            </button>
                          )}
                          <button onClick={() => kickMember(m.user_id)}
                            className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold">
                            Remove from gym
                          </button>
                        </div>
                      )}

                      {/* Promote (belt + stripes) */}
                      {isOwner && (
                        <div>
                          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Promote</p>
                          <div className="flex gap-2">
                            <select value={promoteBelt} onChange={e => setPromoteBelt(e.target.value)}
                              className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600">
                              {BELT_ORDER.map(b => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                            </select>
                            <select value={promoteStripes} onChange={e => setPromoteStripes(Number(e.target.value))}
                              className="bg-zinc-800/60 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600">
                              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}★</option>)}
                            </select>
                            <button onClick={() => promoteMember(m.user_id)}
                              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 rounded-lg text-xs font-bold">Apply</button>
                          </div>
                        </div>
                      )}

                      {/* Promotion readiness */}
                      <div>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Promotion readiness</p>
                        <textarea value={noteForm.promotion} onChange={e => setNoteForm(f => ({ ...f, promotion: e.target.value }))}
                          rows={2} placeholder="e.g. Ready for blue — guard solid, needs takedown defense"
                          className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
                        <button onClick={() => saveCoachNote(m.user_id)}
                          className="mt-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200">Save readiness</button>
                      </div>

                      {/* Dated notes log */}
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Notes</p>
                        <div className="flex gap-2">
                          <input value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addNoteEntry(m.user_id)}
                            placeholder="Add a note…"
                            className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                          <button onClick={() => addNoteEntry(m.user_id)} disabled={!newNoteText.trim()}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 rounded-xl text-xs font-semibold disabled:opacity-30">Add</button>
                        </div>
                        {entries.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {entries.map(en => (
                              <div key={en.id} className="bg-zinc-800/40 rounded-xl px-3 py-2">
                                {editingEntry === en.id ? (
                                  <div className="space-y-1.5">
                                    <textarea value={editEntryText} onChange={e => setEditEntryText(e.target.value)} rows={2}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none" />
                                    <div className="flex gap-2 justify-end">
                                      <button onClick={() => setEditingEntry(null)} className="text-[11px] text-zinc-500 hover:text-zinc-300">Cancel</button>
                                      <button onClick={() => updateNoteEntry(en.id)} className="text-[11px] font-semibold text-red-400 hover:text-red-300">Save</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-zinc-200 leading-snug">{en.text}</p>
                                      <p className="text-[10px] text-zinc-600 mt-0.5">{format(new Date(en.created_at), "MMM d, yyyy · HH:mm")}</p>
                                    </div>
                                    <button onClick={() => { setEditingEntry(en.id); setEditEntryText(en.text); }} className="text-zinc-600 hover:text-zinc-300 p-0.5 shrink-0"><Pencil size={11}/></button>
                                    <button onClick={() => deleteNoteEntry(en.id)} className="text-zinc-600 hover:text-red-500 p-0.5 shrink-0"><X size={12}/></button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
        <div className="space-y-4">
          {isGym && <MyAttendanceCard attendance={attendance} userId={user?.id ?? ""} />}
          <GroupLeaderboard members={members} currentUserId={user?.id ?? ""}
            isGym={isGym} attendance={attendance} />
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === "insights" && canCoach && (
        <div className="space-y-4">
          <GymInsights attendance={attendance} members={members} sessions={sessions} coachNotes={coachNotes} />
          <GroupInsights groupId={id as string} isTrainer={canCoach} />
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

  // ── Curriculum (coach-tagged positions, last 8 weeks, weighted by occurrences) ──
  const todayStr = format(now, "yyyy-MM-dd");
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 55);
  const startStr = format(start, "yyyy-MM-dd");
  // Only count classes that already happened (start time passed).
  const happened = (s: TrainerSession, ds: string) => {
    const dt = new Date(ds + "T00:00:00");
    if (s.time) { const [h, m] = s.time.split(":").map(Number); dt.setHours(h, m, 0, 0); }
    return dt <= now;
  };
  const currMap: Record<string, { count: number; last: string }> = {};
  for (const s of sessions) {
    const dates: string[] = [];
    if (s.recurring && s.day_of_week != null) {
      const d = new Date(start);
      while (d <= now) {
        if (d.getDay() === s.day_of_week) dates.push(format(d, "yyyy-MM-dd"));
        d.setDate(d.getDate() + 1);
      }
    } else if (s.date && s.date >= startStr && s.date <= todayStr) {
      dates.push(s.date);
    }
    for (const ds of dates) {
      if (!happened(s, ds)) continue;
      // Positions are class-level (set at creation)
      const ps = s.positions ?? [];
      for (const p of ps) {
        if (!currMap[p]) currMap[p] = { count: 0, last: ds };
        currMap[p].count++;
        if (ds > currMap[p].last) currMap[p].last = ds;
      }
    }
  }
  const curriculum = Object.entries(currMap)
    .map(([pos, v]) => ({ pos, count: v.count, daysAgo: differenceInDays(now, parseISO(v.last)) }))
    .sort((a, b) => b.count - a.count);
  const currMax = Math.max(1, ...curriculum.map(c => c.count));

  // Promotion board: most consistent members + their belt + coach note
  const promo = rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] pl-1">Overview</p>
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

      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] pt-1 pl-1">Retention</p>

      {/* ── Retention radar ── */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">⚠ Retention radar</p>
          <p className="text-xs text-zinc-600">Members who were training but haven't shown in 2+ weeks — reach out before they quit</p>
        </div>
        {atRisk.length === 0 ? (
          <p className="text-xs text-zinc-500">Everyone active is still showing up.</p>
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

      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] pt-1 pl-1">Classes &amp; curriculum</p>

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

      {/* ── Curriculum (what we've drilled) ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Curriculum · last 8 weeks</p>
          <p className="text-xs text-zinc-600">What you've drilled most — tag positions when scheduling a class</p>
        </div>
        {curriculum.length === 0 ? (
          <p className="text-xs text-zinc-500">No positions tagged yet. Add them when creating or editing a class.</p>
        ) : (
          <div className="space-y-2">
            {curriculum.map(({ pos, count, daysAgo }) => (
              <div key={pos} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-28 truncate">{pos}</span>
                <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500/70" style={{ width: `${(count / currMax) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-zinc-300 w-5 text-right">{count}</span>
                <span className={`text-[10px] w-16 text-right shrink-0 ${daysAgo >= 21 ? "text-amber-400" : "text-zinc-600"}`}>
                  {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] pt-1 pl-1">Members</p>

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
                      {nameOf(m)} <span className="text-[11px] text-zinc-500 capitalize">· {m.profiles?.belt}{m.profiles?.stripes ? ` ${m.profiles.stripes}` : ""}</span>
                    </p>
                    {note ? <p className="text-[11px] text-amber-400/90 flex items-start gap-1"><Award size={11} className="mt-0.5 shrink-0"/> {note}</p>
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

/* ── My attendance: streak + badges ── */
function MyAttendanceCard({ attendance, userId }: {
  attendance: { user_id: string; date: string }[]; userId: string;
}) {
  const dates = attendance.filter(a => a.user_id === userId).map(a => a.date);
  const total = dates.length;
  const weekKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weeks = new Set(dates.map(d => weekKey(new Date(d + "T12:00:00"))));
  let streak = 0;
  let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
  while (weeks.has(format(cursor, "yyyy-MM-dd"))) { streak++; cursor = subWeeks(cursor, 1); }

  const BADGES = [
    { n: 10,  color: "text-amber-700" },
    { n: 25,  color: "text-zinc-300" },
    { n: 50,  color: "text-amber-400" },
    { n: 100, color: "text-cyan-300" },
    { n: 250, color: "text-violet-300" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Your attendance</p>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <p className="text-2xl font-black text-amber-400 tabular-nums flex items-center justify-center gap-1.5"><Flame size={20}/> {streak}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">week streak</p>
        </div>
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <p className="text-2xl font-black text-zinc-100 tabular-nums">{total}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">total check-ins</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {BADGES.map(b => {
          const earned = total >= b.n;
          return (
            <div key={b.n} title={`${b.n} classes`}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${earned ? "bg-zinc-800" : "bg-zinc-800/40"}`}>
              <Award size={13} className={earned ? b.color : "text-zinc-700"} />
              <span className={`text-[10px] font-semibold ${earned ? "text-zinc-300" : "text-zinc-700"}`}>{b.n}</span>
            </div>
          );
        })}
      </div>
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
  const maxCount = Math.max(1, ...ranked.map(m => counts[m.user_id] ?? 0));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          {isGym ? "Classes Attended" : "Sessions"}
        </p>
        <p className="text-[11px] text-zinc-600">{monthLabel}</p>
      </div>
      {ranked.map((m, idx) => {
        const count = counts[m.user_id] ?? 0;
        const medalColor = count > 0 && idx < 3 ? ["text-amber-400", "text-zinc-300", "text-amber-700"][idx] : null;
        const isMe  = m.user_id === currentUserId;
        return (
          <div key={m.user_id}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 border ${
              isMe ? "bg-red-950/20 border-red-500/30" : "bg-zinc-900 border-zinc-800"
            }`}>
            <div className="w-5 flex items-center justify-center shrink-0">
              {medalColor ? <Award size={16} className={medalColor} />
                : <span className="text-xs font-bold text-zinc-600">{idx + 1}</span>}
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-black/20 ${beltAvatar(m.profiles?.belt)}`}>
              {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {m.profiles?.display_name || m.profiles?.username}
                {isMe && <span className="text-xs text-red-400 font-normal ml-1">(you)</span>}
              </p>
              <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isMe ? "bg-red-500" : medalColor ? "bg-amber-500/70" : "bg-zinc-600"}`}
                  style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
            </div>
            <div className="shrink-0 text-right w-10">
              <p className="text-lg font-black tabular-nums text-zinc-100 leading-none">{count}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">{isGym ? "classes" : "sessions"}</p>
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
            <p className="text-sm text-zinc-500">No messages yet — say hi</p>
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

function GroupInsights({ groupId, isTrainer }: { groupId: string; isTrainer: boolean }) {
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

  const subsGiven       = byKind("sub_given");
  const subsReceived    = byKind("sub_received");
  const sweepsGiven     = byKind("sweep_given");
  const sweepsReceived  = byKind("sweep_received");
  const escapesGiven    = byKind("escape_given");
  const escapesReceived = byKind("escape_received");
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

  const hasData = subsGiven.length || subsReceived.length || sweepsGiven.length ||
    sweepsReceived.length || escapesGiven.length || escapesReceived.length;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-sm text-zinc-500">Loading insights…</div>
      ) : !hasData ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-400">No shared data yet</p>
          <p className="text-xs text-zinc-600 mt-1">Members must enable "Share with groups" in their privacy settings.</p>
        </div>
      ) : (
        <>
          {subsGiven.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-widest">Strongest Submissions</p>
              <Bars data={subsGiven} color="#22c55e" />
            </div>
          )}
          {subsReceived.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-widest">Weakest Submissions (most tapped by)</p>
              <Bars data={subsReceived} color="#f87171" />
            </div>
          )}
          {sweepsGiven.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Best Sweeps (landed)</p>
              <Bars data={sweepsGiven} color="#3b82f6" />
            </div>
          )}
          {sweepsReceived.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Swept By (most)</p>
              <Bars data={sweepsReceived} color="#f59e0b" />
            </div>
          )}
          {escapesGiven.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-widest">Best Escapes</p>
              <Bars data={escapesGiven} color="#8b5cf6" />
            </div>
          )}
          {escapesReceived.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Couldn't Escape (most)</p>
              <Bars data={escapesReceived} color="#a1a1aa" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
