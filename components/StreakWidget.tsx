"use client";

import { TrainingSession } from "@/lib/types";
import { startOfWeek, subWeeks, subDays, format, eachWeekOfInterval } from "date-fns";

function getWeekKey(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function computeStreak(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 0;
  const sessionWeeks = new Set(sessions.map((s) => getWeekKey(new Date(s.date))));
  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const week = getWeekKey(subWeeks(new Date(), i));
    if (sessionWeeks.has(week)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function computeDayStreak(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 0;
  const sessionDays = new Set(sessions.map((s) => s.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (sessionDays.has(day)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

const heatColor = (count: number) =>
  count === 0 ? "bg-zinc-800/60" :
  count === 1 ? "bg-red-900/70"  :
  count === 2 ? "bg-red-700/80"  :
               "bg-red-500";

export default function StreakWidget({ sessions }: { sessions: TrainingSession[] }) {
  const weekStreak = computeStreak(sessions);
  const dayStreak  = computeDayStreak(sessions);

  const weeks = eachWeekOfInterval(
    { start: subWeeks(new Date(), 7), end: new Date() },
    { weekStartsOn: 1 }
  );

  const countByWeek: Record<string, number> = {};
  sessions.forEach((s) => {
    const key = getWeekKey(new Date(s.date));
    countByWeek[key] = (countByWeek[key] || 0) + 1;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">

      {/* ── Two streak numbers ── */}
      <div className="flex items-stretch gap-3">
        {/* Day streak */}
        <div className="flex-1 bg-zinc-800/60 rounded-xl p-3 text-center">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Day Streak</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-zinc-100 tabular-nums">{dayStreak}</span>
            <span className="text-xs text-zinc-500">days</span>
          </div>
          {dayStreak >= 2 && <p className="text-[10px] text-amber-400 mt-1">🔥 On fire!</p>}
        </div>

        {/* Divider */}
        <div className="w-px bg-zinc-800 self-stretch" />

        {/* Week streak */}
        <div className="flex-1 bg-zinc-800/60 rounded-xl p-3 text-center">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Week Streak</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-zinc-100 tabular-nums">{weekStreak}</span>
            <span className="text-xs text-zinc-500">weeks</span>
          </div>
          {weekStreak >= 3 && <p className="text-[10px] text-red-400 mt-1">💪 Consistent!</p>}
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">Last 8 Weeks</p>
        <div className="flex gap-1.5">
          {weeks.map((week) => {
            const key   = format(week, "yyyy-MM-dd");
            const count = countByWeek[key] || 0;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full aspect-square rounded-md ${heatColor(count)} transition-colors`}
                  title={`${format(week, "MMM d")}: ${count} session${count !== 1 ? "s" : ""}`}
                />
                <span className="text-[9px] text-zinc-700 tabular-nums">{format(week, "d/M")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
