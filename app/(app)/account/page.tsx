"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, Shield, LogIn, UserPlus, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useTheme();
  const sb = createClient();
  const [saving, setSaving] = useState(false);

  const togglePrivacy = async (field: "share_stats" | "share_belt" | "share_sessions") => {
    if (!user || !profile) return;
    setSaving(true);
    await sb.from("profiles").update({ [field]: !profile[field] }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
  };

  const toggleRole = async () => {
    if (!user || !profile) return;
    setSaving(true);
    await sb.from("profiles").update({ is_trainer: !profile.is_trainer }).eq("id", user.id);
    await refreshProfile();
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-xl font-bold text-red-400">
          {(profile?.display_name || profile?.username || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-zinc-100">{profile?.display_name || profile?.username}</p>
          <p className="text-xs text-zinc-500">@{profile?.username}</p>
          {profile?.is_trainer && (
            <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">👨‍🏫 Trainer</span>
          )}
        </div>
      </div>

      {/* Role */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Role</p>
        <button onClick={toggleRole} disabled={saving} className="w-full flex items-center gap-3 text-left">
          <span className="text-xl">{profile?.is_trainer ? "👨‍🏫" : "🥋"}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">
              {profile?.is_trainer ? "Coach / Trainer" : "Student"}
            </p>
            <p className="text-xs text-zinc-600">Tap to switch how others see you</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${profile?.is_trainer ? "bg-amber-500" : "bg-zinc-700"}`}>
            <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${profile?.is_trainer ? "translate-x-5" : "translate-x-0.5"}`}/>
          </div>
        </button>
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

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-red-400 font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors">
        <LogOut size={15}/> Sign Out
      </button>
    </div>
  );
}
