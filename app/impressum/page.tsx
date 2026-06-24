"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OPERATOR, LEGAL_UPDATED } from "@/lib/legal";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Impressum</h1>
      <p className="text-xs text-zinc-600 mb-8">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</p>

      <div className="space-y-6 text-sm">
        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Diensteanbieter</p>
          <p className="text-zinc-300">{OPERATOR.name}</p>
          <p className="text-zinc-500">{OPERATOR.street}</p>
          <p className="text-zinc-500">{OPERATOR.city}, {OPERATOR.country}</p>
        </section>

        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Kontakt</p>
          <p className="text-zinc-500">E-Mail: {OPERATOR.email}</p>
          {OPERATOR.phone && <p className="text-zinc-500">Telefon: {OPERATOR.phone}</p>}
        </section>

        {OPERATOR.vatId && (
          <section className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Umsatzsteuer-ID</p>
            <p className="text-zinc-500">{OPERATOR.vatId}</p>
          </section>
        )}

        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</p>
          <p className="text-zinc-300">{OPERATOR.name}</p>
          <p className="text-zinc-500">{OPERATOR.street}, {OPERATOR.city}</p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">EU-Streitschlichtung</p>
          <p className="text-zinc-600 leading-relaxed text-xs">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-red-400">https://ec.europa.eu/consumers/odr/</a>.
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Haftung für Inhalte &amp; Links</p>
          <p className="text-zinc-600 leading-relaxed text-xs">
            Die Inhalte dieses Dienstes wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit
            und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. Für Inhalte externer Links sind
            ausschließlich deren Betreiber verantwortlich; zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
          </p>
        </section>

        <p className="text-[11px] text-zinc-700 pt-2">Stand: {LEGAL_UPDATED}</p>
      </div>
    </div>
  );
}
