"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay,
  isWithinInterval, parseISO, isToday,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useInjuryStore } from "@/store/useInjuryStore";
import type { TrainingSession } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildCalendarWeeks(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 1 });
  const days  = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export default function CalendarPage() {
  const router = useRouter();
  const { sessions, schedules, getCheckIn } = useTrainingStore();
  const { injuries } = useInjuryStore();

  const [month, setMonth]       = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const weeks = useMemo(() => buildCalendarWeeks(month), [month]);
  // All days visible in the grid (incl. leading/trailing days from adjacent months)
  const visibleDays = useMemo(() => weeks.flat(), [weeks]);

  /* Build lookup maps */
  const sessionsByDay = useMemo(() => {
    const map: Record<string, typeof sessions> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  /* Upcoming schedule occurrences for this month */
  const upcomingByDay = useMemo(() => {
    const map: Record<string, { name: string; scheduleId: string; time: string }[]> = {};
    schedules.filter((sch) => sch.active).forEach((sch) => {
      visibleDays.forEach((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        let matches = false;
        if (sch.type === "once" && sch.date === dateStr) {
          matches = true;
        } else if (sch.type === "recurring") {
          // Schedule uses 0=Sunday; d.getDay() also 0=Sunday
          matches = d.getDay() === sch.dayOfWeek;
        }
        if (matches && !getCheckIn(sch.id, dateStr)) {
          if (!map[dateStr]) map[dateStr] = [];
          map[dateStr].push({ name: sch.name, scheduleId: sch.id, time: sch.time });
        }
      });
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [schedules, visibleDays, getCheckIn]);

  /* Injury active ranges */
  function injuryActiveOn(date: Date) {
    return injuries.filter((inj) => {
      const start = parseISO(inj.startDate);
      const end   = inj.endDate ? parseISO(inj.endDate) : new Date();
      return isWithinInterval(date, { start, end });
    });
  }

  const selectedDayKey   = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedSessions = selectedDayKey ? (sessionsByDay[selectedDayKey] ?? []) : [];
  const selectedUpcoming = selectedDayKey ? (upcomingByDay[selectedDayKey] ?? []) : [];
  const selectedInjuries = selected ? injuryActiveOn(selected) : [];
  const hasSelected      = selectedSessions.length > 0 || selectedUpcoming.length > 0 || selectedInjuries.length > 0;

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex-1">Calendar</h1>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth((m) => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-zinc-100">{format(month, "MMMM yyyy")}</span>
        <button onClick={() => setMonth((m) => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day) => {
              const dayKey   = format(day, "yyyy-MM-dd");
              const inMonth  = isSameMonth(day, month);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const todayDay  = isToday(day);
              const hasSess   = !!sessionsByDay[dayKey]?.length;
              const hasUp     = !!upcomingByDay[dayKey]?.length;
              const activeInj = injuryActiveOn(day);
              const hasInj    = activeInj.length > 0;

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelected(isSameDay(day, selected ?? new Date("0000")) ? null : day)}
                  className={`relative flex flex-col items-center py-2 gap-0.5 transition-colors min-h-[52px]
                    ${!inMonth ? "opacity-25" : ""}
                    ${isSelected ? "bg-zinc-700/60" : "hover:bg-zinc-800/60"}
                    ${hasInj && inMonth ? "bg-red-950/20" : ""}
                  `}
                >
                  {/* Day number */}
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                    ${todayDay ? "bg-red-500 text-white" : isSelected ? "text-white" : "text-zinc-300"}`}>
                    {format(day, "d")}
                  </span>

                  {/* Dots row */}
                  <div className="flex gap-0.5 h-1.5 items-center">
                    {hasSess && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {hasUp   && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    {hasInj  && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Session
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-orange-400" /> Injury
        </span>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-100">{format(selected, "EEEE, MMMM d")}</p>
            <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={14} />
            </button>
          </div>

          {!hasSelected && (
            <p className="text-xs text-zinc-500 py-2">Nothing logged for this day.</p>
          )}

          {/* Sessions */}
          {selectedSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Sessions</p>
              {selectedSessions.map((s) => (
                <button key={s.id} onClick={() => router.push(`/session/${s.id}`)}
                  className="w-full text-left bg-zinc-800/60 rounded-xl px-3 py-2.5 hover:bg-zinc-800 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>
                      {s.gi ? "Gi" : "No-Gi"}
                    </span>
                    <span className="text-xs text-zinc-300">{s.duration} min</span>
                    {s.gym && <span className="text-xs text-zinc-600 truncate">{s.gym}</span>}
                    <span className="ml-auto text-[10px] text-zinc-600">Tap to edit →</span>
                  </div>
                  {s.notes && <p className="text-xs text-zinc-500 mt-1 truncate">{s.notes}</p>}
                </button>
              ))}
            </div>
          )}

          {/* Upcoming scheduled */}
          {selectedUpcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Scheduled</p>
              {selectedUpcoming.map((u) => (
                <button key={u.scheduleId}
                  onClick={() => router.push(`/add?scheduleId=${u.scheduleId}&date=${selectedDayKey}`)}
                  className="w-full text-left bg-blue-950/30 border border-blue-900/30 rounded-xl px-3 py-2.5 hover:bg-blue-950/50 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-xs text-blue-300 font-medium">{u.name}</span>
                    {u.time && <span className="text-[11px] text-blue-400/80 font-semibold tabular-nums">{u.time}</span>}
                    <span className="ml-auto text-[10px] text-blue-600">Log session →</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Active injuries */}
          {selectedInjuries.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Injuries</p>
              {selectedInjuries.map((inj) => (
                <button key={inj.id} onClick={() => router.push("/injuries")}
                  className="w-full text-left bg-red-950/30 border border-red-900/20 rounded-xl px-3 py-2.5 hover:bg-red-950/50 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span className="text-xs text-zinc-300 font-medium capitalize">{inj.bodyPart}</span>
                    <span className="text-xs text-zinc-500">· {inj.type}</span>
                    {!inj.endDate && <span className="text-[10px] text-red-400 font-semibold ml-auto">Active</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick actions for this day */}
          <div className="flex gap-2">
            {selectedSessions.length === 0 && (
              <button onClick={() => router.push(`/add?date=${selectedDayKey}`)}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-semibold py-2.5 rounded-xl text-sm transition-all">
                + Log session
              </button>
            )}
            <button onClick={() => router.push(`/injuries?date=${selectedDayKey}`)}
              className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-semibold py-2.5 rounded-xl text-sm transition-all">
              + Track injury
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
