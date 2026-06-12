"use client";

import { useParams, useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/useTrainingStore";
import { format } from "date-fns";
import { ArrowLeft, Clock, Zap, Trash2, Swords, Shield, Pencil, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useToastStore } from "@/store/useToastStore";
import { useT } from "@/lib/i18n";

const INTENSITY_LABEL = ["", "Light", "Easy", "Medium", "Hard", "Beast Mode"];
const INTENSITY_COLOR = ["", "text-emerald-400", "text-lime-400", "text-amber-400", "text-orange-400", "text-red-400"];
const INTENSITY_DOT   = ["", "bg-emerald-500", "bg-lime-500", "bg-amber-400", "bg-orange-500", "bg-red-500"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function TagList({ items, color = "default" }: { items: string[]; color?: "green" | "red" | "default" }) {
  const cls = color === "green"
    ? "bg-emerald-500/10 text-emerald-400"
    : color === "red"
    ? "bg-red-500/10 text-red-400"
    : "bg-zinc-800 text-zinc-400";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-lg ${cls}`}>{item}</span>
      ))}
    </div>
  );
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getSession, deleteSession } = useTrainingStore();
  const toast = useToastStore();
  const t = useT();
  const session = getSession(id as string);

  if (!session) return (
    <div className="page flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 text-sm">
      Session not found.
    </div>
  );

  const handleDelete = () => {
    if (confirm("Delete this session?")) {
      deleteSession(session.id);
      toast.show(t.sessionDeleted, "error");
      router.push("/dashboard");
    }
  };

  const d = new Date(session.date + "T12:00:00");
  const given    = session.submissionsGiven ?? session.submissions ?? [];
  const received = session.submissionsReceived ?? [];
  const sweepsGiven    = session.sweepsGiven ?? [];
  const sweepsReceived = session.sweepsReceived ?? [];
  const escapesGiven    = session.escapesGiven ?? [];
  const escapesReceived = session.escapesReceived ?? [];

  return (
    <div className="px-4 pt-5 pb-28 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/add?edit=${session.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
            <Pencil size={15} />
          </Link>
          <button onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Title block ── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            session.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
          }`}>
            {session.gi ? "Gi" : "No-Gi"}
          </span>
          {session.gym && <span className="text-xs text-zinc-500">{session.gym}</span>}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          {format(d, "EEEE, MMMM d")}
        </h1>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-zinc-600" />
            {session.duration} min
          </span>
          <span className={`flex items-center gap-1.5 ${INTENSITY_COLOR[session.intensity]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${INTENSITY_DOT[session.intensity]}`} />
            {INTENSITY_LABEL[session.intensity]}
          </span>
        </div>
      </div>

      {/* ── Positions ── */}
      {session.positions.length > 0 && (
        <Section title="Positions Worked">
          <TagList items={session.positions} />
        </Section>
      )}

      {/* ── Submissions ── */}
      {(given.length > 0 || received.length > 0) && (
        <Section title="Submissions">
          {given.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Swords size={12} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-500">You tapped them</span>
              </div>
              <TagList items={given} color="green" />
            </div>
          )}
          {given.length > 0 && received.length > 0 && <div className="h-px bg-zinc-800" />}
          {received.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-red-500" />
                <span className="text-[11px] font-semibold text-red-500">You got tapped</span>
              </div>
              <TagList items={received} color="red" />
            </div>
          )}
        </Section>
      )}

      {/* ── Sweeps ── */}
      {(sweepsGiven.length > 0 || sweepsReceived.length > 0) && (
        <Section title="Sweeps">
          {sweepsGiven.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-blue-400" />
                <span className="text-[11px] font-semibold text-blue-400">You swept them</span>
              </div>
              <TagList items={sweepsGiven} color="default" />
            </div>
          )}
          {sweepsGiven.length > 0 && sweepsReceived.length > 0 && <div className="h-px bg-zinc-800" />}
          {sweepsReceived.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-orange-400 rotate-180" />
                <span className="text-[11px] font-semibold text-orange-400">They swept you</span>
              </div>
              <TagList items={sweepsReceived} color="default" />
            </div>
          )}
        </Section>
      )}

      {/* ── Escapes ── */}
      {(escapesGiven.length > 0 || escapesReceived.length > 0) && (
        <Section title="Escapes">
          {escapesGiven.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-400">You escaped</span>
              </div>
              <TagList items={escapesGiven} color="default" />
            </div>
          )}
          {escapesGiven.length > 0 && escapesReceived.length > 0 && <div className="h-px bg-zinc-800" />}
          {escapesReceived.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-pink-400" />
                <span className="text-[11px] font-semibold text-pink-400">They escaped from you</span>
              </div>
              <TagList items={escapesReceived} color="default" />
            </div>
          )}
        </Section>
      )}

      {/* ── Notes ── */}
      {session.notes && (
        <Section title="Notes">
          <p className="text-sm text-zinc-300 leading-relaxed">{session.notes}</p>
        </Section>
      )}

      {/* ── Reflection ── */}
      {(session.whatWorked || session.whatDidntWork || session.focus) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Reflection</p>
          {session.whatWorked && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-400 mb-1.5">✓ What worked</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{session.whatWorked}</p>
            </div>
          )}
          {session.whatDidntWork && (
            <div>
              <div className="h-px bg-zinc-800 mb-3" />
              <p className="text-[11px] font-semibold text-red-400 mb-1.5">✗ What didn&apos;t work</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{session.whatDidntWork}</p>
            </div>
          )}
          {session.focus && (
            <div>
              <div className="h-px bg-zinc-800 mb-3" />
              <p className="text-[11px] font-semibold text-blue-400 mb-1.5">→ Focus next session</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{session.focus}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
