"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, MapPin, Navigation, CalendarDays, Loader2, Check, Users } from "lucide-react";
import { format } from "date-fns";

interface OpenMat {
  id: string; gym_name: string | null; title: string; date: string;
  time: string | null; gi: boolean; notes: string | null;
  address: string | null; country: string | null; lat: number | null; lng: number | null;
}

// Haversine distance in km
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const RADII = [25, 50, 100, 250];

export default function OpenMatsPage() {
  const sb = createClient();
  const { user } = useAuthStore();
  const [mats, setMats]       = useState<OpenMat[]>([]);
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const [mine, setMine]       = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string>("all");
  const [radius, setRadius]   = useState<number | null>(null);
  const [me, setMe]           = useState<{ lat: number; lng: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr]   = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const loadRsvps = async (ids: string[]) => {
    if (ids.length === 0) { setCounts({}); setMine(new Set()); return; }
    const { data } = await sb.from("open_mat_rsvps").select("open_mat_id, user_id").in("open_mat_id", ids);
    const c: Record<string, number> = {};
    const m = new Set<string>();
    (data ?? []).forEach((r: any) => {
      c[r.open_mat_id] = (c[r.open_mat_id] ?? 0) + 1;
      if (r.user_id === user?.id) m.add(r.open_mat_id);
    });
    setCounts(c); setMine(m);
  };

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("open_mats").select("*").gte("date", today).order("date", { ascending: true });
      const rows = (data as OpenMat[]) ?? [];
      setMats(rows);
      await loadRsvps(rows.map(r => r.id));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleRsvp = async (id: string) => {
    if (!user) return;
    if (mine.has(id)) {
      await sb.from("open_mat_rsvps").delete().eq("open_mat_id", id).eq("user_id", user.id);
      setMine(prev => { const n = new Set(prev); n.delete(id); return n; });
      setCounts(c => ({ ...c, [id]: Math.max(0, (c[id] ?? 1) - 1) }));
    } else {
      await sb.from("open_mat_rsvps").insert({ open_mat_id: id, user_id: user.id });
      setMine(prev => new Set(prev).add(id));
      setCounts(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    }
  };

  const countries = useMemo(
    () => Array.from(new Set(mats.map(m => m.country).filter(Boolean))).sort() as string[],
    [mats]
  );

  const locate = () => {
    if (!navigator.geolocation) { setGeoErr("Location not supported"); return; }
    setGeoBusy(true); setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      pos => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setRadius(50); setGeoBusy(false); },
      () => { setGeoErr("Couldn't get your location"); setGeoBusy(false); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const list = useMemo(() => {
    let rows = mats.map(m => ({
      m,
      dist: me && m.lat != null && m.lng != null ? distanceKm(me, { lat: m.lat, lng: m.lng }) : null,
    }));
    if (country !== "all") rows = rows.filter(r => r.m.country === country);
    if (me && radius) rows = rows.filter(r => r.dist != null && r.dist <= radius);
    if (me) rows.sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));
    return rows;
  }, [mats, country, me, radius]);

  return (
    <div className="px-4 pt-5 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Open Mats</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Find open mats near you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600">
          <option value="all">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={locate} disabled={geoBusy}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            me ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}>
          {geoBusy ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
          {me ? "Near me" : "Use location"}
        </button>
      </div>

      {/* Radius pills (only with location) */}
      {me && (
        <div className="flex gap-1.5">
          {RADII.map(r => (
            <button key={r} onClick={() => setRadius(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                radius === r ? "bg-zinc-700 text-zinc-100" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
              }`}>{r} km</button>
          ))}
          <button onClick={() => setRadius(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              radius === null ? "bg-zinc-700 text-zinc-100" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
            }`}>Any</button>
        </div>
      )}
      {geoErr && <p className="text-xs text-amber-400">{geoErr}</p>}

      {/* List */}
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="animate-spin text-zinc-500 mx-auto" /></div>
      ) : list.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <CalendarDays size={28} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-400">No open mats found</p>
          <p className="text-xs text-zinc-600 mt-1">Try a wider radius or another country.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map(({ m, dist }) => (
            <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">{m.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${m.gi ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>
                      {m.gi ? "Gi" : "No-Gi"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{m.gym_name}</p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <CalendarDays size={11} />
                    {format(new Date(m.date + "T12:00:00"), "EEE, MMM d")}{m.time && ` · ${m.time.slice(0, 5)}`}
                  </p>
                  {m.address && (
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-start gap-1">
                      <MapPin size={11} className="mt-0.5 shrink-0" /> {m.address}
                    </p>
                  )}
                  {m.notes && <p className="text-xs text-zinc-400 mt-1.5">{m.notes}</p>}
                </div>
                {dist != null && (
                  <span className="text-[11px] font-semibold text-red-400 shrink-0">{Math.round(dist)} km</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                <button onClick={() => toggleRsvp(m.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    mine.has(m.id) ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}>
                  <Check size={13}/> {mine.has(m.id) ? "I'm going" : "I'll be there"}
                </button>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1 shrink-0">
                  <Users size={12}/> {counts[m.id] ?? 0} going
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
