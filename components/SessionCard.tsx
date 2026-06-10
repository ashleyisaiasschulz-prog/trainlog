"use client";

import Link from "next/link";
import { TrainingSession } from "@/lib/types";
import { format } from "date-fns";
import { Clock, Zap, ChevronRight } from "lucide-react";

interface Props {
  session: TrainingSession;
}

const intensityDot = (n: number) =>
  n <= 2 ? "bg-emerald-500" : n === 3 ? "bg-amber-400" : n === 4 ? "bg-orange-500" : "bg-red-500";

export default function SessionCard({ session }: Props) {
  const d = new Date(session.date + "T12:00:00");

  return (
    <Link href={`/session/${session.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.985] transition-all hover:border-zinc-700 cursor-pointer">

        {/* Date column */}
        <div className="flex flex-col items-center w-9 shrink-0">
          <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest leading-none">
            {format(d, "MMM")}
          </span>
          <span className="text-[22px] font-bold text-zinc-100 leading-tight tabular-nums">
            {format(d, "d")}
          </span>
          <span className="text-[10px] text-zinc-600 leading-none">
            {format(d, "EEE")}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-zinc-800 shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badges row */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              session.gi
                ? "bg-blue-500/10 text-blue-400"
                : "bg-violet-500/10 text-violet-400"
            }`}>
              {session.gi ? "Gi" : "No-Gi"}
            </span>
            {session.gym && (
              <span className="text-[11px] text-zinc-500 truncate">{session.gym}</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock size={11} className="text-zinc-600" />
              {session.duration}m
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${intensityDot(session.intensity)}`} />
              {session.intensity}/5
            </span>
            {/* Sub stats */}
            {(session.submissionsGiven?.length ?? 0) > 0 && (
              <span className="text-[11px] text-emerald-600 font-medium">
                +{session.submissionsGiven!.length} sub{session.submissionsGiven!.length > 1 ? "s" : ""}
              </span>
            )}
            {(session.submissionsReceived?.length ?? 0) > 0 && (
              <span className="text-[11px] text-red-500 font-medium">
                −{session.submissionsReceived!.length} sub{session.submissionsReceived!.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Position tags */}
          {session.positions.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {session.positions.slice(0, 3).map((p) => (
                <span key={p} className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md">
                  {p}
                </span>
              ))}
              {session.positions.length > 3 && (
                <span className="text-[10px] text-zinc-700">+{session.positions.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <ChevronRight size={15} className="text-zinc-700 shrink-0" />
      </div>
    </Link>
  );
}
