"use client";

import { subDays, subMonths, subYears } from "date-fns";

export type Range = "30d" | "3m" | "1y" | "all";

const OPTIONS: { value: Range; label: string }[] = [
  { value: "30d", label: "30d" },
  { value: "3m",  label: "3m"  },
  { value: "1y",  label: "1y"  },
  { value: "all", label: "All" },
];

/** Earliest date included for a range, or null for "all". */
export function cutoffDate(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case "30d": return subDays(now, 30);
    case "3m":  return subMonths(now, 3);
    case "1y":  return subYears(now, 1);
    case "all": return null;
  }
}

/** True if an ISO date string (yyyy-MM-dd) falls within the range. */
export function inRange(dateStr: string, range: Range): boolean {
  const cut = cutoffDate(range);
  if (!cut) return true;
  return new Date(dateStr + "T12:00:00") >= cut;
}

export default function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
      {OPTIONS.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === o.value ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
