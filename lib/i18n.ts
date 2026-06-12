import { useLang } from "@/components/LangProvider";

const translations = {
  en: {
    // Timer page
    timerReady: "ready",
    timerRunning: "running",
    timerPaused: "paused",
    timerDone: "Done!",
    timerRound: "Round",
    timerRounds: "Rounds",
    timerRoundTime: "Round Time",
    timerRest: "Rest",
    timerNoRest: "No Rest",
    timerSummary1: (rounds: number, rt: string) => `1 Round · ${rt}`,
    timerSummaryN: (rounds: number, rt: string, rest: string) => `${rounds} × ${rt}`,
    timerSummaryNRest: (rounds: number, rt: string, rest: string) => `${rounds} × ${rt} · ${rest} Rest`,
    timerSummaryNoRest: (rounds: number, rt: string) => `${rounds} × ${rt} · No Rest`,
    // Phase labels
    phaseDone: "Done",
    phaseRest: "Rest",
    phaseRound: "Round",
    // Floating timer
    floatRound: "Round",
    floatRest: "Rest",
    // Toast messages
    sessionSaved: "Session saved",
    sessionUpdated: "Session updated",
    sessionDeleted: "Session deleted",
    tournamentSaved: "Tournament saved",
    tournamentUpdated: "Tournament updated",
    tournamentDeleted: "Tournament deleted",
    // PremiumGate
    premiumTitle: "Premium Feature",
    premiumDesc: "Upgrade to Grapplr Premium to unlock this feature.",
    premiumLabel: "Grapplr Premium",
    premiumPrice: "5 €",
    premiumPer: "/ month",
    premiumFeatures: [
      "📊 Detailed Statistics & Charts",
      "🏆 Tournaments & Competition Tracking",
      "🤝 Friends & Sparring Records",
    ],
    premiumUpgrade: "Upgrade now →",
    premiumFooter: "Cancel anytime · Pay by card, SEPA or PayPal",
    premiumErrUnknown: "Unknown error",
    premiumErrNetwork: "Connection error",
    // Account page
    langLabel: "Language",
    langDesc: "Switch between English and German",
  },
  de: {
    // Timer page
    timerReady: "bereit",
    timerRunning: "läuft",
    timerPaused: "pausiert",
    timerDone: "Fertig!",
    timerRound: "Runde",
    timerRounds: "Runden",
    timerRoundTime: "Rundenzeit",
    timerRest: "Pause",
    timerNoRest: "Keine Pause",
    timerSummary1: (rounds: number, rt: string) => `1 Runde · ${rt}`,
    timerSummaryN: (rounds: number, rt: string, rest: string) => `${rounds} × ${rt}`,
    timerSummaryNRest: (rounds: number, rt: string, rest: string) => `${rounds} × ${rt} · ${rest} Pause`,
    timerSummaryNoRest: (rounds: number, rt: string) => `${rounds} × ${rt} · Keine Pause`,
    // Phase labels
    phaseDone: "Fertig",
    phaseRest: "Pause",
    phaseRound: "Runde",
    // Floating timer
    floatRound: "Runde",
    floatRest: "Pause",
    // Toast messages
    sessionSaved: "Session gespeichert",
    sessionUpdated: "Session aktualisiert",
    sessionDeleted: "Session gelöscht",
    tournamentSaved: "Turnier gespeichert",
    tournamentUpdated: "Turnier aktualisiert",
    tournamentDeleted: "Turnier gelöscht",
    // PremiumGate
    premiumTitle: "Premium Feature",
    premiumDesc: "Upgrade auf Grapplr Premium, um dieses Feature freizuschalten.",
    premiumLabel: "Grapplr Premium",
    premiumPrice: "5 €",
    premiumPer: "/ Monat",
    premiumFeatures: [
      "📊 Detaillierte Statistik-Charts",
      "🏆 Turniere & Wettkampf-Tracking",
      "🤝 Freunde & Sparring-Records",
    ],
    premiumUpgrade: "Jetzt upgraden →",
    premiumFooter: "Monatlich kündbar · Bezahlung via Kreditkarte, SEPA oder PayPal",
    premiumErrUnknown: "Unbekannter Fehler",
    premiumErrNetwork: "Verbindungsfehler",
    // Account page
    langLabel: "Sprache",
    langDesc: "Zwischen Englisch und Deutsch wechseln",
  },
} as const;

export type Translations = typeof translations.en;

export function useT(): Translations {
  const { lang } = useLang();
  return translations[lang] as unknown as Translations;
}
