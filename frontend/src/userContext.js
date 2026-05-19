import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { getLevelInfo } from './theme';

const UserCtx = createContext(null);

function genUID() {
  return 'user_' + Math.random().toString(36).slice(2, 10);
}

export function UserProvider({ children }) {
  const [uid, setUid] = useState(() => {
    const stored = localStorage.getItem('stemscroll_uid');
    if (stored) return stored;
    const id = genUID();
    localStorage.setItem('stemscroll_uid', id);
    return id;
  });

  const [profile, setProfile] = useState({
    onboarded: false,
    age_mode: 'explorer',
    subjects: [],
    xp: 0,
    streak: 0,
    neuro_mode: false,
  });

  const [levelUp, setLevelUp] = useState(null); // { from, to }

  const fetchProfile = useCallback(async () => {
    try {
      const p = await api.getUser(uid);
      setProfile(p);
    } catch (_) {
      // new user — profile doesn't exist yet
    }
  }, [uid]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const addXP = async (amount) => {
    const before = getLevelInfo(profile.xp);
    try {
      await api.addXP(uid, amount);
      setProfile(p => {
        const newXP = (p.xp || 0) + amount;
        const after = getLevelInfo(newXP);
        if (after.levelIndex > before.levelIndex) {
          setLevelUp({ from: before.name, to: after.name });
          setTimeout(() => setLevelUp(null), 4000);
        }
        return { ...p, xp: newXP };
      });
    } catch (_) {}
  };

  return (
    <UserCtx.Provider value={{ uid, profile, setProfile, fetchProfile, addXP, levelUp }}>
      {children}
    </UserCtx.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error('useUser outside UserProvider');
  return ctx;
};
