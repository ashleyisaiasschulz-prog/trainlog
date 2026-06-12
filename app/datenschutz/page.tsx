"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Datenschutzerklärung</h1>
      <p className="text-xs text-zinc-600 mb-6">Gemäß DSGVO & BDSG</p>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <strong>Prototyp</strong> — Diese Datenschutzerklärung ist noch nicht vollständig und nicht rechtsverbindlich. Vor dem offiziellen Launch mit einem Anwalt oder Generator (z. B. eRecht24) vervollständigen.
        </p>
      </div>

      <div className="space-y-6 text-sm">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">1. Verantwortlicher</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Verantwortlich im Sinne der DSGVO ist: [Dein Name], [Adresse], 20asherhd02@gmail.com
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">2. Erhobene Daten</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Wir erheben bei der Registrierung: E-Mail-Adresse, Benutzername und Trainingsdata (Gürtel, Sessions, Turniere). Diese Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">3. Drittanbieter</p>
          <div className="text-zinc-500 text-xs leading-relaxed space-y-1">
            <p><strong className="text-zinc-400">Supabase</strong> (Supabase Inc., USA) — Datenbank & Authentifizierung. Daten werden auf EU-Servern gespeichert.</p>
            <p><strong className="text-zinc-400">Stripe</strong> (Stripe Inc., USA) — Zahlungsabwicklung. Zahlungsdaten werden ausschließlich von Stripe verarbeitet und niemals auf unseren Servern gespeichert.</p>
            <p><strong className="text-zinc-400">Vercel</strong> (Vercel Inc., USA) — Hosting. Serverstandorte in der EU verfügbar.</p>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">4. Deine Rechte</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. Kontakt: 20asherhd02@gmail.com
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">5. Kontakt & Beschwerden</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Bei Fragen zum Datenschutz wende dich an: 20asherhd02@gmail.com<br />
            Du hast das Recht, dich bei der zuständigen Aufsichtsbehörde zu beschweren.
          </p>
        </section>
      </div>
    </div>
  );
}
