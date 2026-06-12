"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function WiderrufPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Widerrufsbelehrung</h1>
      <p className="text-xs text-zinc-600 mb-6">Gemäß § 312g BGB</p>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <strong>Prototyp</strong> — Diese Widerrufsbelehrung ist noch nicht vollständig und nicht rechtsverbindlich. Vor dem offiziellen Launch rechtlich prüfen lassen.
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Widerrufsrecht</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Du hast das Recht, binnen <strong className="text-zinc-300">14 Tagen</strong> ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Widerruf erklären</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Um dein Widerrufsrecht auszuüben, musst du uns mittels einer eindeutigen Erklärung (z. B. E-Mail) über deinen Entschluss informieren:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
            <p>[Dein Name]</p>
            <p>[Adresse]</p>
            <p>E-Mail: 20asherhd02@gmail.com</p>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Folgen des Widerrufs</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen 14 Tagen zurückzuzahlen.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Ausschluss / Erlöschen des Widerrufsrechts</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Das Widerrufsrecht erlischt bei Verträgen zur Lieferung von digitalen Inhalten, wenn die Ausführung begonnen hat und du ausdrücklich zugestimmt hast, dass wir mit der Ausführung beginnen und du dein Widerrufsrecht kennst.
          </p>
        </section>
      </div>
    </div>
  );
}
