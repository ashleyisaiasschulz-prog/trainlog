"use client";
import { randomId } from "@/lib/id";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { Tournament, Match, MatchResult, FinishType, OpponentLevel, SUBMISSIONS, Placement, PLACEMENT_CONFIG } from "@/lib/types";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import Link from "next/link";


function defaultMatch(): Match {
  return {
    id: randomId(),
    opponentName: "",
    opponentLevel: "unknown",
    result: "win",
    finishType: "submission",
    submission: "",
    score: "",
    duration: 0,
    notes: "",
  };
}

function defaultTournament(): Omit<Tournament, "id"> {
  return {
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    weightClass: "",
    gi: true,
    matches: [],
    notes: "",
    placement: "",
  };
}

const RESULT_OPTIONS: { value: MatchResult; label: string; color: string }[] = [
  { value: "win", label: "Win", color: "bg-green-600 text-white" },
  { value: "loss", label: "Loss", color: "bg-red-700 text-white" },
  { value: "draw", label: "Draw", color: "bg-zinc-600 text-white" },
];

const FINISH_OPTIONS: { value: FinishType; label: string }[] = [
  { value: "submission", label: "Submission" },
  { value: "points", label: "Points" },
  { value: "advantages", label: "Advantages" },
  { value: "dq", label: "DQ" },
  { value: "forfeit", label: "Forfeit" },
  { value: "unknown", label: "Unknown" },
];

const LEVEL_OPTIONS: { value: OpponentLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "unknown", label: "Unknown" },
];

export default function AddTournamentPage() {
  const router = useRouter();
  const { addTournament } = useTrainingStore();
  const [form, setForm] = useState(defaultTournament());
  const [saved, setSaved] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addMatch = () => {
    const m = defaultMatch();
    setF("matches", [...form.matches, m]);
    setExpandedMatch(m.id);
  };

  const updateMatch = (id: string, key: keyof Match, value: unknown) => {
    setF(
      "matches",
      form.matches.map((m) => (m.id === id ? { ...m, [key]: value } : m))
    );
  };

  const removeMatch = (id: string) => {
    setF("matches", form.matches.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTournament({ ...form, id: randomId() });
    setSaved(true);
    setTimeout(() => router.push("/tournaments"), 600);
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tournaments" className="text-zinc-400 hover:text-white">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-black text-white">Log Tournament</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tournament info */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
            Tournament Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setF("name", e.target.value)}
            placeholder="e.g. IBJJF Pan Championship"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setF("date", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setF("location", e.target.value)}
              placeholder="City, Country"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Weight Class</label>
            <input
              type="text"
              value={form.weightClass}
              onChange={(e) => setF("weightClass", e.target.value)}
              placeholder="e.g. -76kg"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Placement</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["gold", "silver", "bronze", "other"] as Placement[]).map((p) => {
                const cfg = PLACEMENT_CONFIG[p];
                return (
                  <button key={p} type="button" onClick={() => setF("placement", form.placement === p ? "" : p)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      form.placement === p
                        ? `${cfg.bg} ${cfg.color} ring-1 ring-current`
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                    }`}>
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gi / No-Gi */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Rule Set</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setF("gi", true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${form.gi ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              Gi
            </button>
            <button
              type="button"
              onClick={() => setF("gi", false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${!form.gi ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              No-Gi
            </button>
          </div>
        </div>

        {/* Matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Matches</label>
            <button
              type="button"
              onClick={addMatch}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors"
            >
              <Plus size={15} /> Add Match
            </button>
          </div>

          <div className="space-y-3">
            {form.matches.map((match, idx) => {
              const isExpanded = expandedMatch === match.id;
              return (
                <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  {/* Match header */}
                  <button
                    type="button"
                    onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        match.result === "win"
                          ? "bg-green-900/50 text-green-400"
                          : match.result === "loss"
                          ? "bg-red-900/50 text-red-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {match.result.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-white flex-1">
                      Match {idx + 1}
                      {match.opponentName && ` · vs ${match.opponentName}`}
                    </span>
                    <span className="text-xs text-zinc-600">{match.finishType}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeMatch(match.id); }}
                      className="text-zinc-700 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>

                  {/* Expanded match fields */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-4">
                      {/* Result */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-2">Result</label>
                        <div className="flex gap-2">
                          {RESULT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateMatch(match.id, "result", opt.value)}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                match.result === opt.value ? opt.color : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Finish type */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-2">How</label>
                        <div className="flex flex-wrap gap-2">
                          {FINISH_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateMatch(match.id, "finishType", opt.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                match.finishType === opt.value
                                  ? "bg-red-600 text-white"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submission select */}
                      {match.finishType === "submission" && (
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 block mb-2">Submission</label>
                          <div className="flex flex-wrap gap-2">
                            {SUBMISSIONS.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => updateMatch(match.id, "submission", sub)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                  match.submission === sub ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Opponent + Score row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Opponent</label>
                          <input
                            type="text"
                            value={match.opponentName}
                            onChange={(e) => updateMatch(match.id, "opponentName", e.target.value)}
                            placeholder="Name (optional)"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Score</label>
                          <input
                            type="text"
                            value={match.score}
                            onChange={(e) => updateMatch(match.id, "score", e.target.value)}
                            placeholder="e.g. 12-4"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>

                      {/* Opponent level */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-2">Opponent Level</label>
                        <div className="flex gap-2">
                          {LEVEL_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateMatch(match.id, "opponentLevel", opt.value)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                match.opponentLevel === opt.value
                                  ? "bg-zinc-600 text-white"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Notes</label>
                        <textarea
                          value={match.notes}
                          onChange={(e) => updateMatch(match.id, "notes", e.target.value)}
                          placeholder="What happened in this match?"
                          rows={2}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall notes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Tournament Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setF("notes", e.target.value)}
            placeholder="Overall reflections, how it went..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saved}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            saved ? "bg-green-600 text-white" : "bg-red-600 hover:bg-red-500 text-white active:scale-[0.98]"
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={20} /> Saved!
            </span>
          ) : (
            "Save Tournament"
          )}
        </button>
      </form>
    </div>
  );
}
