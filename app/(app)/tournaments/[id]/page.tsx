"use client";

import { useParams, useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { format } from "date-fns";
import { ArrowLeft, Trash2, Swords, TrendingUp } from "lucide-react";
import { FinishType, getPlacementCfg } from "@/lib/types";

const FINISH_LABEL: Record<FinishType, string> = {
  submission: "Submission", points: "Points", advantages: "Adv",
  dq: "DQ", forfeit: "Forfeit", unknown: "—",
};

export default function TournamentDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const { getTournament, deleteTournament } = useTrainingStore();
  const t = getTournament(id as string);

  if (!t) return (
    <div className="page flex items-center justify-center min-h-[50vh] text-zinc-500 text-sm">
      Tournament not found.
    </div>
  );

  const wins      = t.matches.filter(m => m.result === "win").length;
  const losses    = t.matches.filter(m => m.result === "loss").length;
  const draws     = t.matches.filter(m => m.result === "draw").length;
  const subWins   = t.matches.filter(m => m.result === "win" && m.finishType === "submission").length;
  const pointsWins = t.matches.filter(m => m.result === "win" && m.finishType === "points").length;
  const winRate   = t.matches.length > 0 ? Math.round((wins / t.matches.length) * 100) : null;

  const handleDelete = () => {
    if (confirm("Delete this tournament?")) { deleteTournament(t.id); router.push("/tournaments"); }
  };

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <button onClick={handleDelete}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* ── Title ── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            t.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
          }`}>
            {t.gi ? "Gi" : "No-Gi"}
          </span>
          {t.placement && (() => {
            const cfg = getPlacementCfg(t.placement);
            if (!cfg) return null;
            return (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                {cfg.emoji} {cfg.label}
              </span>
            );
          })()}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">{t.name}</h1>
        <p className="text-sm text-zinc-500">
          {format(new Date(t.date + "T12:00:00"), "MMMM d, yyyy")}
          {t.location   ? ` · ${t.location}`   : ""}
          {t.weightClass ? ` · ${t.weightClass}` : ""}
        </p>
      </div>

      {/* ── Stats ── */}
      {t.matches.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{wins}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{losses}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{winRate ?? "—"}%</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Win rate</p>
            </div>
          </div>

          {/* Win bar */}
          {wins + losses > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winRate}%` }} />
              </div>
            </div>
          )}

          {(subWins > 0 || pointsWins > 0) && (
            <div className="flex gap-4 pt-3 border-t border-zinc-800">
              {subWins > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Swords size={12} className="text-red-400" />
                  <span className="font-semibold text-zinc-200">{subWins}</span> submission{subWins !== 1 ? "s" : ""}
                </div>
              )}
              {pointsWins > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <TrendingUp size={12} className="text-blue-400" />
                  <span className="font-semibold text-zinc-200">{pointsWins}</span> by points
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Matches ── */}
      {t.matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Matches</p>
          {t.matches.map((match, idx) => (
            <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-600 tabular-nums w-5">#{idx + 1}</span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                  match.result === "win"  ? "bg-emerald-500/10 text-emerald-400" :
                  match.result === "loss" ? "bg-red-500/10 text-red-400"         :
                                           "bg-zinc-700 text-zinc-400"
                }`}>
                  {match.result.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400">
                  {FINISH_LABEL[match.finishType]}
                  {match.finishType === "submission" && match.submission ? ` · ${match.submission}` : ""}
                </span>
                {match.score && (
                  <span className="ml-auto text-xs font-mono font-semibold text-zinc-300">{match.score}</span>
                )}
              </div>
              {match.opponentName && (
                <p className="text-xs text-zinc-500">
                  vs <span className="text-zinc-300 font-medium">{match.opponentName}</span>
                  {match.opponentLevel !== "unknown" && (
                    <span className="text-zinc-600"> · {match.opponentLevel}</span>
                  )}
                </p>
              )}
              {match.notes && (
                <p className="text-xs text-zinc-500 leading-relaxed">{match.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Notes ── */}
      {t.notes && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Notes</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{t.notes}</p>
        </div>
      )}

      {t.matches.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🥊</span>
          <p className="text-sm text-zinc-500">No matches logged</p>
        </div>
      )}
    </div>
  );
}
