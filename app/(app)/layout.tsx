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
import Splash from "@/components/Splash";
import { useAuthStore } from "@/store/useAuthStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While checking auth, or redirecting → animated splash
  if (loading || !user) {
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
