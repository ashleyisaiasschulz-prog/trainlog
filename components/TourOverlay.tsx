"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { useTourStore } from "@/store/useTourStore";

const STEPS = [
  {
    path: "/dashboard",
    title: "Training Hub",
    desc: "Your home screen — see your belt, training streak and recent sessions at a glance.",
  },
  {
    path: "/add",
    title: "Log a Session",
    desc: "After every training, log positions, submissions, sweeps and escapes you worked on.",
  },
  {
    path: "/stats",
    title: "Your Statistics",
    desc: "Charts show which positions you drill most and your submission patterns over time.",
  },
  {
    path: "/belt",
    title: "Belt Tracker",
    desc: "Record every promotion and see how long you've trained at each belt. Your full journey.",
  },
];

export default function TourOverlay() {
  const { active, finish } = useTourStore();
  const pathname = usePathname();
  const router   = useRouter();

  if (!active) return null;

  const stepIdx = STEPS.findIndex(s => s.path === pathname);
  if (stepIdx === -1) return null;

  const step   = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const next = () => {
    if (isLast) { finish(); router.push("/dashboard"); }
    else router.push(STEPS[stepIdx + 1].path);
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-zinc-900 border border-zinc-600 rounded-2xl p-4 shadow-2xl shadow-black/80">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                Step {stepIdx + 1} of {STEPS.length}
              </span>
              <p className="text-sm font-bold text-zinc-100 mt-0.5">{step.title}</p>
            </div>
            <button
              onClick={finish}
              className="text-zinc-600 hover:text-zinc-400 p-1 shrink-0 transition-colors"
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">{step.desc}</p>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 flex-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === stepIdx
                      ? "w-5 bg-red-500"
                      : i < stepIdx
                      ? "flex-1 bg-red-900/60"
                      : "flex-1 bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
            >
              {isLast ? "Finish" : "Next"}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
