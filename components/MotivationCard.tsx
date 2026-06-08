"use client";

import { TrainingSession } from "@/lib/types";
import { startOfMonth, subMonths } from "date-fns";

function topItem(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts: Record<string, number> = {};
  arr.forEach((x) => (counts[x] = (counts[x] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function MotivationCard({ sessions }: { sessions: TrainingSession[] }) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  const thisMonth = sessions.filter((s) => new Date(s.date) >= thisMonthStart);
  const lastMonth = sessions.filter(
    (s) => new Date(s.date) >= lastMonthStart && new Date(s.date) < thisMonthStart
  );

  const givenSubs = (s: TrainingSession) => s.submissionsGiven ?? s.submissions ?? [];
  const topPosition  = topItem(thisMonth.flatMap((s) => s.positions));
  const topSubmission = topItem(thisMonth.flatMap(givenSubs));
  const subDelta = thisMonth.flatMap(givenSubs).length - lastMonth.flatMap(givenSubs).length;

  type Insight = { emoji: string; text: string };
  const insights: Insight[] = [];

  if (thisMonth.length >= 8)
    insights.push({ emoji: "🏆", text: `Incredible month — **${thisMonth.length} sessions** logged!` });
  else if (thisMonth.length >= 4)
    insights.push({ emoji: "💪", text: `Solid month — **${thisMonth.length} sessions** and counting` });

  if (subDelta > 0)
    insights.push({ emoji: "📈", text: `**+${subDelta} submission${subDelta !== 1 ? "s" : ""}** more than last month` });

  if (topPosition)
    insights.push({ emoji: "🎯", text: `Most drilled position: **${topPosition}**` });

  if (topSubmission)
    insights.push({ emoji: "⚔️", text: `Go-to submission: **${topSubmission}**` });

  if (insights.length === 0) return null;

  const { emoji, text } = insights[0];

  return (
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest block mb-2">This Month</span>
      <p className="text-sm text-zinc-300 leading-relaxed relative">
        <span className="mr-1.5">{emoji}</span>
        {text.split("**").map((part, i) =>
          i % 2 === 1
            ? <span key={i} className="font-semibold text-zinc-100">{part}</span>
            : part
        )}
      </p>
    </div>
  );
}
