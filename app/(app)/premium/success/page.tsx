"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function PremiumSuccessPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { refreshProfile } = useAuthStore();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { router.replace("/account"); return; }

    const verify = async () => {
      try {
        const res  = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json() as { success?: boolean; error?: string };

        if (data.success) {
          await refreshProfile();
          setConfirmed(true);
          setTimeout(() => router.replace("/dashboard"), 2500);
        } else {
          setError(data.error ?? "Zahlung konnte nicht bestätigt werden.");
        }
      } catch {
        setError("Verbindungsfehler bei der Verifizierung.");
      }
    };

    verify();
  }, [params, refreshProfile, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 gap-4 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={() => router.replace("/account")}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline">
          Zurück zum Profil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 gap-6 text-center">
      {!confirmed ? (
        <>
          <Loader2 size={32} className="text-amber-400 animate-spin" />
          <div className="space-y-1">
            <p className="text-base font-bold text-zinc-200">Zahlung wird bestätigt…</p>
            <p className="text-sm text-zinc-500">Einen Moment bitte</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl">
            🏆
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-100">Du bist Premium!</h1>
            <p className="text-sm text-zinc-400">
              Turniere, Freunde & alle Statistiken sind jetzt freigeschaltet.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 space-y-2 w-full max-w-xs">
            {["📊 Detaillierte Statistiken", "🏆 Turniere & Matches", "🤝 Freunde & Sparring"].map(f => (
              <p key={f} className="text-sm text-zinc-300">{f}</p>
            ))}
          </div>
          <p className="text-xs text-zinc-600">Weiterleitung zum Dashboard…</p>
        </>
      )}
    </div>
  );
}
