"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid")) setError("Wrong email or password.");
      else if (msg.includes("confirm")) setError("Please confirm your email first.");
      else setError(error.message);
      setLoading(false);
      return;
    }
    // Full navigation so the session cookie is present everywhere
    window.location.assign("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl mb-1">🥋</div>
          <h1 className="text-2xl font-bold text-zinc-100">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to Grapplr</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? "Signing in…" : <><LogIn size={16}/> Sign In</>}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          No account?{" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
