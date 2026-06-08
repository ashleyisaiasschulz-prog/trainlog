"use client";

const LEVELS = [
  { label: "Light",  color: "bg-emerald-500", text: "text-emerald-300", ring: "ring-emerald-500/30" },
  { label: "Easy",   color: "bg-lime-500",    text: "text-lime-300",    ring: "ring-lime-500/30"    },
  { label: "Medium", color: "bg-amber-400",   text: "text-amber-300",   ring: "ring-amber-400/30"   },
  { label: "Hard",   color: "bg-orange-500",  text: "text-orange-300",  ring: "ring-orange-500/30"  },
  { label: "Beast",  color: "bg-red-500",     text: "text-red-300",     ring: "ring-red-500/30"     },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function IntensityPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((level, i) => {
        const n = i + 1;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
              active
                ? `${level.color} text-white ring-2 ${level.ring} scale-[1.03]`
                : "bg-zinc-800/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400"
            }`}
          >
            <span className="block text-base font-bold leading-none">{n}</span>
            <span className={`block text-[9px] font-normal mt-0.5 tracking-wide ${active ? "opacity-80" : "opacity-50"}`}>
              {level.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
