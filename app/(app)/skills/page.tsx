"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useTagStore } from "@/store/useTagStore";
import { ArrowLeft, Lock, Trophy } from "lucide-react";

// XP thresholds per level (index = level). Level 0 = locked.
const TIERS = [0, 1, 3, 7, 14, 25, 40, 60, 90, 130, 180];
const MAX_LEVEL = TIERS.length - 1;
const RANKS = ["Locked", "Novice", "Novice", "Apprentice", "Apprentice", "Skilled", "Skilled", "Expert", "Expert", "Master", "Grandmaster"];

function levelOf(xp: number) {
  let lv = 0;
  for (let i = 0; i < TIERS.length; i++) if (xp >= TIERS[i]) lv = i;
  return lv;
}
function progressOf(xp: number) {
  const lv = levelOf(xp);
  if (lv >= MAX_LEVEL) return 1;
  const cur = TIERS[lv], next = TIERS[lv + 1];
  return (xp - cur) / (next - cur);
}

type Accent = "blue" | "emerald" | "violet" | "amber";
const ACCENT: Record<Accent, { bar: string; ring: string; text: string; soft: string }> = {
  blue:    { bar: "bg-blue-500",    ring: "border-blue-500/40",    text: "text-blue-400",    soft: "bg-blue-500/10" },
  emerald: { bar: "bg-emerald-500", ring: "border-emerald-500/40", text: "text-emerald-400", soft: "bg-emerald-500/10" },
  violet:  { bar: "bg-violet-500",  ring: "border-violet-500/40",  text: "text-violet-400",  soft: "bg-violet-500/10" },
  amber:   { bar: "bg-amber-500",   ring: "border-amber-500/40",   text: "text-amber-400",   soft: "bg-amber-500/10" },
};

export default function SkillsPage() {
  const router = useRouter();
  const { sessions } = useTrainingStore();
  const tags = useTagStore();

  const { branches, totalLevel, totalXp, mastered } = useMemo(() => {
    // Aggregate XP per technique from every logged session.
    const tally = (vals: (string[] | undefined)[]) => {
      const m: Record<string, number> = {};
      for (const arr of vals) for (const v of arr ?? []) m[v] = (m[v] ?? 0) + 1;
      return m;
    };
    const posXp = tally(sessions.map(s => s.positions));
    const subXp = tally(sessions.map(s => s.submissionsGiven));
    const swpXp = tally(sessions.map(s => s.sweepsGiven));
    const escXp = tally(sessions.map(s => s.escapesGiven));

    const build = (label: string, icon: string, accent: Accent, palette: string[], xpMap: Record<string, number>) => {
      const names = Array.from(new Set([...palette, ...Object.keys(xpMap)]));
      const skills = names.map(name => {
        const xp = xpMap[name] ?? 0;
        return { name, xp, level: levelOf(xp), progress: progressOf(xp) };
      }).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
      return { label, icon, accent, skills };
    };

    const branches = [
      build("Positions & Control", "🛡️", "blue",    tags.positions,   posXp),
      build("Submissions",          "🎯", "emerald", tags.submissions, subXp),
      build("Sweeps",               "🔄", "violet",  tags.sweeps,      swpXp),
      build("Escapes",              "🚪", "amber",   tags.escapes,     escXp),
    ];

    const all = branches.flatMap(b => b.skills);
    return {
      branches,
      totalLevel: all.reduce((a, s) => a + s.level, 0),
      totalXp: all.reduce((a, s) => a + s.xp, 0),
      mastered: all.filter(s => s.level >= MAX_LEVEL).length,
    };
  }, [sessions, tags]);

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Skill Tree</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Level up every position you train</p>
        </div>
      </div>

      {/* Overall progression */}
      <div className="bg-gradient-to-br from-red-500/[0.08] to-zinc-900 border border-red-500/20 rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-red-400 tabular-nums">{totalLevel}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Total Level</p>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-100 tabular-nums">{totalXp}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">XP earned</p>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400 tabular-nums">{mastered}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Mastered</p>
          </div>
        </div>
        {totalXp === 0 && (
          <p className="text-xs text-zinc-500 text-center mt-3">
            Log sessions with positions & techniques to start leveling up.{" "}
            <Link href="/add" className="text-red-400">Log one →</Link>
          </p>
        )}
      </div>

      {/* Branches */}
      {branches.map(branch => {
        const a = ACCENT[branch.accent];
        return (
          <div key={branch.label} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{branch.icon}</span>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{branch.label}</p>
            </div>
            <div className="grid gap-2">
              {branch.skills.map(skill => {
                const locked = skill.level === 0;
                const maxed = skill.level >= MAX_LEVEL;
                return (
                  <div key={skill.name}
                    className={`bg-zinc-900 border rounded-2xl px-4 py-3 flex items-center gap-3 ${locked ? "border-zinc-800/60 opacity-60" : a.ring}`}>
                    {/* Level badge */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${locked ? "bg-zinc-800" : a.soft}`}>
                      {locked ? <Lock size={15} className="text-zinc-600" /> : maxed ? <Trophy size={16} className={a.text} /> : (
                        <>
                          <span className={`text-[8px] font-bold leading-none ${a.text}`}>LV</span>
                          <span className={`text-base font-black leading-none ${a.text}`}>{skill.level}</span>
                        </>
                      )}
                    </div>
                    {/* Name + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${locked ? "text-zinc-500" : "text-zinc-100"}`}>{skill.name}</p>
                        <span className="text-[10px] text-zinc-600 shrink-0">{RANKS[skill.level]}</span>
                      </div>
                      <div className="mt-1.5 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${a.bar}`} style={{ width: `${Math.round(skill.progress * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {maxed ? `${skill.xp} XP · maxed out` : `${skill.xp} XP${skill.level < MAX_LEVEL ? ` · ${TIERS[skill.level + 1] - skill.xp} to next` : ""}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
