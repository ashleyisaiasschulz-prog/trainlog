"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Impressum</h1>
      <p className="text-xs text-zinc-600 mb-6">Angaben gemäß § 5 TMG</p>

      {/* Prototype banner */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <strong>Prototyp</strong> — Diese Angaben sind noch nicht vollständig und nicht rechtsverbindlich. Bitte vervollständige sie vor dem offiziellen Launch.
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Betreiber</p>
          <p className="text-zinc-300">[Dein vollständiger Name]</p>
          <p className="text-zinc-500">[Straße und Hausnummer]</p>
          <p className="text-zinc-500">[PLZ] [Ort], Deutschland</p>
        </section>

        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Kontakt</p>
          <p className="text-zinc-500">E-Mail: 20asherhd02@gmail.com</p>
        </section>

        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</p>
          <p className="text-zinc-300">[Dein vollständiger Name]</p>
          <p className="text-zinc-500">[Adresse wie oben]</p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Haftungsausschluss</p>
          <p className="text-zinc-600 leading-relaxed text-xs">
            Die Inhalte dieser App wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
