"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const sb = createClient();
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm">

        <Link href="/login" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <Mail size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Check your inbox</h1>
            <p className="text-sm text-zinc-400">
              We sent a password reset link to <span className="text-zinc-200 font-medium">{email}</span>.
            </p>
            <p className="text-xs text-zinc-600">Didn&apos;t get it? Check your spam folder.</p>
            <Link href="/login"
              className="inline-block mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-zinc-100">Forgot password?</h1>
              <p className="text-sm text-zinc-500 mt-1">We&apos;ll email you a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loading ? "Sending…" : <><Mail size={15} /> Send Reset Link</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
