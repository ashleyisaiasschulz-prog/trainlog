"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { useGymStore } from "@/store/useGymStore";
import { Building2, Plus, LogIn, ChevronRight, Hash, Crown, Loader2 } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string; name: string; description: string | null;
  gym: string | null; trainer_id: string; invite_code: string;
  is_gym?: boolean | null;
}

export default function GymsPage() {
  return <Suspense><GymsInner /></Suspense>;
}

function GymsInner() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gyms, setGyms]           = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]   = useState(false);
  const [code, setCode]           = useState("");
  const [gymName, setGymName]     = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const sb = createClient();

  const loadGyms = async () => {
    if (!user) return;
    const { data } = await sb
      .from("group_members")
      .select("groups(id,name,description,gym,trainer_id,invite_code,is_gym)")
      .eq("user_id", user.id);
    const all = (data?.map((d: any) => d.groups).filter(Boolean) ?? []) as Group[];
    const myGyms = all.filter(g => g.is_gym);
    setGyms(myGyms);
    // Cache ids so the nav can link straight to the gym (no redirect hop)
    useGymStore.getState().setGymIds(myGyms.map(g => g.id));
  };

  useEffect(() => { loadGyms(); }, [user]);

  // Auto-open create form via deep link (?create=gym)
  useEffect(() => {
    if (searchParams.get("create") === "gym") setShowCreate(true);
  }, [searchParams]);

  // With exactly one gym, the tab IS that gym → open it directly.
  // ?list=1 (e.g. from the gym's back button) keeps the list visible.
  useEffect(() => {
    if (searchParams.get("list")) return;
    if (searchParams.get("gym_session_id") || searchParams.get("create")) return;
    if (gyms.length === 1) router.replace(`/groups/${gyms[0].id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms]);

  // After gym checkout: confirm payment, create/activate the gym, then open it.
  useEffect(() => {
    const sid = searchParams.get("gym_session_id");
    if (!sid) return;
    setVerifying(true);
    (async () => {
      try {
        const res = await fetch("/api/stripe/verify-gym", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
        const data = await res.json();
        if (data.groupId) { router.replace(`/groups/${data.groupId}`); return; }
      } catch { /* ignore */ }
      router.replace("/groups");
      setVerifying(false);
      await loadGyms();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const createGym = async () => {
    if (!user || !gymName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/gym-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, gymName: gymName.trim() }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error ?? "Could not start checkout");
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const joinGym = async () => {
    if (!user || !code.trim()) return;
    setError("");
    const { data: result, error: err } = await sb.rpc("join_group", { p_code: code.trim() });
    if (err) { setError(err.message); return; }
    if (result === "not_found")      { setError("Invalid invite code"); return; }
    if (result === "already_member") { setError("You're already in this gym"); return; }
    setCode(""); setShowJoin(false);
    await loadGyms();
  };

  if (!user) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 size={40} className="text-zinc-700" />
        <p className="text-zinc-400 font-medium text-center">Sign in to access your gym</p>
        <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2">
          <LogIn size={16}/> Sign In
        </Link>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="px-4 pt-5 pb-28 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-red-400" size={28} />
        <p className="text-sm text-zinc-400">Activating your gym…</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Gym</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowJoin(v=>!v); setShowCreate(false); setError(""); }}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5">
            <Hash size={14}/> Join
          </button>
        </div>
      </div>

      {/* Join by code */}
      {showJoin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-100">Join your gym</p>
          <p className="text-xs text-zinc-500 -mt-1">Ask your coach for the invite code.</p>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123" maxLength={6}
              className="flex-1 bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 tracking-widest font-mono uppercase" />
            <button onClick={joinGym}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-3 rounded-xl text-sm">
              Join
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Gym list */}
      {gyms.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Building2 size={28} className="text-zinc-700 mx-auto mb-3"/>
          <p className="text-sm font-medium text-zinc-400">You're not in a gym yet</p>
          <p className="text-xs text-zinc-600 mt-1 mb-4">
            Join your gym with an invite code, or start your own.
          </p>
          <button onClick={() => setShowJoin(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-1.5">
            <Hash size={14}/> Join with code
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gyms.map(g => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 active:scale-[0.985] transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-base shrink-0">
                  {g.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{g.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {g.gym && `${g.gym} · `}Code: <span className="font-mono text-zinc-400">{g.invite_code}</span>
                  </p>
                </div>
                {g.trainer_id === user.id && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">Owner</span>
                )}
                <ChevronRight size={15} className="text-zinc-700 shrink-0"/>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Run a gym? — create flow (immediate payment) */}
      <div className="pt-2">
        {!showCreate ? (
          <button onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="w-full bg-gradient-to-r from-amber-500/15 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100">Run a gym?</p>
              <p className="text-xs text-zinc-500">Schedule classes, QR check-in, coaches & analytics</p>
            </div>
            <span className="text-xs font-bold text-amber-400 shrink-0">€29/mo</span>
          </button>
        ) : (
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-400" />
              <p className="text-sm font-semibold text-zinc-100">Start your gym</p>
            </div>
            <p className="text-xs text-zinc-500 -mt-1">€29/mo · cancel anytime. You'll be redirected to checkout.</p>
            <input value={gymName} onChange={e => setGymName(e.target.value)}
              placeholder="Gym name (e.g. Alliance Berlin)"
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowCreate(false); setError(""); }}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 text-sm font-medium">Cancel</button>
              <button onClick={createGym} disabled={!gymName.trim() || loading}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <>Continue to payment</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
