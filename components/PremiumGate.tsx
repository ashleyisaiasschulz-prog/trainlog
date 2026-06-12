"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useT } from "@/lib/i18n";

interface Props {
  title?: string;
  description?: string;
}

export default function PremiumGate({ title, description }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? t.premiumErrUnknown);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.premiumErrNetwork);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
        <Lock size={28} className="text-amber-400" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold text-zinc-200">{title ?? t.premiumTitle}</p>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-[240px] mx-auto">{description ?? t.premiumDesc}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 w-full max-w-[280px]">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">{t.premiumLabel}</p>
          <p className="text-xl font-black text-zinc-100">{t.premiumPrice} <span className="text-sm font-normal text-zinc-500">{t.premiumPer}</span></p>
        </div>
        <div className="space-y-1.5 text-left">
          {t.premiumFeatures.map(f => (
            <p key={f} className="text-xs text-zinc-400">{f}</p>
          ))}
        </div>
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={startCheckout}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.97] disabled:opacity-60 text-zinc-900 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> {t.premiumUpgrade}</>
          ) : (
            t.premiumUpgrade
          )}
        </button>
        <p className="text-[10px] text-zinc-700 leading-relaxed">
          {t.premiumFooter}
        </p>
      </div>
    </div>
  );
}
