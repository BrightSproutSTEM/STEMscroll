// Backend API client for STEMScroll
import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BASE) {
  console.warn("EXPO_PUBLIC_BACKEND_URL not set!");
}

const USER_ID_KEY = "stemscroll.user_id";

export async function getUserId(): Promise<string> {
  let id = await storage.getItem<string>(USER_ID_KEY, "");
  if (!id) {
    id = `u-${Math.random().toString(36).slice(2, 12)}-${Date.now().toString(36)}`;
    await storage.setItem(USER_ID_KEY, id);
  }
  return id;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${path} ${res.status}: ${txt}`);
  }
  return res.json();
}

export interface CardData {
  id: string;
  type: "fact" | "quiz" | "experiment" | "story" | "diagram";
  subject: string;
  ageMode?: string;
  emoji: string;
  headline: string;
  body: string;
  source?: string;
  xpValue?: number;
  mascot?: string;
  quizOptions?: string[];
  correctAnswer?: number;
  explanation?: string;
  materials?: string[];
  steps?: string[];
  whatHappens?: string;
  parentNote?: string;
  diagramParts?: { label: string; desc: string }[];
}

export interface UserData {
  user_id: string;
  age_mode: string;
  selected_topics: string[];
  is_neurodiverse: boolean;
  xp_total: number;
  level: number;
  streak_days: number;
  last_active: string | null;
  onboarded: boolean;
}

export interface Mission {
  id: string;
  title: string;
  emoji: string;
  subject: string;
  mascot: string;
  totalCards: number;
  xpReward: number;
  estimatedMinutes: number;
  curriculum: string;
  cardIds: string[];
}

export const api = {
  getSeedCards: (subjects?: string[], ageMode?: string) => {
    const params = new URLSearchParams();
    if (subjects?.length) params.set("subjects", subjects.join(","));
    if (ageMode) params.set("age_mode", ageMode);
    return req<{ cards: CardData[]; total: number }>(`/cards/seed?${params}`);
  },
  generateCard: (topic: string, age_mode: string, card_type: string, avoid_ids: string[] = []) =>
    req<CardData>(`/cards/generate`, {
      method: "POST",
      body: JSON.stringify({ topic, age_mode, card_type, avoid_ids }),
    }),
  listMissions: () => req<{ missions: Mission[] }>(`/missions`),
  getMission: (id: string) => req<Mission & { cards: CardData[] }>(`/missions/${id}`),
  getUser: (uid: string) => req<UserData>(`/user/${uid}`),
  onboard: (uid: string, body: { age_mode: string; selected_topics: string[]; is_neurodiverse: boolean }) =>
    req<UserData>(`/user/${uid}/onboard`, { method: "POST", body: JSON.stringify(body) }),
  bumpStreak: (uid: string) => req<UserData>(`/user/${uid}/streak`, { method: "POST" }),
  addXP: (uid: string, amount: number) =>
    req<{ xp_total: number; level: number; delta: number }>(`/user/${uid}/xp`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  setAgeMode: (uid: string, age_mode: string) =>
    req<UserData>(`/user/${uid}/age-mode`, { method: "POST", body: JSON.stringify({ age_mode }) }),
  listSaved: (uid: string) => req<{ cards: { card_id: string; card_data: CardData; saved_at: string }[] }>(`/user/${uid}/saved`),
  saveCard: (uid: string, card_id: string, card_data: CardData) =>
    req<{ ok: boolean }>(`/user/${uid}/saved`, { method: "POST", body: JSON.stringify({ card_id, card_data }) }),
  unsaveCard: (uid: string, card_id: string) =>
    req<{ ok: boolean }>(`/user/${uid}/saved/${card_id}`, { method: "DELETE" }),
  recordView: (uid: string, card_id: string, subject?: string) =>
    req<{ ok: boolean }>(`/user/${uid}/view`, { method: "POST", body: JSON.stringify({ card_id, subject }) }),
};

export const LEVEL_NAMES = ["Curious Atom", "Molecule", "Cell", "Organism", "Ecosystem", "Universe"];
