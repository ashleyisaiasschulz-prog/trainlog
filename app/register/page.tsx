"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePrefsStore } from "@/store/usePrefsStore";
import Link from "next/link";
import { UserPlus, Mail, ChevronRight, Swords, TrendingUp, Zap } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    email: "", password: "", username: "", displayName: "",
  });
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { trackSubmissions, trackSweeps, trackEscapes,
          setTrackSubmissions, setTrackSweeps, setTrackEscapes } = usePrefsStore();

  const setF = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Step 1 → 2 validation ──
  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setStep(2);
  };

  // ── Final registration ──
  const handleRegister = async () => {
    setLoading(true);
    setError("");
    const sb = createClient();
    const username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    const { data: taken } = await sb
      .from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) { setError("Username already taken — pick another"); setLoading(false); return; }

    const { data, error: signErr } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: { username, display_name: form.displayName || username },
      },
    });

    if (signErr) {
      const msg = signErr.message.toLowerCase();
      setError(msg.includes("already") || msg.includes("registered")
        ? "This email is already registered. Please sign in instead."
        : signErr.message);
      setLoading(false);
      return;
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("This email is already registered. Please sign in instead.");
      setLoading(false);
      return;
    }

    if (!data.session) { setVerifying(true); setLoading(false); return; }
    window.location.assign("/onboarding");
  };

  // ── Email verification screen ──
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Mail size={36} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Verify your email</h1>
            <p className="text-sm text-zinc-400 mt-2">
              We sent a confirmation link to{" "}
              <span className="text-zinc-200 font-medium">{form.email}</span>.
            </p>
            <p className="text-sm text-zinc-500 mt-1">Click the link in your inbox to activate your account.</p>
          </div>
          <p className="text-xs text-zinc-600">
            Didn&apos;t get it? Check your spam folder or{" "}
            <button onClick={() => setVerifying(false)} className="text-red-400 hover:text-red-300 transition-colors">
              try again
            </button>.
          </p>
          <Link href="/login"
            className="inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 1: Account details ──
  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-6 h-1.5 bg-red-500 rounded-full" />
            <div className="w-3 h-1.5 bg-zinc-800 rounded-full" />
          </div>

          <div className="text-center mb-8">
            <div className="text-2xl mb-1">🥋</div>
            <h1 className="text-2xl font-bold text-zinc-100">Create account</h1>
            <p className="text-sm text-zinc-500 mt-1">Join Grapplr</p>
          </div>

          <form onSubmit={goToStep2} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Username</label>
                <input type="text" value={form.username} onChange={e => setF("username", e.target.value)}
                  placeholder="bjj_fighter" required minLength={3} maxLength={20}
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Display Name</label>
                <input type="text" value={form.displayName} onChange={e => setF("displayName", e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setF("email", e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setF("password", e.target.value)}
                placeholder="Min. 6 characters" required minLength={6}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              Next <ChevronRight size={16} />
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: Tracking preferences ──
  const trackingOptions = [
    {
      icon: Swords,
      label: "Submissions",
      desc: "Track which submissions you apply and receive each session",
      on: trackSubmissions,
      toggle: () => setTrackSubmissions(!trackSubmissions),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: "Sweeps",
      desc: "Log sweeps you land and get hit with",
      on: trackSweeps,
      toggle: () => setTrackSweeps(!trackSweeps),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Zap,
      label: "Escapes",
      desc: "Record escapes you complete and allow",
      on: trackEscapes,
      toggle: () => setTrackEscapes(!trackEscapes),
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-1.5 bg-red-800 rounded-full" />
          <div className="w-6 h-1.5 bg-red-500 rounded-full" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">What do you want to track?</h1>
          <p className="text-sm text-zinc-500 mt-1">You can change this anytime in Settings</p>
        </div>

        <div className="space-y-3 mb-6">
          {trackingOptions.map(({ icon: Icon, label, desc, on, toggle, color, bg }) => (
            <button key={label} type="button" onClick={toggle}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                on ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 bg-zinc-900/50 opacity-60"
              }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${on ? bg : "bg-zinc-800"}`}>
                <Icon size={22} className={on ? color : "text-zinc-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${on ? "text-zinc-100" : "text-zinc-500"}`}>{label}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-red-500" : "bg-zinc-700"}`}>
                <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => { setStep(1); setError(""); }}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-colors text-sm">
            Back
          </button>
          <button onClick={handleRegister} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            {loading ? "Creating…" : <><UserPlus size={15} /> Create Account</>}
          </button>
        </div>
      </div>
    </div>
  );
}
