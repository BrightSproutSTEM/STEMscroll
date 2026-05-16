// User context: keeps user profile + age mode in memory across screens.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getUserId, UserData } from "@/src/api";
import { AgeMode } from "@/src/theme";

interface Ctx {
  uid: string | null;
  user: UserData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  onboard: (age_mode: AgeMode, topics: string[], isND: boolean) => Promise<void>;
  bumpStreak: () => Promise<void>;
  addXP: (n: number) => Promise<void>;
  setAgeMode: (m: AgeMode) => Promise<void>;
}

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const u = await api.getUser(uid);
      setUser(u);
    } catch (e) {
      console.warn("user refresh failed", e);
    }
  }, [uid]);

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setUid(id);
      try {
        const u = await api.getUser(id);
        setUser(u);
      } catch (e) {
        console.warn("initial user load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onboard = useCallback(
    async (age_mode: AgeMode, topics: string[], isND: boolean) => {
      if (!uid) return;
      const u = await api.onboard(uid, { age_mode, selected_topics: topics, is_neurodiverse: isND });
      setUser(u);
    },
    [uid],
  );

  const bumpStreak = useCallback(async () => {
    if (!uid) return;
    const u = await api.bumpStreak(uid);
    setUser(u);
  }, [uid]);

  const addXP = useCallback(
    async (n: number) => {
      if (!uid) return;
      const r = await api.addXP(uid, n);
      setUser((prev) => (prev ? { ...prev, xp_total: r.xp_total, level: r.level } : prev));
    },
    [uid],
  );

  const setAgeMode = useCallback(
    async (m: AgeMode) => {
      if (!uid) return;
      const u = await api.setAgeMode(uid, m);
      setUser(u);
    },
    [uid],
  );

  return (
    <UserContext.Provider value={{ uid, user, loading, refresh, onboard, bumpStreak, addXP, setAgeMode }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
