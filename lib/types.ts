// ─── Training Session ───────────────────────────────────────────────────────

export interface TrainingSession {
  id: string;
  date: string;
  gym: string;
  duration: number; // minutes
  gi: boolean;
  intensity: number; // 1–5
  positions: string[];
  submissionsGiven: string[];    // submissions you applied
  submissionsReceived: string[]; // submissions you received
  /** @deprecated use submissionsGiven */
  submissions?: string[];
  notes: string;
  whatWorked: string;
  whatDidntWork: string;
  focus: string;
  scheduleId?: string; // linked schedule template if logged from one
}

// ─── Recurring Schedule ───────────────────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_NAMES_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export interface Schedule {
  id: string;
  name: string;         // e.g. "Tuesday Evening No-Gi"
  dayOfWeek: DayOfWeek;
  time: string;         // "18:00"
  duration: number;     // minutes
  gi: boolean;
  gym: string;
  active: boolean;
}

export interface CheckIn {
  id: string;
  scheduleId: string;
  date: string;         // ISO date of that specific occurrence
  attended: boolean;
  sessionId?: string;   // linked TrainingSession id if attended
}

export const POSITIONS = [
  "Closed Guard",
  "Open Guard",
  "Half Guard",
  "Mount",
  "Side Control",
  "Back Control",
  "Turtle",
  "Leg Entanglement",
] as const;

export const SUBMISSIONS = [
  "Armbar",
  "Triangle",
  "RNC",
  "Kimura",
  "Guillotine",
  "Heel Hook",
  "Rear Naked Choke",
  "D'Arce",
  "Anaconda",
  "Other",
] as const;

// ─── Belt System ─────────────────────────────────────────────────────────────

export type Belt = "white" | "blue" | "purple" | "brown" | "black";

export const BELT_ORDER: Belt[] = ["white", "blue", "purple", "brown", "black"];

export const BELT_LABELS: Record<Belt, string> = {
  white: "White Belt",
  blue: "Blue Belt",
  purple: "Purple Belt",
  brown: "Brown Belt",
  black: "Black Belt",
};

export const BELT_COLORS: Record<Belt, { bg: string; text: string; border: string }> = {
  white: { bg: "bg-zinc-100", text: "text-zinc-900", border: "border-zinc-300" },
  blue: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  purple: { bg: "bg-purple-600", text: "text-white", border: "border-purple-500" },
  brown: { bg: "bg-amber-800", text: "text-white", border: "border-amber-700" },
  black: { bg: "bg-zinc-900", text: "text-white", border: "border-zinc-500" },
};

export interface BeltPromotion {
  id: string;
  date: string;
  fromBelt: Belt | null; // null for first entry
  toBelt: Belt;
  stripes: number; // stripes on new belt (0–4)
  gym: string;
  coachNote: string;
}

// ─── Tournament / Competition ─────────────────────────────────────────────────

export type MatchResult = "win" | "loss" | "draw";
export type FinishType = "submission" | "points" | "advantages" | "dq" | "forfeit" | "unknown";
export type OpponentLevel = "beginner" | "intermediate" | "advanced" | "unknown";

export interface Match {
  id: string;
  opponentName: string;
  opponentLevel: OpponentLevel;
  result: MatchResult;
  finishType: FinishType;
  submission: string; // if finishType === "submission"
  score: string; // e.g. "12-4"
  duration: number; // seconds, 0 = unknown
  notes: string;
}

export type Placement = "gold" | "silver" | "bronze" | "other" | "";

export const PLACEMENT_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  gold:   { label: "Gold",   emoji: "🥇", color: "text-amber-400",  bg: "bg-amber-400/10"  },
  silver: { label: "Silver", emoji: "🥈", color: "text-zinc-300",   bg: "bg-zinc-300/10"   },
  bronze: { label: "Bronze", emoji: "🥉", color: "text-orange-400", bg: "bg-orange-400/10" },
  other:  { label: "Other",  emoji: "🏅", color: "text-zinc-500",   bg: "bg-zinc-500/10"   },
  "":     { label: "—",      emoji: "",   color: "text-zinc-600",   bg: ""                 },
};

/** Safe lookup — handles old string values like "Gold", "Silver" stored in localStorage */
export function getPlacementCfg(placement: string) {
  const key = placement.toLowerCase() as Placement;
  return PLACEMENT_CONFIG[key] ?? null;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  weightClass: string;
  gi: boolean;
  matches: Match[];
  notes: string;
  placement: Placement;
}
