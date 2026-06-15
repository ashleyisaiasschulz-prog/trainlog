"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  format, parseISO, startOfWeek, endOfWeek, isSameMonth,
} from "date-fns";
import { useTrainingStore } from "@/store/useTrainingStore";
import SessionCard from "@/components/SessionCard";
import type { TrainingSession } from "@/lib/types";

type GroupBy = "month" | "week";
type Filter = "all" | "gi" | "nogi";

function groupKey(dateStr: string, by: GroupBy): { key: string; label: string } {
  const d = parseISO(dateStr);
  if (by === "month") {
    return { key: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  }
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end   = endOfWeek(d,   { weekStartsOn: 1 });
  const label = isSameMonth(start, end)
    ? `${format(start, "MMM d")} – ${format(end, "d")}`
    : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
  return { key: format(start, "yyyy-MM-dd"), label };
}

export default function SessionsHistoryPage() {
  const { sessions } = useTrainingStore();
  const [by, setBy]         = useState<GroupBy>("month");
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(() => {
    const sorted = [...sessions]
      .filter((s) => filter === "gi" ? s.gi : filter === "nogi" ? !s.gi : true)
      .sort((a, b) => b.date.localeCompare(a.date));

    const map = new Map<string, { label: string; items: TrainingSession[] }>();
    for (const s of sorted) {
      const { key, label } = groupKey(s.date, by);
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key)!.items.push(s);
    }
    return [...map.values()];
  }, [sessions, by, filter]);

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">All Sessions</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">{sessions.length} logged</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Type filter */}
        {(["all", "gi", "nogi"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-400"
            }`}>
            {f === "all" ? "All" : f === "gi" ? "Gi" : "No-Gi"}
          </button>
        ))}
        {/* Group toggle */}
        <div className="ml-auto flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {(["month", "week"] as GroupBy[]).map((g) => (
            <button key={g} onClick={() => setBy(g)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                by === g ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">🥋</span>
          <p className="text-sm font-medium text-zinc-400">No sessions</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-3 pt-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{g.label}</p>
              <span className="text-[10px] text-zinc-600">{g.items.length}</span>
              <div className="flex-1 h-px bg-zinc-800/80" />
            </div>
            {g.items.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        ))
      )}
    </div>
  );
}
