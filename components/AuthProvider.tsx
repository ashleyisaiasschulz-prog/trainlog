"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useTagStore } from "@/store/useTagStore";
import { useInjuryStore } from "@/store/useInjuryStore";
import type { User } from "@supabase/supabase-js";

async function ensureProfile(sb: ReturnType<typeof createClient>, user: User) {
  try {
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) return data;

    // Prefer username/role chosen at signup (stored in user metadata)
    const meta = user.user_metadata ?? {};
    const base = ((meta.username as string) || user.email?.split("@")[0] || "user")
      .toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
    const displayName = (meta.display_name as string) || base;
    const isTrainer = Boolean(meta.is_trainer);

    let username = base;
    for (let i = 0; i < 6; i++) {
      const { error } = await sb.from("profiles").insert({
        id: user.id, username, display_name: displayName, is_trainer: isTrainer,
      });
      if (!error) break;
      if (error.code === "23505") username = base + (i + 1);  // username clash → suffix
      else break;
    }
    const { data: created } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return created;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const { loadFromCloud, reset } = useTrainingStore();

  useEffect(() => {
    const sb = createClient();

    // Background: fetch profile + training data (never blocks the gate)
    const hydrate = (user: User) => {
      ensureProfile(sb, user).then(setProfile).catch(() => {});
      loadFromCloud(user.id).catch(() => {});
      useTagStore.getState().loadFromCloud(user.id).catch(() => {});
      useInjuryStore.getState().loadFromCloud(user.id).catch(() => {});
    };

    // Initial check — decide auth state FAST, then stop loading no matter what
    sb.auth.getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        if (user) hydrate(user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // React to later sign-in / sign-out
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      setLoading(false);
      if (user) {
        hydrate(user);
      } else {
        setProfile(null);
        reset();
        useTagStore.getState().signOut();
        useInjuryStore.getState().signOut();
      }
    });

    // Safety net: never let the gate hang more than 4s
    const t = setTimeout(() => setLoading(false), 4000);

    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  return <>{children}</>;
}
