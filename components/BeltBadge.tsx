"use client";

import { Belt, BELT_COLORS, BELT_LABELS } from "@/lib/types";

// Hardcoded belt colors that won't be overridden by light-mode CSS
const BELT_BG: Record<Belt, string> = {
  white:  "#d4d4d8",  // zinc-300 — visible on both light + dark backgrounds
  blue:   "#2563eb",
  purple: "#7c3aed",
  brown:  "#78350f",
  black:  "#18181b",  // hardcoded dark — not affected by light-mode CSS override
};

interface Props {
  belt: Belt;
  stripes: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// body% + tip% + tail% must sum to 100
const CFG = {
  sm: { h: "h-5",  body: "flex-1", tip: "w-9",  tail: "w-3",  stripe: "w-1.5 h-3",   gap: "gap-0.5", r: "rounded-lg"  },
  md: { h: "h-7",  body: "flex-1", tip: "w-12", tail: "w-4",  stripe: "w-2 h-[18px]", gap: "gap-0.5", r: "rounded-xl"  },
  lg: { h: "h-11", body: "flex-1", tip: "w-16", tail: "w-5",  stripe: "w-3 h-6",      gap: "gap-1",   r: "rounded-xl"  },
};

export default function BeltBadge({ belt, stripes, size = "md", showLabel = true }: Props) {
  const c   = CFG[size];
  const col = BELT_COLORS[belt];

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      {/* ── Belt bar: [body][black tip with stripes][colored tail] ── */}
      <div className={`flex w-full max-w-[220px] ${c.h} ${c.r} overflow-hidden`}>

        {/* Coloured body */}
        <div className={`${c.body} relative`} style={{ backgroundColor: BELT_BG[belt] }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-black/15" />
        </div>

        {/* Black tip — stripes go here */}
        <div className={`${c.tip} flex items-center justify-center ${c.gap} shrink-0`} style={{ backgroundColor: "#000" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`${c.stripe} rounded-[2px] transition-all duration-200 ${
                i < stripes ? "bg-white" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Coloured tail — small piece after the black tip */}
        <div className={`${c.tail} relative shrink-0`} style={{ backgroundColor: BELT_BG[belt] }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-black/15" />
        </div>
      </div>

      {/* ── Label ── */}
      {showLabel && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">{BELT_LABELS[belt]}</span>
          {stripes > 0 && (
            <span className="text-xs text-zinc-500">{stripes} stripe{stripes !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}
    </div>
  );
}
