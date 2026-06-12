"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutDashboard, PlusCircle, BarChart2, Trophy, Users } from "lucide-react";

const SLIDES = [
  {
    icon: LayoutDashboard,
    emoji: "🏠",
    color: "text-red-400",
    bg: "bg-red-500/10",
    title: "Your Dashboard",
    desc: "See your current belt, training streak and recent sessions at a glance. Everything that matters in one view.",
    visual: (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-sm font-bold text-red-400">G</div>
          <div>
            <p className="text-sm font-bold text-zinc-100">Grapplr<span className="text-red-500">.</span></p>
            <p className="text-[10px] text-zinc-500">Your BJJ journey</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["42 sessions", "68h mat", "4w streak"].map(v => (
            <div key={v} className="flex-1 bg-zinc-800 rounded-xl p-2 text-center">
              <p className="text-xs font-bold text-zinc-100">{v.split(" ")[0]}</p>
              <p className="text-[9px] text-zinc-600">{v.split(" ").slice(1).join(" ")}</p>
            </div>
          ))}
        </div>
        <div className="h-px bg-zinc-800"/>
        <div className="space-y-1.5">
          {["Monday · Gi · 90min", "Saturday · No-Gi · 60min"].map(s => (
            <div key={s} className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/>
              <p className="text-[11px] text-zinc-400">{s}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: PlusCircle,
    emoji: "📝",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Log Your Training",
    desc: "After every session, log positions, submissions, sweeps and escapes. Build a full picture of your game over time.",
    visual: (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Log Training</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 text-center">
            <p className="text-xs font-bold text-blue-400">Gi</p>
          </div>
          <div className="flex-1 bg-zinc-800 rounded-xl py-2 text-center">
            <p className="text-xs text-zinc-500">No-Gi</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Closed Guard", "Mount", "Back Control"].map(p => (
            <span key={p} className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-lg">{p}</span>
          ))}
          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-lg">Side Control</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Triangle", "RNC"].map(s => (
            <span key={s} className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg">{s}</span>
          ))}
          <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-lg">Armbar</span>
        </div>
        <div className="bg-red-600 rounded-xl py-2 text-center">
          <p className="text-xs font-semibold text-white">Save Session</p>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart2,
    emoji: "📊",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Track Your Progress",
    desc: "Stats show where you excel and where to improve. See your most trained positions, top submissions, and training frequency.",
    visual: (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Statistics</p>
        <div className="space-y-2">
          {[["Closed Guard", 85], ["Back Control", 65], ["Half Guard", 45], ["Mount", 30]].map(([name, pct]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 w-20 truncate">{name}</span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }}/>
              </div>
              <span className="text-[10px] text-zinc-400 w-5 text-right">{Math.round(Number(pct)/10)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Trophy,
    emoji: "🏆",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    title: "Compete & Improve",
    desc: "Log every tournament, track match results, record submissions and placements. Your competition history in one place.",
    visual: (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Tournaments</p>
        <div className="space-y-2">
          {[
            { name: "IBJJF Pan 2026", place: "🥇", record: "4W-0L" },
            { name: "Grappling Ind.", place: "🥈", record: "2W-1L" },
          ].map(t => (
            <div key={t.name} className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
              <span className="text-base">{t.place}</span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-zinc-200">{t.name}</p>
                <p className="text-[9px] text-zinc-500">{t.record}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 text-center">
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-400">6</p>
            <p className="text-[9px] text-zinc-600">Wins</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-400">1</p>
            <p className="text-[9px] text-zinc-600">Losses</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zinc-200">86%</p>
            <p className="text-[9px] text-zinc-600">Win rate</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    emoji: "🤝",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "Train Together",
    desc: "Add training partners as friends, join groups, and track head-to-head sparring records. See who's been submitting who.",
    visual: (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Head-to-Head</p>
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">7</p>
            <p className="text-[9px] text-zinc-500 uppercase">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-zinc-400">1</p>
            <p className="text-[9px] text-zinc-500 uppercase">Draws</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">3</p>
            <p className="text-[9px] text-zinc-500 uppercase">Losses</p>
          </div>
        </div>
        <div className="space-y-1">
          {[
            { res: "win", info: "Jun 8 · Rear Naked Choke" },
            { res: "loss", info: "Jun 1 · Points" },
            { res: "win", info: "May 24 · Triangle" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                m.res === "win" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"
              }`}>{m.res.toUpperCase()}</span>
              <span className="text-[10px] text-zinc-500">{m.info}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
] as const;

export default function TourPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);

  const done = () => router.replace("/dashboard");
  const next = () => {
    if (idx < SLIDES.length - 1) setIdx(i => i + 1);
    else done();
  };
  const prev = () => setIdx(i => Math.max(0, i - 1));

  const slide = SLIDES[idx];
  const Icon = slide.icon;
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between px-6 py-10 max-w-sm mx-auto">

      {/* Skip */}
      <div className="w-full flex justify-end">
        <button onClick={done} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6 py-4">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${slide.bg}`}>
          <Icon size={32} className={slide.color} />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-zinc-100">{slide.title}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mx-auto">{slide.desc}</p>
        </div>

        {/* Visual mockup */}
        <div className="w-full">{slide.visual}</div>
      </div>

      {/* Navigation */}
      <div className="w-full space-y-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx ? "w-5 h-1.5 bg-red-500" : "w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-600"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {idx > 0 && (
            <button onClick={prev}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3.5 rounded-xl transition-colors text-sm">
              Back
            </button>
          )}
          <button onClick={next}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {isLast ? "Start Training →" : <>Next <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
