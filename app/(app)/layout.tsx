"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TourOverlay from "@/components/TourOverlay";
import InstallBanner from "@/components/InstallBanner";
import TimerRunner from "@/components/TimerRunner";
import FloatingTimer from "@/components/FloatingTimer";
import Toast from "@/components/Toast";
import { LangProvider } from "@/components/LangProvider";
import Splash from "@/components/Splash";
import { useAuthStore } from "@/store/useAuthStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [minSplash, setMinSplash] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Keep the splash on screen long enough to play the full animation.
  useEffect(() => {
    const t = setTimeout(() => setMinSplash(false), 1900);
    return () => clearTimeout(t);
  }, []);

  // While checking auth / redirecting / before the splash has finished → splash
  if (loading || !user || minSplash) {
    return <Splash />;
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
