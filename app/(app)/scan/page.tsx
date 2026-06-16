"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CameraOff } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const inst = new Html5Qrcode("qr-reader");
        scanner = inst as unknown as { stop: () => Promise<void>; clear: () => void };

        const onHit = (text: string) => {
          // Accept either a full URL or a raw path; pull out /checkin/<id>
          const m = text.match(/\/checkin\/([0-9a-fA-F-]+)/);
          if (!m) { setError("That's not a Grapplr check-in code."); return; }
          inst.stop().then(() => router.replace(`/checkin/${m[1]}`)).catch(() => router.replace(`/checkin/${m[1]}`));
        };

        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          onHit,
          () => { /* ignore per-frame decode errors */ }
        );
        if (!cancelled) setReady(true);
      } catch {
        setError("Couldn't open the camera. Allow camera access and try again.");
      }
    })();

    return () => {
      cancelled = true;
      try { scanner?.stop().then(() => scanner?.clear()).catch(() => {}); } catch { /* noop */ }
    };
  }, [router]);

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Check in</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Point your camera at the gym's QR code</p>
        </div>
      </div>

      {error ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <CameraOff size={28} className="text-zinc-700" />
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div id="qr-reader" className="w-full" />
          {!ready && <p className="text-xs text-zinc-500 text-center py-4">Starting camera…</p>}
        </div>
      )}
    </div>
  );
}
