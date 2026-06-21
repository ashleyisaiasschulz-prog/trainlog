"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, Shield, LogIn, UserPlus, Sun, Moon, Pencil, Check, X, Bell, BellOff, TrendingUp, Zap, Swords, HelpCircle, Tags, ChevronRight, Crown, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useLang } from "@/components/LangProvider";
import Avatar, { ageFrom } from "@/components/Avatar";

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { status: pushStatus, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const { trackSubmissions, trackSweeps, trackEscapes, setTrackSubmissions, setTrackSweeps, setTrackEscapes } = usePrefsStore();
  const { lang, setLang } = useLang();
  const sb = createClient();
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGym, setEditGym]   = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
    if (!upErr) {
      const { data } = sb.storage.from("avatars").getPublicUrl(path);
      await sb.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      await refreshProfile();
    }
    setUploading(false);
  };
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  const manageSubscription = async () => {
    if (!user) return;
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setBillingError(data.error ?? "Could not open billing portal"); setBillingLoading(false); }
    } catch {
      setBillingError("Network error"); setBillingLoading(false);
    }
  };

  const startUpgrade = async () => {
    if (!user) return;
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setBillingError(data.error ?? "Could not start checkout"); setBillingLoading(false); }
    } catch {
      setBillingError("Network error"); setBillingLoading(false);
    }
  };

  const togglePrivacy = async (field: "share_stats" | "share_belt" | "share_sessions") => {
    if (!user || !profile) return;
    setSaving(true);
    await sb.from("profiles").update({ [field]: !profile[field] }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
  };

  const startEditProfile = () => {
    setEditName(profile?.display_name || "");
    setEditGym(profile?.gym || "");
    setEditBirthdate((profile as any)?.birthdate || "");
    setEditPhone((profile as any)?.phone || "");
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await sb.from("profiles").update({
      display_name: editName.trim() || null,
      gym: editGym.trim() || null,
      birthdate: editBirthdate || null,
      phone: editPhone.trim() || null,
    }).eq("id", user.id);
    await refreshProfile();
    setEditingProfile(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Not logged in
  if (!user) {
    return (
      <div className="px-4 pt-5 pb-28 space-y-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Account</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <div className="text-3xl">🥋</div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Connect with your gym</p>
            <p className="text-xs text-zinc-500 mt-1">Sign in to add friends, join groups, and share your progress.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <LogIn size={15}/> Sign In
            </Link>
            <Link href="/register" className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <UserPlus size={15}/> Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const privacyItems = [
    { field: "share_belt" as const,     label: "Share belt rank",   desc: "Friends can see your belt & stripes" },
    { field: "share_stats" as const,    label: "Share statistics",  desc: "Friends can view your training stats" },
    { field: "share_sessions" as const, label: "Share with groups", desc: "Trainers see your positions & submissions" },
  ];

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      <h1 className="text-xl font-bold tracking-tight text-zinc-100">Account</h1>

      {/* Profile card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {editingProfile ? (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Edit Profile</p>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Full name (first &amp; last)</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Max Mustermann"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Gym / Academy</label>
              <input
                type="text"
                value={editGym}
                onChange={e => setEditGym(e.target.value)}
                placeholder="Your gym name"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Date of birth</label>
              <input
                type="date"
                value={editBirthdate}
                onChange={e => setEditBirthdate(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Phone <span className="text-zinc-700">· only your gym's coaches can see it</span></label>
              <input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+49 …"
                className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditingProfile(false)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <X size={14}/> Cancel
              </button>
              <button onClick={saveProfile} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <Check size={14}/> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer shrink-0">
              <Avatar url={(profile as any)?.avatar_url} name={profile?.display_name || profile?.username} belt={profile?.belt} size={56} />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border-2 border-zinc-900">
                {uploading ? <Loader2 size={10} className="text-white animate-spin" /> : <Pencil size={9} className="text-white" />}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
            </label>
            <div className="flex-1 min-w-0">
              {profile?.display_name ? (
                <p className="text-base font-bold text-zinc-100">{profile.display_name}</p>
              ) : (
                <button onClick={startEditProfile} className="text-base font-bold text-red-400">+ Add your name</button>
              )}
              <p className="text-xs text-zinc-500">
                @{profile?.username}
                {ageFrom((profile as any)?.birthdate) && <span> · {ageFrom((profile as any)?.birthdate)} yrs</span>}
              </p>
              {profile?.gym && <p className="text-xs text-zinc-500 mt-0.5">{profile.gym}</p>}
            </div>
            <button onClick={startEditProfile}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
              <Pencil size={15}/>
            </button>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Subscription</p>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${profile?.is_premium ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
            <Crown size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">
              {profile?.is_premium ? "Grapplr Pro" : "Free plan"}
            </p>
            <p className="text-xs text-zinc-600">
              {profile?.is_premium ? "Active · €5/mo" : "Upgrade for analytics, friends & tournaments"}
            </p>
          </div>
        </div>

        {billingError && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mt-3">{billingError}</p>
        )}

        {profile?.is_premium ? (
          <button onClick={manageSubscription} disabled={billingLoading}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {billingLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Manage subscription
          </button>
        ) : (
          <button onClick={startUpgrade} disabled={billingLoading}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {billingLoading ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-zinc-500"/>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Privacy</p>
        </div>
        {privacyItems.map(({ field, label, desc }) => {
          const on = profile?.[field];
          return (
            <button key={field} onClick={() => togglePrivacy(field)} disabled={saving}
              className="w-full flex items-center gap-3 text-left">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-600">{desc}</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-emerald-500" : "bg-zinc-700"}`}>
                <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}/>
              </div>
            </button>
          );
        })}
      </div>

      {/* Appearance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Appearance</p>
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 text-left">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-amber-100 text-amber-600"}`}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">{isDark ? "Dark Mode" : "Light Mode"}</p>
            <p className="text-xs text-zinc-600">Tap to switch appearance</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${isDark ? "bg-zinc-700" : "bg-amber-400"}`}>
            <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${isDark ? "translate-x-0.5" : "translate-x-5"}`} />
          </div>
        </button>
      </div>

      {/* Language */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Language / Sprache</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLang("en")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${lang === "en" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setLang("de")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${lang === "de" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
          >
            🇩🇪 Deutsch
          </button>
        </div>
      </div>

      {/* Notifications */}
      {pushStatus !== "unsupported" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Notifications</p>
          {pushStatus === "denied" ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                <BellOff size={18} className="text-zinc-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-400">Notifications blocked</p>
                <p className="text-xs text-zinc-600">Enable in browser settings to get training reminders</p>
              </div>
            </div>
          ) : (
            <button
              onClick={pushStatus === "granted" ? pushUnsubscribe : pushSubscribe}
              disabled={pushLoading}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                pushStatus === "granted" ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
              }`}>
                {pushStatus === "granted" ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">
                  {pushStatus === "granted" ? "Training Reminders On" : "Training Reminders"}
                </p>
                <p className="text-xs text-zinc-600">
                  {pushStatus === "granted"
                    ? "You'll get notified on training days"
                    : "Get notified when it's time to train"}
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                pushStatus === "granted" ? "bg-red-500" : "bg-zinc-700"
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                  pushStatus === "granted" ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Tracking */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Session Tracking</p>
        <p className="text-xs text-zinc-600 -mt-1">Choose what to log in each training session</p>
        {[
          { label: "Track Submissions", desc: "Log submissions given and received", icon: Swords, on: trackSubmissions, toggle: () => setTrackSubmissions(!trackSubmissions) },
          { label: "Track Sweeps", desc: "Log sweeps you hit and received", icon: TrendingUp, on: trackSweeps, toggle: () => setTrackSweeps(!trackSweeps) },
          { label: "Track Escapes", desc: "Log escapes you completed and allowed", icon: Zap, on: trackEscapes, toggle: () => setTrackEscapes(!trackEscapes) },
        ].map(({ label, desc, icon: Icon, on, toggle }) => (
          <button key={label} onClick={toggle} className="w-full flex items-center gap-3 text-left">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${on ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-500"}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-600">{desc}</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-red-500" : "bg-zinc-700"}`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>
        ))}

        {/* Customize tags */}
        <Link href="/account/customize" className="w-full flex items-center gap-3 text-left pt-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-zinc-800 text-zinc-400">
            <Tags size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">Customize Tags</p>
            <p className="text-xs text-zinc-600">Edit positions, submissions, sweeps, escapes & injuries</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600 shrink-0" />
        </Link>
      </div>

      {/* Support */}
      <a
        href="mailto:20asherhd02@gmail.com?subject=Grapplr%20Support"
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <HelpCircle size={15}/> Help & Support
      </a>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-red-400 font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors">
        <LogOut size={15}/> Sign Out
      </button>

      {/* Legal links */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 pb-2">
        {[
          { href: "/impressum",  label: "Impressum" },
          { href: "/datenschutz", label: "Datenschutz" },
          { href: "/agb",        label: "AGB" },
          { href: "/widerruf",   label: "Widerruf" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            {label}
          </Link>
        ))}
      </div>
      <p className="text-center text-[10px] text-zinc-800 pb-2">© {new Date().getFullYear()} Grapplr</p>
    </div>
  );
}
