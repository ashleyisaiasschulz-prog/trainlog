"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  gym: string | null;
  belt: string;
  stripes: number;
  share_stats: boolean;
  share_belt: boolean;
  share_sessions: boolean;
  is_trainer: boolean;
}

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (v: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    const sb = createClient();
    await sb.auth.signOut();
    set({ user: null, profile: null });
  },
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const sb = createClient();
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
    if (data) set({ profile: data });
  },
}));
