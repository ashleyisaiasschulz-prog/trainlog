"use client";

import { useTrainingStore } from "@/store/useTrainingStore";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { format, eachWeekOfInterval, subWeeks, addWeeks, startOfMonth, startOfWeek, subDays } from "date-fns";
import { computeStreak } from "@/components/StreakWidget";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, fontSize: 12 },
  labelStyle:   { color: "#a1a1aa" },
  itemStyle:    { color: "#f4f4f5" },
  cursor:       { fill: "rgba(255,255,255,0.03)" },
};

const GREEN_SCALE  = ["#16a34a","#22c55e","#4ade80","#86efac","#bbf7d0","#dcfce7"];
const RED_SCALE    = ["#ef4444","#f87171","#fca5a5","#fecaca","#fee2e2","#fff1f2"];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-200">{title}</p>
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function StatsPage() {
  const { sessions, tournaments } = useTrainingStore();

  const weeklyData = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subWeeks(new Date(), 7), end: new Date() });
    return weeks.map(week => ({
      week: format(week, "MMM d"),
      count: sessions.filter(s => {
        const d = new Date(s.date);
        return d >= week && d < addWeeks(week, 1);
      }).length,
    }));
  }, [sessions]);

  const positionData = useMemo(() => {
    const c: Record<string, number> = {};
    sessions.forEach(s => s.positions.forEach(p => (c[p] = (c[p] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const submissionData = useMemo(() => {
    const given: Record<string, number> = {};
    const received: Record<string, number> = {};
    sessions.forEach(s => {
      (s.submissionsGiven ?? s.submissions ?? []).forEach(sub => (given[sub] = (given[sub] || 0) + 1));
      (s.submissionsReceived ?? []).forEach(sub => (received[sub] = (received[sub] || 0) + 1));
    });
    const toArr = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
    return { given: toArr(given), received: toArr(received) };
  }, [sessions]);

  const giRatio = useMemo(() => [
    { name: "Gi",     value: sessions.filter(s =>  s.gi).length },
    { name: "No-Gi",  value: sessions.filter(s => !s.gi).length },
  ], [sessions]);

  const allMatches  = tournaments.flatMap(t => t.matches);
  const compWins    = allMatches.filter(m => m.result === "win").length;
  const compLosses  = allMatches.filter(m => m.result === "loss").length;
  const subWins     = allMatches.filter(m => m.result === "win" && m.finishType === "submission").length;
  const pointsWins  = allMatches.filter(m => m.result === "win" && m.finishType === "points").length;
  const winMethodData = [
    { name: "Submission", value: subWins },
    { name: "Points",     value: pointsWins },
    { name: "Other",      value: compWins - subWins - pointsWins },
  ].filter(d => d.value > 0);

  const streak      = computeStreak(sessions);
  const avgInten    = sessions.length > 0
    ? (sessions.reduce((a, s) => a + s.intensity, 0) / sessions.length).toFixed(1) : "—";
  const totalHours  = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

  // Day streak
  const dayStreak = (() => {
    if (sessions.length === 0) return 0;
    const dates = new Set(sessions.map(s => s.date));
    let count = 0;
    let d = new Date();
    while (true) {
      const key = format(d, "yyyy-MM-dd");
      if (dates.has(key)) { count++; d = subDays(d, 1); }
      else break;
    }
    return count;
  })();

  // This week
  const weekStart       = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekSessions = sessions.filter(s => new Date(s.date + "T12:00:00") >= weekStart);
  const thisWeekHours   = Math.round(thisWeekSessions.reduce((a, s) => a + s.duration, 0) / 60);

  // This month
  const monthStart       = startOfMonth(new Date());
  const thisMonthSessions = sessions.filter(s => new Date(s.date + "T12:00:00") >= monthStart);
  const thisMonthHours   = Math.round(thisMonthSessions.reduce((a, s) => a + s.duration, 0) / 60);

  if (sessions.length === 0 && tournaments.length === 0) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="text-4xl">📊</span>
        <p className="text-sm font-medium text-zinc-400">No data yet</p>
        <p className="text-xs text-zinc-600">Log sessions to see your stats</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      <h1 className="text-xl font-bold tracking-tight text-zinc-100">Statistics</h1>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Total</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-zinc-100 tabular-nums leading-none">{sessions.length}</p>
              <p className="text-[11px] text-zinc-600 mt-1">sessions</p>
            </div>
            <div className="mb-0.5">
              <p className="text-xl font-bold text-zinc-400 tabular-nums leading-none">{totalHours}h</p>
              <p className="text-[11px] text-zinc-600 mt-1">on the mat</p>
            </div>
          </div>
        </div>
        {/* This month */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">This Month</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-zinc-100 tabular-nums leading-none">{thisMonthSessions.length}</p>
              <p className="text-[11px] text-zinc-600 mt-1">sessions</p>
            </div>
            <div className="mb-0.5">
              <p className="text-xl font-bold text-zinc-400 tabular-nums leading-none">{thisMonthHours}h</p>
              <p className="text-[11px] text-zinc-600 mt-1">on the mat</p>
            </div>
          </div>
        </div>
        {/* This week */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">This Week</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-zinc-100 tabular-nums leading-none">{thisWeekSessions.length}</p>
              <p className="text-[11px] text-zinc-600 mt-1">sessions</p>
            </div>
            <div className="mb-0.5">
              <p className="text-xl font-bold text-zinc-400 tabular-nums leading-none">{thisWeekHours}h</p>
              <p className="text-[11px] text-zinc-600 mt-1">on the mat</p>
            </div>
          </div>
        </div>
        {/* Day streak */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Day Streak</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-red-500 tabular-nums leading-none">{dayStreak}</p>
              <p className="text-[11px] text-zinc-600 mt-1">days in a row</p>
            </div>
            <div className="mb-0.5">
              <p className="text-xl font-bold text-zinc-400 tabular-nums leading-none">{streak}w</p>
              <p className="text-[11px] text-zinc-600 mt-1">week streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Weekly bar chart ── */}
      <ChartCard title="Training Frequency" subtitle="Sessions per week — last 8 weeks">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData} barSize={18} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Sessions" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Gi vs No-Gi ── */}
      {(giRatio[0].value > 0 || giRatio[1].value > 0) && (
        <ChartCard title="Gi vs No-Gi">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart margin={{ top: 8, bottom: 0 }}>
              <Pie data={giRatio} cx="50%" cy="45%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
                <Cell fill="#3b82f6" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ color: "#71717a", fontSize: 11 }}>{v}</span>} />
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Competition ── */}
      {allMatches.length > 0 && (
        <ChartCard title="Competition Record">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { v: compWins,   label: "Wins",   cls: "text-emerald-400" },
              { v: compLosses, label: "Losses", cls: "text-red-400"     },
              { v: allMatches.length > 0 ? Math.round(compWins / allMatches.length * 100) : 0, label: "Win %", cls: "text-zinc-100" },
            ].map(({ v, label, cls }) => (
              <div key={label}>
                <p className={`text-xl font-bold tabular-nums ${cls}`}>{v}{label === "Win %" ? "%" : ""}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* Win bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${allMatches.length > 0 ? Math.round(compWins / allMatches.length * 100) : 0}%` }} />
            </div>
          </div>
          {winMethodData.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart margin={{ top: 8, bottom: 0 }}>
                <Pie data={winMethodData} cx="50%" cy="45%" outerRadius={52} paddingAngle={3} dataKey="value">
                  {winMethodData.map((_, i) => <Cell key={i} fill={RED_SCALE[i % RED_SCALE.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span style={{ color: "#71717a", fontSize: 11 }}>{v}</span>} />
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      )}

      {/* ── Top Positions ── */}
      {positionData.length > 0 && (
        <ChartCard title="Positions Worked" subtitle="Most trained positions">
          <ResponsiveContainer width="100%" height={positionData.length * 38 + 8}>
            <BarChart data={positionData} layout="vertical" barSize={14} margin={{ left: 0, right: 28 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={112} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Sessions" radius={[0, 4, 4, 0]}>
                {positionData.map((_, i) => <Cell key={i} fill={RED_SCALE[i % RED_SCALE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Submissions Applied ── */}
      {submissionData.given.length > 0 && (
        <ChartCard title="Submissions Applied" subtitle="Taps you got on others">
          <ResponsiveContainer width="100%" height={submissionData.given.length * 38 + 8}>
            <BarChart data={submissionData.given} layout="vertical" barSize={14} margin={{ left: 0, right: 28 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={112} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Times" radius={[0, 4, 4, 0]}>
                {submissionData.given.map((_, i) => <Cell key={i} fill={GREEN_SCALE[i % GREEN_SCALE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Submissions Received ── */}
      {submissionData.received.length > 0 && (
        <ChartCard title="Submissions Received" subtitle="Your weak spots — drill these">
          <ResponsiveContainer width="100%" height={submissionData.received.length * 38 + 8}>
            <BarChart data={submissionData.received} layout="vertical" barSize={14} margin={{ left: 0, right: 28 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={112} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Times" radius={[0, 4, 4, 0]}>
                {submissionData.received.map((_, i) => <Cell key={i} fill={RED_SCALE[i % RED_SCALE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
