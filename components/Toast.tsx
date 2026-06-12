"use client";

import { useToastStore } from "@/store/useToastStore";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Toast() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl
            backdrop-blur-xl border text-sm font-semibold animate-fade-up
            ${t.type === "success"
              ? "bg-emerald-950/95 border-emerald-700/50 text-emerald-300"
              : "bg-red-950/95 border-red-700/50 text-red-300"}`}
        >
          {t.type === "success"
            ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            : <XCircle      size={16} className="text-red-400 shrink-0" />}
          {t.message}
        </button>
      ))}
    </div>
  );
}
