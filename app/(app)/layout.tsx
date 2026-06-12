"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TourOverlay from "@/components/TourOverlay";
import InstallBanner from "@/components/InstallBanner";
import TimerRunner from "@/components/TimerRunner";
import FloatingTimer from "@/components/FloatingTimer";
import Toast from "@/components/Toast";
import { LangProvider } from "@/components/LangProvider";
import { useAuthStore } from "@/store/useAuthStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While checking auth, or redirecting → show a clean loader
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-950">
        <div className="text-2xl">🥋</div>
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-600">Loading…</p>
      </div>
    );
  }

  return (
    <LangProvider>
      <div className="min-h-screen flex flex-col safe-area-pt">
        <TimerRunner />
        <FloatingTimer />
        <div className="flex-1 max-w-md mx-auto w-full">{children}</div>
        <Toast />
        <InstallBanner />
        <TourOverlay />
        <Navbar />
      </div>
    </LangProvider>
  );
}
