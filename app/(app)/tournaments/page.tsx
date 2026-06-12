"use client";

import { useTrainingStore } from "@/store/useTrainingStore";
import { useAuthStore } from "@/store/useAuthStore";
import PremiumGate from "@/components/PremiumGate";
import Link from "next/link";
import { Plus, Trophy, Swords, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Tournament, getPlacementCfg } from "@/lib/types";

function WinBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return null;
  const pct = Math.round((wins / total) * 100);
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-zinc-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

function TournamentCard({ t }: { t: Tournament }) {
  const wins    = t.matches.filter(m => m.result === "win").length;
  const losses  = t.matches.filter(m => m.result === "loss").length;
  const subWins = t.matches.filter(m => m.result === "win" && m.finishType === "submission").length;

  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 hover:border-zinc-700 active:scale-[0.985] transition-all cursor-pointer">
        {/* Name + badges */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-100 flex-1 min-w-0 truncate">{t.name}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
            t.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
          }`}>
            {t.gi ? "Gi" : "No-Gi"}
          </span>
          {t.placement && (() => {
            const cfg = getPlacementCfg(t.placement);
            if (!cfg) return null;
            return (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${cfg.bg} ${cfg.color}`}>
                {cfg.emoji} {cfg.label}
              </span>
            );
          })()}
        </div>
        {/* Date */}
        <p className="text-xs text-zinc-500 mt-0.5">
          {format(new Date(t.date + "T12:00:00"), "MMM d, yyyy")}
          {t.location ? ` · ${t.location}` : ""}
        </p>
        {/* Score + bar */}
        {t.matches.length > 0 ? (
          <div className="mt-2">
            <div className="flex items-center gap-2.5 text-sm mb-1.5">
              <span className="font-bold text-emerald-400 tabular-nums">{wins}W</span>
              <span className="text-zinc-700">·</span>
              <span className="font-bold text-red-400 tabular-nums">{losses}L</span>
              {subWins > 0 && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{subWins} sub{subWins !== 1 ? "s" : ""}</span>
                </>
              )}
              {t.weightClass && <span className="ml-auto text-xs text-zinc-600">{t.weightClass}</span>}
            </div>
            <WinBar wins={wins} losses={losses} />
          </div>
        ) : (
          <p className="text-xs text-zinc-600 mt-1.5">No matches logged</p>
        )}
      </div>
    </Link>
  );
}

export default function TournamentsPage() {
  const { profile } = useAuthStore();
  const { tournaments } = useTrainingStore();

  if (!profile?.is_premium) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col gap-4 min-h-[calc(100vh-80px)]">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Competitions</h1>
        <PremiumGate
          title="Competitions — Premium"
          description="Track tournaments, match results, submissions and placements. Your full competition history in one place."
        />
      </div>
    );
  }

  const allMatches  = tournaments.flatMap(t => t.matches);
  const totalWins   = allMatches.filter(m => m.result === "win").length;
  const totalLosses = allMatches.filter(m => m.result === "loss").length;
  const subWins     = allMatches.filter(m => m.result === "win" && m.finishType === "submission").length;
  const pointsWins  = allMatches.filter(m => m.result === "win" && m.finishType === "points").length;
  const winRate     = allMatches.length > 0 ? Math.round((totalWins / allMatches.length) * 100) : null;
  const sorted      = [...tournaments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Competitions</h1>
        <Link href="/tournaments/add" className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus size={15} strokeWidth={2.5} /> Add
        </Link>
      </div>

      {/* ── Career stats ── */}
      {allMatches.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Career Record</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{totalWins}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{totalLosses}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{winRate}%</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Win rate</p>
            </div>
          </div>

          {/* Win bar */}
          <WinBar wins={totalWins} losses={totalLosses} />

          {/* Method breakdown */}
          {(subWins > 0 || pointsWins > 0) && (
            <div className="flex gap-4 pt-3 border-t border-zinc-800">
              {subWins > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Swords size={12} className="text-red-400" />
                  <span className="font-semibold text-zinc-200">{subWins}</span> submissions
                </div>
              )}
              {pointsWins > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <TrendingUp size={12} className="text-blue-400" />
                  <span className="font-semibold text-zinc-200">{pointsWins}</span> by points
                </div>
              )}
              <div className="ml-auto">
                <span className="text-xs text-zinc-600">{tournaments.length} event{tournaments.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      {sorted.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Trophy size={32} className="text-zinc-700" />
          <p className="text-sm font-medium text-zinc-400">No competitions yet</p>
          <Link href="/tournaments/add" className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold rounded-xl transition-all px-5 py-2.5 text-sm">Add Tournament</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(t => <TournamentCard key={t.id} t={t} />)}
        </div>
      )}
    </div>
  );
}
