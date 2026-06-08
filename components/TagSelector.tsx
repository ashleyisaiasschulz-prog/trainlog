"use client";

interface Props {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  activeColor?: "red" | "green" | "blue";
}

const ACTIVE: Record<NonNullable<Props["activeColor"]>, string> = {
  red:   "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  green: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  blue:  "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
};

export default function TagSelector({ options, selected, onChange, activeColor = "red" }: Props) {
  const toggle = (option: string) =>
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            selected.includes(option)
              ? ACTIVE[activeColor]
              : "bg-zinc-800/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
