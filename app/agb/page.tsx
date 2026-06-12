"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Allgemeine Geschäftsbedingungen</h1>
      <p className="text-xs text-zinc-600 mb-6">Stand: [Datum einsetzen]</p>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <strong>Prototyp</strong> — Diese AGB sind noch nicht vollständig und nicht rechtsverbindlich. Bitte vor dem offiziellen Launch von einem Anwalt oder über eRecht24 erstellen lassen.
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 1 Geltungsbereich</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Diese AGB gelten für die Nutzung der App „Grapplr" und alle damit verbundenen Dienste, angeboten von [Dein Name], [Adresse].
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 2 Leistungsbeschreibung</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Grapplr ist eine digitale Trainings-Tracking-App für Brazilian Jiu-Jitsu. Es gibt eine kostenlose Version sowie ein Premium-Abonnement für 5,00 € / Monat mit erweiterten Funktionen.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 3 Vertragsschluss & Abonnement</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Das Premium-Abonnement beginnt mit erfolgreicher Zahlung und läuft monatlich. Es verlängert sich automatisch, sofern es nicht vor Ablauf der Laufzeit gekündigt wird. Die Kündigung kann jederzeit zum Ende des laufenden Abrechnungszeitraums über den Stripe-Kundenbereich erfolgen.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 4 Preise & Zahlung</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Die Zahlung erfolgt über Stripe (Kreditkarte, SEPA-Lastschrift oder PayPal).
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 5 Widerrufsrecht</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Dir steht ein gesetzliches Widerrufsrecht zu. Näheres entnimmst du der <Link href="/widerruf" className="text-red-400 hover:text-red-300">Widerrufsbelehrung</Link>.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 6 Haftung</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Die Haftung für leicht fahrlässige Verletzung unwesentlicher Vertragspflichten ist ausgeschlossen, soweit keine Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit entstehen.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">§ 7 Anwendbares Recht</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Es gilt das Recht der Bundesrepublik Deutschland.
          </p>
        </section>
      </div>
    </div>
  );
}
