"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OPERATOR, APP_NAME, LEGAL_UPDATED } from "@/lib/legal";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{title}</p>
      <div className="text-xs text-zinc-500 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Datenschutzerklärung</h1>
      <p className="text-xs text-zinc-600 mb-8">Informationen gemäß Art. 13 DSGVO</p>

      <div className="space-y-7">
        <Section title="1. Verantwortlicher">
          <p>{OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}, {OPERATOR.country}. E-Mail: {OPERATOR.email}.</p>
        </Section>

        <Section title="2. Welche Daten wir verarbeiten">
          <p><strong className="text-zinc-300">Konto:</strong> E-Mail-Adresse, Benutzername, Anzeigename, Passwort (verschlüsselt). Freiwillig: Profilbild, Geburtsdatum, Telefonnummer, Gym/Verein, Gurtgrad.</p>
          <p><strong className="text-zinc-300">Trainingsdaten:</strong> von dir erfasste Sessions, Positionen, Techniken, Verletzungen, Notizen, Wettkämpfe, Anwesenheiten.</p>
          <p><strong className="text-zinc-300">Gym/Gruppen:</strong> Mitgliedschaften, Anmeldungen zu Klassen, Check-ins, Coach-Notizen.</p>
          <p><strong className="text-zinc-300">Technisch:</strong> beim Aufruf werden durch den Hosting-Anbieter Server-Logdaten (IP-Adresse, Zeitpunkt, abgerufene Ressource) verarbeitet.</p>
        </Section>

        <Section title="3. Zwecke & Rechtsgrundlagen">
          <p>Bereitstellung und Betrieb des Dienstes, Verwaltung deines Kontos und deiner Trainingsdaten sowie der Gym-Funktionen — Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
          <p>Abwicklung von Abonnements und Zahlungen — Art. 6 Abs. 1 lit. b DSGVO.</p>
          <p>Sicherer, stabiler Betrieb (Server-Logs) — Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>
        </Section>

        <Section title="4. Auftragsverarbeiter & Dienste">
          <p><strong className="text-zinc-300">Supabase</strong> (Datenbank, Authentifizierung, Speicher) — verarbeitet Konto- und Trainingsdaten in unserem Auftrag.</p>
          <p><strong className="text-zinc-300">Vercel</strong> (Hosting/Auslieferung der App) — verarbeitet technische Zugriffsdaten.</p>
          <p><strong className="text-zinc-300">Stripe</strong> (Zahlungsabwicklung) — verarbeitet Zahlungs- und Abodaten. Kartendaten werden direkt bei Stripe eingegeben und nicht von uns gespeichert.</p>
          <p>Mit diesen Anbietern bestehen Auftragsverarbeitungsverträge bzw. geeignete Garantien. Eine Übermittlung in Drittländer (z. B. USA) erfolgt auf Grundlage der EU-Standardvertragsklauseln.</p>
        </Section>

        <Section title="5. Cookies & lokale Speicherung">
          <p>{APP_NAME} verwendet keine Werbe- oder Tracking-Cookies. Für die Funktion (Login-Sitzung, Einstellungen, Offline-Daten) werden technisch notwendige Cookies bzw. der lokale Browser-Speicher (localStorage) genutzt — Art. 6 Abs. 1 lit. f DSGVO bzw. § 25 Abs. 2 TDDDG.</p>
        </Section>

        <Section title="6. Speicherdauer">
          <p>Wir speichern deine Daten, solange dein Konto besteht. Bei Löschung deines Kontos werden die zugehörigen personenbezogenen Daten gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten (z. B. steuerrechtlich für Rechnungsdaten) entgegenstehen.</p>
        </Section>

        <Section title="7. Deine Rechte">
          <p>Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Eine erteilte Einwilligung kannst du jederzeit widerrufen.</p>
          <p>Zur Ausübung genügt eine Nachricht an {OPERATOR.email}. Es besteht zudem ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.</p>
        </Section>

        <Section title="8. Kontolöschung">
          <p>Du kannst dein Konto und die damit verbundenen Daten jederzeit über die App oder per E-Mail an {OPERATOR.email} löschen lassen.</p>
        </Section>

        <p className="text-[11px] text-zinc-700 pt-2">Stand: {LEGAL_UPDATED}</p>
      </div>
    </div>
  );
}
