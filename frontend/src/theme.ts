// STEMScroll theme — based on /app/design_guidelines.json
export const COLORS = {
  cosmos: "#0B0F2E",
  nebula: "#1A1F4E",
  auroraTeal: "#00E5C3",
  solarOrange: "#FFB830",
  plasmaPink: "#FF5E7D",
  protonPurple: "#7B61FF",
  sproutGreen: "#4CAF50",
  electron: "#4DFFE0",
  stardust: "#F0F4FF",
  moonrock: "#8892B0",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B5D8",
  border: "rgba(255,255,255,0.10)",
  cardBg: "#1A1F4E",
  glass: "rgba(11,15,46,0.85)",
};

export const SUBJECTS: Record<
  string,
  { label: string; emoji: string; gradient: [string, string]; color: string }
> = {
  biology: { label: "Biology", emoji: "🔬", gradient: ["#0B4D2C", "#1A8C50"], color: COLORS.sproutGreen },
  chemistry: { label: "Chemistry", emoji: "⚗️", gradient: ["#2D0B4D", "#6B1A8C"], color: COLORS.protonPurple },
  astronomy: { label: "Astronomy", emoji: "🔭", gradient: ["#0B0F4D", "#1A2F8C"], color: COLORS.solarOrange },
  physics: { label: "Physics", emoji: "⚡", gradient: ["#4D2B0B", "#8C5A1A"], color: COLORS.solarOrange },
  nature: { label: "Nature", emoji: "🌿", gradient: ["#1A4D0B", "#3D8C1A"], color: COLORS.sproutGreen },
  maths: { label: "Maths", emoji: "🧮", gradient: ["#0B3D4D", "#1A7A8C"], color: COLORS.auroraTeal },
  technology: { label: "Technology", emoji: "💻", gradient: ["#0B1A4D", "#1A3A8C"], color: COLORS.auroraTeal },
  engineering: { label: "Engineering", emoji: "🏗️", gradient: ["#3D3D0B", "#7A7A1A"], color: COLORS.solarOrange },
};

export const AGE_MODES = [
  { id: "explorer", label: "Explorer", desc: "Ages 3-7", emoji: "🧸" },
  { id: "discoverer", label: "Discoverer", desc: "Ages 8-12", emoji: "🔭" },
  { id: "scientist", label: "Scientist", desc: "Ages 13-15", emoji: "🧬" },
  { id: "guide", label: "Guide", desc: "Parent / Educator", emoji: "📚" },
] as const;

export type AgeMode = "explorer" | "discoverer" | "scientist" | "guide";
