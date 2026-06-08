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
        <p className="text-center text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">Pricing</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Free */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 mb-1">Free</p>
            <p className="text-3xl font-bold text-zinc-100">$0</p>
            <ul className="mt-4 space-y-2.5">
              {["Unlimited logging", "Local storage", "Full analytics"].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                  <Check size={12} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl tracking-widest">
              SOON
            </div>
            <p className="text-xs font-semibold text-red-400 mb-1">Pro</p>
            <p className="text-3xl font-bold text-zinc-100">$4</p>
            <ul className="mt-4 space-y-2.5">
              {["Cloud sync", "Multi-device", "Streak tracking"].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                  <Check size={12} className="text-red-500 shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
