"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useTagStore } from "@/store/useTagStore";
import { ArrowLeft, Shield, Target, Repeat, DoorOpen, LucideIcon } from "lucide-react";
import type { TrainingSession } from "@/lib/types";

// XP thresholds per level (index = level). Level 0 = untrained.
const TIERS = [0, 1, 3, 7, 14, 25, 40, 60, 90, 130, 180];
const MAX_LEVEL = TIERS.length - 1;

function levelOf(xp: number) { let lv = 0; for (let i = 0; i < TIERS.length; i++) if (xp >= TIERS[i]) lv = i; return lv; }
function progressOf(xp: number) {
  const lv = levelOf(xp);
  if (lv >= MAX_LEVEL) return 1;
  return (xp - TIERS[lv]) / (TIERS[lv + 1] - TIERS[lv]);
}

// Category levels use a wider curve (they aggregate many techniques).
const CAT_TIERS = [0, 5, 15, 35, 70, 120, 190, 290, 430, 620, 900];
function catLevelOf(xp: number) { let lv = 0; for (let i = 0; i < CAT_TIERS.length; i++) if (xp >= CAT_TIERS[i]) lv = i; return lv; }
function catProgressOf(xp: number) {
  const lv = catLevelOf(xp);
  if (lv >= CAT_TIERS.length - 1) return 1;
  return (xp - CAT_TIERS[lv]) / (CAT_TIERS[lv + 1] - CAT_TIERS[lv]);
}

// Rank title by overall grappler level.
const RANK_BANDS = [
  { min: 0,  title: "Fresh Meat" },
  { min: 1,  title: "Novice Grappler" },
  { min: 6,  title: "Mat Rat" },
  { min: 16, title: "Guard Hunter" },
  { min: 31, title: "Submission Artist" },
  { min: 51, title: "Mat Veteran" },
  { min: 81, title: "Grappling Legend" },
];
function rankFor(level: number) {
  let idx = 0;
  for (let i = 0; i < RANK_BANDS.length; i++) if (level >= RANK_BANDS[i].min) idx = i;
  const band = RANK_BANDS[idx];
  const next = RANK_BANDS[idx + 1];
  const progress = next ? (level - band.min) / (next.min - band.min) : 1;
  return { title: band.title, progress, next: next?.title ?? null };
}

type Accent = "blue" | "emerald" | "violet" | "amber";
const ACCENT: Record<Accent, { hex: string; text: string; soft: string }> = {
  blue:    { hex: "#3b82f6", text: "text-blue-400",    soft: "bg-blue-500/10" },
  emerald: { hex: "#22c55e", text: "text-emerald-400", soft: "bg-emerald-500/10" },
  violet:  { hex: "#8b5cf6", text: "text-violet-400",  soft: "bg-violet-500/10" },
  amber:   { hex: "#f59e0b", text: "text-amber-400",   soft: "bg-amber-500/10" },
};

function Ring({ progress, level, hex }: { progress: number; level: number; hex: string }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} stroke="#27272a" strokeWidth="6" fill="none" />
      <circle cx="32" cy="32" r={r} stroke={hex} strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 32 32)" />
      <text x="32" y="30" textAnchor="middle" fontSize="8" fill="#71717a" fontWeight="700">LV</text>
      <text x="32" y="44" textAnchor="middle" fontSize="18" fill="#fafafa" fontWeight="800">{level}</text>
    </svg>
  );
}

export default function SkillsPage() {
  const router = useRouter();
  const { sessions } = useTrainingStore();
  const tags = useTagStore();

  const data = useMemo(() => {
    const tally = (pick: (s: TrainingSession) => string[]) => {
      const m: Record<string, number> = {};
      for (const s of sessions) for (const v of pick(s) ?? []) m[v] = (m[v] ?? 0) + 1;
      return m;
    };

    const defs: { label: string; Icon: LucideIcon; accent: Accent; palette: string[]; pick: (s: TrainingSession) => string[] }[] = [
      { label: "Positions",   Icon: Shield,  accent: "blue",    palette: tags.positions,
        pick: s => s.positions ?? [] },
      { label: "Submissions", Icon: Target,  accent: "emerald", palette: tags.submissions,
        pick: s => [...(s.submissionsGiven ?? []), ...(s.submissionsReceived ?? [])] },
      { label: "Sweeps",      Icon: Repeat,  accent: "violet",  palette: tags.sweeps,
        pick: s => [...(s.sweepsGiven ?? []), ...(s.sweepsReceived ?? [])] },
      { label: "Escapes",     Icon: DoorOpen, accent: "amber",  palette: tags.escapes,
        pick: s => [...(s.escapesGiven ?? []), ...(s.escapesReceived ?? [])] },
    ];

    const categories = defs.map(d => {
      const xpMap = tally(d.pick);
      const names = Array.from(new Set([...d.palette, ...Object.keys(xpMap)]));
      const skills = names.map(name => {
        const xp = xpMap[name] ?? 0;
        return { name, xp, level: levelOf(xp) };
      }).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
      const catXp = skills.reduce((a, s) => a + s.xp, 0);
      return { ...d, skills, catXp, catLevel: catLevelOf(catXp), catProgress: catProgressOf(catXp) };
    });

    const allSkills = categories.flatMap(c => c.skills);
    const totalLevel = allSkills.reduce((a, s) => a + s.level, 0);
    const totalXp = allSkills.reduce((a, s) => a + s.xp, 0);
    const mastered = allSkills.filter(s => s.level >= MAX_LEVEL).length;
    return { categories, totalLevel, totalXp, mastered, rank: rankFor(totalLevel) };
  }, [sessions, tags]);

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Grappler Profile</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Every rep levels you up</p>
        </div>
      </div>

      {/* Hero — overall level + rank */}
      <div className="bg-gradient-to-br from-red-500/[0.10] to-zinc-900 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-red-400 leading-none">LEVEL</span>
            <span className="text-2xl font-black text-red-400 leading-tight tabular-nums">{data.totalLevel}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-zinc-100">{data.rank.title}</p>
            <p className="text-[11px] text-zinc-500">{data.totalXp} XP · {data.mastered} mastered</p>
            <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.round(data.rank.progress * 100)}%` }} />
            </div>
            {data.rank.next && <p className="text-[10px] text-zinc-600 mt-1">Next rank: {data.rank.next}</p>}
          </div>
        </div>
        {data.totalXp === 0 && (
          <p className="text-xs text-zinc-500 text-center mt-4">
            Log sessions with techniques to start leveling up.{" "}
            <Link href="/add" className="text-red-400">Log one →</Link>
          </p>
        )}
      </div>

      {/* Categories */}
      {data.categories.map(cat => {
        const a = ACCENT[cat.accent];
        return (
          <div key={cat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Ring progress={cat.catProgress} level={cat.catLevel} hex={a.hex} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <cat.Icon size={15} className={a.text} />
                  <p className="text-sm font-bold text-zinc-100">{cat.label}</p>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">{cat.catXp} XP · {cat.skills.filter(s => s.level > 0).length}/{cat.skills.length} unlocked</p>
              </div>
            </div>
            {/* Technique chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cat.skills.map(skill => {
                const locked = skill.level === 0;
                return (
                  <span key={skill.name}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg flex items-center gap-1 ${
                      locked ? "bg-zinc-800/50 text-zinc-600" : `${a.soft} ${a.text}`
                    }`}>
                    {skill.name}
                    {!locked && <span className="text-[9px] font-bold opacity-70">Lv{skill.level}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
