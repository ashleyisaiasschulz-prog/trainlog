"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { UserPlus, Mail } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "", password: "", username: "", displayName: "",
  });
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  const setF = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const sb = createClient();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl mb-1">🥋</div>
          <h1 className="text-2xl font-bold text-zinc-100">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">Join Grapplr</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? "Creating…" : <><UserPlus size={15} /> Create Account</>}
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
