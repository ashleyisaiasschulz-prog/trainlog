import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, Target, Check } from "lucide-react";

const features = [
  { icon: Zap,        title: "Log in under 30s",    desc: "Quick-tap positions, intensity, reflections. Zero friction." },
  { icon: TrendingUp, title: "See your progress",   desc: "Weekly charts and position trends reveal what's working." },
  { icon: Target,     title: "Train with intent",   desc: "Reflection prompts keep you focused on what matters next." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Early Access pill */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400
                         bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          EARLY ACCESS · v0.1
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-[1.15] max-w-xs">
          Track your BJJ.<br />
          <span className="text-red-500">Get better faster.</span>
        </h1>

        <p className="mt-4 text-zinc-400 text-base max-w-xs leading-relaxed">
          Log every session in 30 seconds. Spot patterns. Train with purpose.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400
                       active:scale-[0.97] text-white font-semibold text-base px-7 py-3.5
                       rounded-2xl transition-all shadow-xl shadow-red-500/20">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 text-zinc-200 font-semibold text-base px-6 py-3.5
                       rounded-2xl transition-all">
            Sign In
          </Link>
        </div>
        <p className="mt-3 text-zinc-700 text-xs">Free · Connect with your gym</p>
      </section>

      {/* ── Features ── */}
      <section className="px-5 pb-12 max-w-md mx-auto w-full space-y-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 items-start bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="w-9 h-9 bg-red-500/8 rounded-xl flex items-center justify-center shrink-0">
              <Icon size={17} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Pricing ── */}
      <section className="px-5 pb-20 max-w-md mx-auto w-full">
        <p className="text-center text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">Pricing</p>
        <p className="text-center text-sm text-zinc-500 mb-5">Start free. Upgrade when you want more.</p>
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Free */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 mb-1">Free</p>
            <p className="text-3xl font-bold text-zinc-100">€0</p>
            <p className="text-[11px] text-zinc-600 mb-4 mt-0.5">forever</p>
            <ul className="space-y-2.5">
              {["Unlimited logging", "Cloud backup & sync", "Streaks & core stats", "Timer, calendar & notes"].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-red-500/[0.07] to-zinc-900 border border-red-500/40 rounded-2xl p-5 relative overflow-hidden ring-1 ring-red-500/20">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl tracking-widest">
              POPULAR
            </div>
            <p className="text-xs font-semibold text-red-400 mb-1">Pro</p>
            <p className="text-3xl font-bold text-zinc-100">€5<span className="text-sm font-medium text-zinc-500">/mo</span></p>
            <p className="text-[11px] text-zinc-600 mb-4 mt-0.5">cancel anytime</p>
            <ul className="space-y-2.5">
              {["Everything in Free", "Advanced analytics & filters", "Friends & sparring records", "Tournament tracking"].map((f, i) => (
                <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check size={12} className={`shrink-0 mt-0.5 ${i === 0 ? "text-zinc-500" : "text-red-500"}`} strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="mt-5 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
              Start free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <p className="text-center text-[11px] text-zinc-600 mt-4">No card needed to start · Upgrade anytime in the app</p>
      </section>
    </main>
  );
}
