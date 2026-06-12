"use client";

interface Props {
  options: readonly string[];
  selected: string[];           // duplicates allowed: ["Darce","Darce","RNC"]
  onChange: (values: string[]) => void;
  activeColor?: "red" | "green" | "blue" | "orange" | "purple" | "pink";
}

const ACTIVE: Record<NonNullable<Props["activeColor"]>, string> = {
  red:    "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  green:  "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  blue:   "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  orange: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  purple: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  pink:   "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30",
};

export default function TagSelector({ options, selected, onChange, activeColor = "red" }: Props) {
  // Count occurrences of each option
  const counts = selected.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const add = (option: string) => onChange([...selected, option]);

  const removeOne = (option: string) => {
    const idx = selected.lastIndexOf(option);
    if (idx === -1) return;
    const next = [...selected];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const count = counts[option] ?? 0;
        const active = count > 0;
        return (
          <div key={option} className="flex items-center">
            {/* Main tag — tap to add */}
            <button
              type="button"
              onClick={() => add(option)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                active
                  ? `${ACTIVE[activeColor]} rounded-l-lg ${count > 0 ? "rounded-r-none" : "rounded-lg"}`
                  : "bg-zinc-800/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400 rounded-lg"
              }`}
            >
              {option}{count > 1 ? ` ×${count}` : ""}
            </button>

            {/* Remove button — only shown when selected */}
            {active && (
              <button
                type="button"
                onClick={() => removeOne(option)}
                className={`px-1.5 py-1.5 rounded-r-lg text-xs font-bold transition-all duration-150 border-l border-black/10
                  ${ACTIVE[activeColor]} opacity-70 hover:opacity-100`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
