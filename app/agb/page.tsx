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

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Allgemeine Geschäftsbedingungen</h1>
      <p className="text-xs text-zinc-600 mb-8">für die Nutzung von {APP_NAME}</p>

      <div className="space-y-7">
        <Section title="1. Geltungsbereich & Anbieter">
          <p>Diese AGB gelten für die Nutzung des Dienstes {APP_NAME}, betrieben von {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city} ({OPERATOR.email}). Abweichenden Bedingungen wird widersprochen.</p>
        </Section>

        <Section title="2. Leistungsbeschreibung">
          <p>{APP_NAME} ist eine Anwendung zum Erfassen und Auswerten von BJJ-/Grappling-Training sowie zur Organisation von Gyms und Trainingsgruppen (Stundenplan, Anwesenheit, Mitgliederverwaltung). Der Funktionsumfang kann sich weiterentwickeln.</p>
        </Section>

        <Section title="3. Konto & Registrierung">
          <p>Für die Nutzung ist ein Konto erforderlich. Du bist für die Geheimhaltung deiner Zugangsdaten verantwortlich und versicherst, wahrheitsgemäße Angaben zu machen. Das Mindestalter beträgt 16 Jahre; Minderjährige benötigen die Zustimmung der Erziehungsberechtigten.</p>
        </Section>

        <Section title="4. Preise & Abonnements">
          <p>Es gibt einen kostenlosen Basiszugang sowie kostenpflichtige Abonnements: <strong className="text-zinc-300">Pro</strong> (5&nbsp;€/Monat) und <strong className="text-zinc-300">Gym</strong> (29&nbsp;€/Monat). Alle Preise verstehen sich inkl. ggf. anfallender gesetzlicher Umsatzsteuer.</p>
          <p>Abonnements verlängern sich automatisch monatlich, bis sie gekündigt werden.</p>
        </Section>

        <Section title="5. Zahlung">
          <p>Die Zahlungsabwicklung erfolgt über den Dienstleister Stripe. Mit Abschluss eines kostenpflichtigen Abos ermächtigst du den Einzug der jeweiligen Gebühr zu Beginn jeder Abrechnungsperiode.</p>
        </Section>

        <Section title="6. Laufzeit & Kündigung">
          <p>Abonnements können jederzeit zum Ende der laufenden Abrechnungsperiode gekündigt werden (in den Kontoeinstellungen bzw. über das Stripe-Kundenportal). Bereits gezahlte Beträge für die laufende Periode werden nicht anteilig erstattet. Das gesetzliche Widerrufsrecht (siehe Widerrufsbelehrung) bleibt unberührt.</p>
        </Section>

        <Section title="7. Pflichten der Nutzer">
          <p>Du verpflichtest dich, den Dienst nicht missbräuchlich zu nutzen, keine rechtswidrigen Inhalte einzustellen und Rechte Dritter zu wahren. Wir können Konten bei schwerwiegenden Verstößen sperren.</p>
        </Section>

        <Section title="8. Verfügbarkeit">
          <p>Wir bemühen uns um eine hohe Verfügbarkeit, schulden diese jedoch nicht zu jeder Zeit. Wartungsarbeiten, Störungen oder Ausfälle von Drittanbietern können die Nutzung vorübergehend einschränken.</p>
        </Section>

        <Section title="9. Haftung">
          <p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, typischen Schaden. Die Trainings- und Gesundheitsdaten dienen nur der Selbstorganisation und ersetzen keine medizinische oder sportliche Beratung.</p>
        </Section>

        <Section title="10. Änderungen der AGB">
          <p>Wir können diese AGB mit Wirkung für die Zukunft ändern. Über wesentliche Änderungen informieren wir rechtzeitig; widersprichst du nicht, gelten sie als angenommen.</p>
        </Section>

        <Section title="11. Schlussbestimmungen">
          <p>Es gilt deutsches Recht. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.</p>
        </Section>

        <p className="text-[11px] text-zinc-700 pt-2">Stand: {LEGAL_UPDATED}</p>
      </div>
    </div>
  );
}
