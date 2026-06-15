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

        // Inactive: simple pill, tap to add.
        if (!active) {
          return (
            <button
              key={option}
              type="button"
              onClick={() => add(option)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400 transition-all duration-150"
            >
              {option}
            </button>
          );
        }

        // Active: stepper — minus · name ×N · plus. Tap + as often as you like.
        return (
          <div key={option} className={`flex items-center rounded-lg overflow-hidden ${ACTIVE[activeColor]}`}>
            <button
              type="button"
              onClick={() => removeOne(option)}
              aria-label={`Remove one ${option}`}
              className="px-2 py-1.5 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
            >
              −
            </button>
            <span className="px-1 py-1.5 text-xs font-semibold select-none">
              {option}{count > 1 ? ` ×${count}` : ""}
            </span>
            <button
              type="button"
              onClick={() => add(option)}
              aria-label={`Add one ${option}`}
              className="px-2 py-1.5 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity border-l border-black/10"
            >
              +
            </button>
          </div>
        );
      })}
    </div>
  );
}
