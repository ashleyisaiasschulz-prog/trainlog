"use client";

import { useState } from "react";
import { useTrainingStore } from "@/store/useTrainingStore";
import SessionCard from "@/components/SessionCard";
import StreakWidget from "@/components/StreakWidget";
import MotivationCard from "@/components/MotivationCard";
import GoalsCard from "@/components/GoalsCard";
import BeltBadge from "@/components/BeltBadge";
import ScheduleWidget from "@/components/ScheduleWidget";
import Link from "next/link";
import { Plus, Clock, Calendar, Zap, ChevronRight } from "lucide-react";
import { BELT_ORDER, BELT_LABELS } from "@/lib/types";
import { differenceInMonths, differenceInYears } from "date-fns";

function timeInBelt(promotions: { toBelt: string; date: string }[], belt: string) {
  const last = [...promotions].reverse().find((p) => p.toBelt === belt);
  if (!last) return null;
  const from = new Date(last.date);
  const years = differenceInYears(new Date(), from);
  const months = differenceInMonths(new Date(), from) % 12;
  if (years === 0 && months === 0) return "< 1m";
  return [years > 0 ? `${years}y` : "", months > 0 ? `${months}m` : ""].filter(Boolean).join(" ");
}

type Filter = "all" | "gi" | "nogi";

export default function DashboardPage() {
  const { sessions, currentBelt, currentStripes, promotions } = useTrainingStore();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = sessions.filter((s) =>
    filter === "gi" ? s.gi : filter === "nogi" ? !s.gi : true
  );

  const totalHours = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);
  const thisWeek   = sessions.filter((s) => new Date(s.date) >= new Date(Date.now() - 7 * 86400000)).length;

  const nextBeltIdx = BELT_ORDER.indexOf(currentBelt) + 1;
  const nextBelt    = nextBeltIdx < BELT_ORDER.length ? BELT_ORDER[nextBeltIdx] : null;
  const milestone   = currentStripes < 4
    ? `${4 - currentStripes} stripe${4 - currentStripes !== 1 ? "s" : ""} to go`
    : nextBelt ? `Ready for ${BELT_LABELS[nextBelt]}` : "Black Belt 🏆";

  const beltTime = timeInBelt(promotions, currentBelt);

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Grapplr</h1>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              EARLY ACCESS
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Your BJJ journey</p>
        </div>
        <Link
          href="/add"
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all px-4 py-2.5 text-sm"
        >
          <Plus size={15} strokeWidth={2.5} /> Log
        </Link>
      </div>

      {/* ── Belt card ── */}
      <Link href="/belt">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 active:scale-[0.985] transition-all cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Current Belt</p>
              <BeltBadge belt={currentBelt} stripes={currentStripes} size="md" showLabel={true} />
            </div>
            <ChevronRight size={16} className="text-zinc-700 mt-1 shrink-0" />
          </div>
          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-zinc-800">
            {beltTime && (
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Time in belt</p>
                <p className="text-sm font-semibold text-zinc-300">{beltTime}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Next</p>
              <p className="text-sm font-semibold text-red-400">{milestone}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: "Sessions",  value: sessions.length },
          { icon: Clock,    label: "Hours",     value: `${totalHours}h` },
          { icon: Zap,      label: "This week", value: thisWeek },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Icon size={14} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-zinc-100 tabular-nums leading-none">{value}</p>
            <p className="text-[10px] text-zinc-600 mt-1.5 tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Streak ── */}
      <StreakWidget sessions={sessions} />

      {/* ── Motivation ── */}
      <MotivationCard sessions={sessions} />

      {/* ── Goals ── */}
      <GoalsCard />

      {/* ── Schedule ── */}
      <ScheduleWidget />

      {/* ── Session list ── */}
      <div className="flex flex-col gap-3">
        {/* Filter row */}
        <div className="flex items-center gap-2">
          {(["all", "gi", "nogi"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              {f === "all" ? "All" : f === "gi" ? "Gi" : "No-Gi"}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-zinc-600">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🥋</span>
            <p className="text-sm font-medium text-zinc-400">No sessions yet</p>
            <Link href="/add" className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
              Add Session
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
