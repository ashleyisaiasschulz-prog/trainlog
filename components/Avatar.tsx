"use client";

import { BELT_COLORS, Belt } from "@/lib/types";
import { differenceInYears } from "date-fns";

export function ageFrom(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const a = differenceInYears(new Date(), new Date(birthdate + "T12:00:00"));
  return a > 0 && a < 120 ? a : null;
}

export default function Avatar({ url, name, belt, size = 36 }: {
  url?: string | null; name?: string | null; belt?: string | null; size?: number;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name ?? ""} className="rounded-full object-cover shrink-0 border border-black/20"
      style={{ width: size, height: size }} />;
  }
  const c = BELT_COLORS[(belt ?? "white") as Belt] ?? BELT_COLORS.white;
  const text = belt === "white" || !belt ? "text-zinc-900" : "text-white";
  return (
    <div className={`rounded-full flex items-center justify-center font-bold shrink-0 border border-black/20 ${c.bg} ${text}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {(name ?? "?")[0].toUpperCase()}
    </div>
  );
}
