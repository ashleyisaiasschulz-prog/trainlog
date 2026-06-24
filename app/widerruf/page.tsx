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

export default function WiderrufPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 max-w-lg mx-auto">
      <Link href="/account" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="text-2xl font-black text-zinc-100 mb-2">Widerrufsbelehrung</h1>
      <p className="text-xs text-zinc-600 mb-8">für Verbraucher gemäß § 312g, § 355 BGB</p>

      <div className="space-y-7">
        <Section title="Widerrufsrecht">
          <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen den Vertrag über ein kostenpflichtiges Abonnement zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
          <p>Um dein Widerrufsrecht auszuüben, musst du uns ({OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}, E-Mail: {OPERATOR.email}) mittels einer eindeutigen Erklärung (z. B. E-Mail) über deinen Entschluss informieren. Zur Wahrung der Frist genügt die Absendung der Mitteilung vor Ablauf der Frist.</p>
        </Section>

        <Section title="Folgen des Widerrufs">
          <p>Wenn du den Vertrag widerrufst, erstatten wir dir alle erhaltenen Zahlungen unverzüglich und spätestens binnen vierzehn Tagen ab Eingang deines Widerrufs, über dasselbe Zahlungsmittel, das du eingesetzt hast. Es werden keine Entgelte für die Erstattung berechnet.</p>
        </Section>

        <Section title="Vorzeitiges Erlöschen bei digitalen Diensten">
          <p>Bei der Bereitstellung digitaler Dienstleistungen erlischt das Widerrufsrecht, wenn du ausdrücklich zugestimmt hast, dass wir vor Ablauf der Widerrufsfrist mit der Ausführung beginnen, und du bestätigt hast, dass du dein Widerrufsrecht damit verlierst. Beim Abschluss eines Abos und sofortiger Freischaltung der kostenpflichtigen Funktionen gilt diese Zustimmung als erteilt.</p>
        </Section>

        <Section title="Muster-Widerrufsformular">
          <p className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-400">
            An {OPERATOR.name}, {OPERATOR.email}:<br /><br />
            Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über das Abonnement von {APP_NAME}.<br /><br />
            – Bestellt am / Konto-E-Mail: ____________<br />
            – Name des/der Verbraucher(s): ____________<br />
            – Datum: ____________
          </p>
        </Section>

        <p className="text-[11px] text-zinc-700 pt-2">Stand: {LEGAL_UPDATED}</p>
      </div>
    </div>
  );
}
