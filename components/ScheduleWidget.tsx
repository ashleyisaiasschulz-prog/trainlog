"use client";

import { useEffect, useState } from "react";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { Schedule, CheckIn } from "@/lib/types";
import { randomId } from "@/lib/id";
import Link from "next/link";
import { format, addDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { Check, X, Plus } from "lucide-react";

const DISPLAY_COUNT = 5;
const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

interface GymItem { sessionId: string; name: string; date: string; time: string; duration: number | null; gi: boolean }

// Fetch from a wide window, slice after filtering missed
function getUpcoming(schedules: Schedule[], days = 21) {
  const result: { schedule: Schedule; date: string }[] = [];
  const today = startOfDay(new Date());

  for (const s of schedules) {
    if (!s.active) continue;

    if (s.type === "once" && s.date) {
      const diff = differenceInCalendarDays(new Date(s.date + "T12:00:00"), today);
      if (diff >= 0 && diff < days) result.push({ schedule: s, date: s.date });
    } else if (s.type !== "once") {
      for (let d = 0; d < days; d++) {
        const day = addDays(today, d);
        if (s.dayOfWeek === day.getDay())
          result.push({ schedule: s, date: format(day, "yyyy-MM-dd") });
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

const isToday    = (date: string) => date === format(new Date(), "yyyy-MM-dd");
const isTomorrow = (date: string) => date === format(addDays(new Date(), 1), "yyyy-MM-dd");
const isPast     = (date: string) => new Date(date + "T23:59:59") < new Date();

function dayLabel(date: string) {
  if (isToday(date))    return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(new Date(date + "T12:00:00"), "EEE");
}

export default function ScheduleWidget() {
  const { schedules, checkIns, upsertCheckIn } = useTrainingStore();
  const { user } = useAuthStore();
  const all = getUpcoming(schedules);

  // Gym classes the user RSVP'd "going" to (per occurrence date).
  const [gymItems, setGymItems] = useState<GymItem[]>([]);
  useEffect(() => {
    if (!user) { setGymItems([]); return; }
    (async () => {
      const sb = createClient();
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: rsvps } = await sb.from("session_rsvps")
        .select("trainer_session_id, occurrence_date")
        .eq("user_id", user.id).eq("status", "going").gte("occurrence_date", today);
      if (!rsvps?.length) { setGymItems([]); return; }
      const ids = [...new Set(rsvps.map((r: any) => r.trainer_session_id))];
      const { data: ts } = await sb.from("trainer_sessions").select("id,title,time,duration,gi").in("id", ids);
      const tmap: Record<string, any> = {};
      (ts ?? []).forEach((t: any) => { tmap[t.id] = t; });
      setGymItems(rsvps.map((r: any) => {
        const t = tmap[r.trainer_session_id];
        return t ? { sessionId: t.id, name: t.title, date: r.occurrence_date, time: hhmm(t.time), duration: t.duration, gi: t.gi } : null;
      }).filter(Boolean) as GymItem[]);
    })();
  }, [user]);

  const getCheckIn = (scheduleId: string, date: string): CheckIn | undefined =>
    checkIns.find((c) => c.scheduleId === scheduleId && c.date === date);

  const markMissed = (scheduleId: string, date: string) =>
    upsertCheckIn({ id: randomId(), scheduleId, date, attended: false });

  // Merge personal schedules + RSVP'd gym classes. A gym class is hidden if a
  // personal session already exists on the same day at the same time.
  type Item = { kind: "personal"; key: string; date: string; time: string; name: string; duration: number | null; gi: boolean; schedule: Schedule; once: boolean }
            | { kind: "gym"; key: string; date: string; time: string; name: string; duration: number | null; gi: boolean };

  const personal: Item[] = all
    .filter(({ schedule, date }) => !getCheckIn(schedule.id, date))
    .map(({ schedule, date }) => ({
      kind: "personal", key: `p-${schedule.id}-${date}`, date, time: hhmm(schedule.time),
      name: schedule.name, duration: schedule.duration, gi: schedule.gi, schedule, once: schedule.type === "once",
    }));

  const personalSlots = new Set(personal.map(p => `${p.date}|${p.time}`));
  const gym: Item[] = gymItems
    .filter(g => !personalSlots.has(`${g.date}|${g.time}`))
    .map(g => ({ kind: "gym", key: `g-${g.sessionId}-${g.date}`, date: g.date, time: g.time, name: g.name, duration: g.duration, gi: g.gi }));

  const visible = [...personal, ...gym]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, DISPLAY_COUNT);

  if (visible.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Upcoming</span>
          <Link href="/schedule" className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-400 transition-colors">
            <Plus size={11} strokeWidth={2.5} /> Add
          </Link>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-zinc-600">No upcoming sessions</p>
          <Link href="/schedule" className="text-xs text-red-500 hover:text-red-400 mt-1 inline-block transition-colors">
            Schedule one →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Upcoming</span>
        <div className="flex items-center gap-3">
          <Link href="/schedule" className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-400 transition-colors">
            <Plus size={11} strokeWidth={2.5} /> Add
          </Link>
          <Link href="/schedule" className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-400 transition-colors">
            Manage →
          </Link>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {visible.map((item) => {
          const { date, time, name, duration, gi } = item;
          const past  = isPast(date);
          const today = isToday(date);
          const checkIn  = item.kind === "personal" ? getCheckIn(item.schedule.id, date) : undefined;
          const attended = checkIn?.attended;

          return (
            <div key={item.key} className="flex items-center gap-3 px-4 py-3">
              {/* Day badge */}
              <div className={`w-16 text-center shrink-0 ${today ? "text-red-400" : past ? "text-zinc-600" : "text-zinc-400"}`}>
                <p className="text-[8px] font-semibold uppercase tracking-wide leading-none">{dayLabel(date)}</p>
                <p className="text-base font-bold leading-snug tabular-nums">
                  {format(new Date(date + "T12:00:00"), "d")}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate text-zinc-100">{name}</p>
                  {item.kind === "gym" && (
                    <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded shrink-0">GYM</span>
                  )}
                  {item.kind === "personal" && item.once && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">ONCE</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-zinc-600">{time}</span>
                  <span className="text-zinc-700 text-xs">·</span>
                  <span className="text-[11px] text-zinc-600">{duration}m</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    gi ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                  }`}>
                    {gi ? "Gi" : "No-Gi"}
                  </span>
                </div>
              </div>

              {/* CTA */}
              {attended ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 shrink-0">
                  <Check size={12} strokeWidth={2.5} /> Logged
                </span>
              ) : item.kind === "gym" ? (
                <Link href={`/add?date=${date}`}
                  className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors shrink-0">
                  {past ? "I went" : "Log"}
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/add?scheduleId=${item.schedule.id}&date=${date}`}
                    className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
                    {past ? "I went" : "Log"}
                  </Link>
                  <button onClick={() => markMissed(item.schedule.id, date)}
                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
