"use client";

import { useTrainingStore } from "@/store/useTrainingStore";
import SessionCard from "@/components/SessionCard";
import BeltBadge from "@/components/BeltBadge";
import ScheduleWidget from "@/components/ScheduleWidget";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Timer, BookOpen, HeartPulse, CalendarDays, Trophy, QrCode, Swords, Flame } from "lucide-react";
import { BELT_ORDER, BELT_LABELS } from "@/lib/types";
import { differenceInYears, differenceInDays, format, subDays } from "date-fns";
import { useState } from "react";
import { useInjuryStore } from "@/store/useInjuryStore";

function timeInBelt(promotions: { toBelt: string; date: string }[], belt: string) {
  const last = [...promotions].reverse().find((p) => p.toBelt === belt);
  if (!last) return null;
  return formatBeltTime(last.date);
}

function formatBeltTime(dateStr: string) {
  const from  = new Date(dateStr + "T12:00:00");
  const days  = differenceInDays(new Date(), from);
  const years = differenceInYears(new Date(), from);
  if (days === 0) return "Today";
  if (years === 0) return `${days}d`;
  const remainingDays = differenceInDays(new Date(), new Date(
    from.getFullYear() + years, from.getMonth(), from.getDate()
  ));
  return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years}y`;
}

type Filter = "all" | "gi" | "nogi";

export default function DashboardPage() {
  const { sessions, currentBelt, currentStripes, promotions } = useTrainingStore();
  const { injuries } = useInjuryStore();
  const activeInjuries = injuries.filter((i) => !i.endDate).length;
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  // Day streak
  const sessionDays = new Set(sessions.map((s) => s.date));
  let dayStreak = 0;
  for (let i = 0; i < 365; i++) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (sessionDays.has(day)) dayStreak++;
    else if (i > 0) break;
  }

  const nextBeltIdx = BELT_ORDER.indexOf(currentBelt) + 1;
  const nextBelt    = nextBeltIdx < BELT_ORDER.length ? BELT_ORDER[nextBeltIdx] : null;
  const milestone   = currentStripes < 4
    ? `${4 - currentStripes} stripe${4 - currentStripes !== 1 ? "s" : ""} to go`
    : nextBelt ? `Ready for ${BELT_LABELS[nextBelt]}` : "Black Belt 🏆";

  const beltTime = timeInBelt(promotions, currentBelt);

  // Sessions sorted by date descending
  const sorted   = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((s) =>
    filter === "gi" ? s.gi : filter === "nogi" ? !s.gi : true
  );

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-100">
            Grapplr<span className="text-red-500">.</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-zinc-500">Your BJJ journey</p>
            {dayStreak >= 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Flame size={11}/> {dayStreak}d
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/scan"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all">
            <QrCode size={18} />
          </Link>
          <Link href="/calendar"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all">
            <CalendarDays size={18} />
          </Link>
          <button onClick={() => router.push("/timer")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all">
            <Timer size={18} />
          </button>
          <Link href="/add"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all px-4 py-2.5 text-sm">
            <Plus size={15} strokeWidth={2.5} /> Log
          </Link>
        </div>
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
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Time in belt</p>
              <p className="text-sm font-semibold text-zinc-300">{beltTime ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Next</p>
              <p className="text-sm font-semibold text-red-400">{milestone}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Quick Access Tools ── */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/techniques" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <BookOpen size={17} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">Techniques</p>
            <p className="text-[10px] text-zinc-600">Personal notes</p>
          </div>
        </Link>
        <Link href="/injuries" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeInjuries > 0 ? "bg-red-500/10" : "bg-zinc-800"}`}>
            <HeartPulse size={17} className={activeInjuries > 0 ? "text-red-400" : "text-zinc-500"} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">Injuries</p>
            <p className={`text-[10px] ${activeInjuries > 0 ? "text-red-500" : "text-zinc-600"}`}>
              {activeInjuries > 0 ? `${activeInjuries} active` : "Track & recover"}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Skill Tree ── */}
      <Link href="/skills" className="bg-gradient-to-r from-red-500/[0.08] to-zinc-900 border border-red-500/20 hover:border-red-500/40 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition-all">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <Swords size={17} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200">Skill Tree</p>
          <p className="text-[10px] text-zinc-600">Level up every position you train</p>
        </div>
        <ChevronRight size={16} className="text-zinc-700 shrink-0" />
      </Link>

      {/* ── Competitions ── */}
      <Link href="/tournaments" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition-all">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Trophy size={17} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200">Competitions</p>
          <p className="text-[10px] text-zinc-600">Tournaments, matches & medals</p>
        </div>
        <ChevronRight size={16} className="text-zinc-700 shrink-0" />
      </Link>

      {/* ── Upcoming sessions ── */}
      <ScheduleWidget />

      {/* ── Session list ── */}
      <div className="flex flex-col gap-3">
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
              Log Session
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.slice(0, 5).map((s) => <SessionCard key={s.id} session={s} />)}
            {filtered.length > 5 && (
              <Link href="/sessions"
                className="mt-1 flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 font-semibold py-3 rounded-2xl text-sm transition-all active:scale-[0.99]">
                Show all {filtered.length} sessions <ChevronRight size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
