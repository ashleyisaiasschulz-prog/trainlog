"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import BeltBadge from "@/components/BeltBadge";
import type { Belt } from "@/lib/types";
import { BELT_ORDER, BELT_LABELS } from "@/lib/types";
import { ChevronRight } from "lucide-react";

const STEPS = ["belt", "info", "done"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const sb = createClient();

  const [step, setStep]         = useState<Step>("belt");
  const [belt, setBelt]         = useState<Belt>("white");
  const [stripes, setStripes]   = useState(0);
  const [gym, setGym]           = useState("");
  const [displayName, setDN]    = useState("");
  const [saving, setSaving]     = useState(false);

  const handleFinish = async () => {
    if (!user) { router.replace("/login"); return; }
    setSaving(true);
    await sb.from("profiles").update({
      belt,
      stripes,
      gym: gym.trim() || null,
      display_name: displayName.trim() || null,
    }).eq("id", user.id);
    // Insert first promotion so belt tracker shows time-in-belt
    await sb.from("belt_promotions").upsert({
      user_id: user.id,
      to_belt: belt,
      stripes,
      promoted_at: new Date().toISOString().slice(0, 10),
    }, { onConflict: "user_id,to_belt" });
    await refreshProfile();
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${
              s === step ? "w-6 bg-red-500" : STEPS.indexOf(step) > i ? "w-3 bg-red-800" : "w-3 bg-zinc-800"
            }`} />
          ))}
        </div>

        {/* ── Step 1: Belt ── */}
        {step === "belt" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-zinc-100">What belt are you?</h1>
              <p className="text-sm text-zinc-500 mt-1">You can always update this later</p>
            </div>

            <div className="space-y-2">
              {BELT_ORDER.map(b => (
                <button
                  key={b}
                  onClick={() => setBelt(b)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all ${
                    belt === b ? "border-red-500/40 bg-red-500/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="w-24">
                    <BeltBadge belt={b} stripes={0} size="sm" showLabel={false} />
                  </div>
                  <span className={`text-sm font-semibold flex-1 text-left ${belt === b ? "text-zinc-100" : "text-zinc-400"}`}>
                    {BELT_LABELS[b]}
                  </span>
                  {belt === b && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Stripes */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Stripes</p>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setStripes(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      stripes === n ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Info ── */}
        {step === "info" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-zinc-100">Tell us about you</h1>
              <p className="text-sm text-zinc-500 mt-1">Help your training partners find you</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5">
                  Display Name <span className="text-zinc-700 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDN(e.target.value)}
                  placeholder="Your real name"
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5">
                  Gym <span className="text-zinc-700 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={gym}
                  onChange={e => setGym(e.target.value)}
                  placeholder="Your academy name"
                  className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("belt")}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3.5 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("done")}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-4xl">
              🥋
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-100">You&apos;re all set!</h1>
              <p className="text-sm text-zinc-500 mt-1">Start logging your journey on the mat.</p>
            </div>

            {/* Preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Your Profile</p>
              <BeltBadge belt={belt} stripes={stripes} size="md" showLabel={true} />
              {gym && <p className="text-sm text-zinc-400">{gym}</p>}
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              {saving ? "Saving…" : "Start Training →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
