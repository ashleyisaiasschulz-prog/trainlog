"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "", password: "", username: "", displayName: "", isTrainer: false,
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const sb = createClient();
    const username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Optional: pre-check username so the user gets told before signup
    const { data: taken } = await sb
      .from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) { setError("Username already taken — pick another"); setLoading(false); return; }

    // Create the auth user. Username/role go in metadata; AuthProvider
    // creates the matching profile (single source of truth → no race).
    const { data, error: signErr } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username,
          display_name: form.displayName || username,
          is_trainer: form.isTrainer,
        },
      },
    });

    if (signErr) {
      const msg = signErr.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(signErr.message);
      }
      setLoading(false);
      return;
    }

    // Supabase obfuscates existing emails: returns a user with empty identities
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("This email is already registered. Please sign in instead.");
      setLoading(false);
      return;
    }

    // Signed in immediately (email confirmation is off) → full nav so session lands everywhere
    window.location.assign("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl mb-1">🥋</div>
          <h1 className="text-2xl font-bold text-zinc-100">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">Join TrainLog</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => set("username", e.target.value)}
                placeholder="bjj_fighter" required minLength={3} maxLength={20}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Display Name</label>
              <input type="text" value={form.displayName} onChange={e => set("displayName", e.target.value)}
                placeholder="Your name"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="you@example.com" required
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
              placeholder="Min. 6 characters" required minLength={6}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>

          {/* Trainer toggle */}
          <button type="button" onClick={() => set("isTrainer", !form.isTrainer)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              form.isTrainer ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-800/60 border-zinc-800"
            }`}>
            <span className="text-lg">{form.isTrainer ? "👨‍🏫" : "🥋"}</span>
            <div className="text-left">
              <p className={`text-sm font-semibold ${form.isTrainer ? "text-amber-400" : "text-zinc-300"}`}>
                {form.isTrainer ? "I'm a Trainer / Coach" : "I'm a Student"}
              </p>
              <p className="text-xs text-zinc-600">Tap to switch role</p>
            </div>
            <div className={`ml-auto w-10 h-5 rounded-full transition-colors ${form.isTrainer ? "bg-amber-500" : "bg-zinc-700"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${form.isTrainer ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? "Creating account…" : <><UserPlus size={16}/> Create Account</>}
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
