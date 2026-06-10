"use client";

import { useTrainingStore } from "@/store/useTrainingStore";
import { Schedule, CheckIn } from "@/lib/types";
import { randomId } from "@/lib/id";
import Link from "next/link";
import { format, addDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { Check, X, ChevronRight, Plus, Pencil } from "lucide-react";

// Recurring: next 5 days only. One-time: next 14 days.
function getUpcoming(schedules: Schedule[]) {
  const result: { schedule: Schedule; date: string }[] = [];
  const today = startOfDay(new Date());

  for (const s of schedules) {
    if (!s.active) continue;

    if (s.type === "once" && s.date) {
      const diff = differenceInCalendarDays(new Date(s.date + "T12:00:00"), today);
      if (diff >= 0 && diff < 14) result.push({ schedule: s, date: s.date });
    } else if (s.type !== "once") {
      // Only show within next 5 days
      for (let d = 0; d < 5; d++) {
        const day = addDays(today, d);
        if (s.dayOfWeek === day.getDay())
          result.push({ schedule: s, date: format(day, "yyyy-MM-dd") });
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

const isPast     = (date: string) => new Date(date + "T23:59:59") < new Date();
const isToday    = (date: string) => date === format(new Date(), "yyyy-MM-dd");
const isTomorrow = (date: string) => date === format(addDays(new Date(), 1), "yyyy-MM-dd");

function dayLabel(date: string) {
  if (isToday(date))    return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(new Date(date + "T12:00:00"), "EEE");
}

export default function ScheduleWidget() {
  const { schedules, checkIns, upsertCheckIn } = useTrainingStore();
  const occurrences = getUpcoming(schedules);

  if (occurrences.length === 0) {
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

  const getCheckIn = (scheduleId: string, date: string): CheckIn | undefined =>
    checkIns.find((c) => c.scheduleId === scheduleId && c.date === date);

  const markMissed = (scheduleId: string, date: string) =>
    upsertCheckIn({ id: randomId(), scheduleId, date, attended: false });

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
        {occurrences.map(({ schedule, date }) => {
          const checkIn  = getCheckIn(schedule.id, date);
          const past     = isPast(date);
          const today    = isToday(date);
          const attended = checkIn?.attended;
          const missed   = checkIn?.attended === false;

          return (
            <div key={`${schedule.id}-${date}`} className={`flex items-center gap-3 px-4 py-3 ${missed ? "opacity-40" : ""}`}>
              {/* Day badge */}
              <div className={`w-12 text-center shrink-0 ${today ? "text-red-400" : past ? "text-zinc-700" : "text-zinc-400"}`}>
                <p className="text-[9px] font-semibold uppercase tracking-widest leading-none">{dayLabel(date)}</p>
                <p className="text-base font-bold leading-snug tabular-nums">
                  {format(new Date(date + "T12:00:00"), "d")}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium truncate ${past && !attended ? "text-zinc-500" : "text-zinc-100"}`}>
                    {schedule.name}
                  </p>
                  {schedule.type === "once" && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">ONCE</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-zinc-600">{schedule.time}</span>
                  <span className="text-zinc-700 text-xs">·</span>
                  <span className="text-[11px] text-zinc-600">{schedule.duration}m</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    schedule.gi ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                  }`}>
                    {schedule.gi ? "Gi" : "No-Gi"}
                  </span>
                </div>
              </div>

              {/* Edit icon */}
              <Link href={`/schedule?edit=${schedule.id}`}
                className="text-zinc-700 hover:text-zinc-400 transition-colors p-1 shrink-0">
                <Pencil size={13} />
              </Link>

              {/* Status / CTA */}
              {attended ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                  <Check size={12} strokeWidth={2.5} /> Logged
                </span>
              ) : missed ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-600">
                  <X size={12} /> Missed
                </span>
              ) : past ? (
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/add?scheduleId=${schedule.id}&date=${date}`}
                    className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
                    I went
                  </Link>
                  <button onClick={() => markMissed(schedule.id, date)}
                    className="text-[11px] font-medium text-zinc-600 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                    Skip
                  </button>
                </div>
              ) : (
                <Link href={`/add?scheduleId=${schedule.id}&date=${date}`}
                  className="flex items-center gap-0.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  Log <ChevronRight size={11} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
