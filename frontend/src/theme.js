export const COLORS = {
  bg: '#0B0F2E',
  bgCard: '#151A40',
  bgCardAlt: '#1A2050',
  accent: '#7B61FF',
  accentGlow: 'rgba(123,97,255,0.15)',
  green: '#4CAF50',
  gold: '#FFD700',
  coral: '#FF6B6B',
  sky: '#00B4D8',
  mint: '#00D4AA',
  orange: '#FF9800',
  textPrimary: '#F0F4FF',
  textSecondary: '#8892B0',
  border: '#1E2545',
};

export const SUBJECTS = {
  biology:     { label: 'Biology',     emoji: '🧬', color: '#4CAF50' },
  chemistry:   { label: 'Chemistry',   emoji: '⚗️',  color: '#FF9800' },
  physics:     { label: 'Physics',     emoji: '⚡',  color: '#00B4D8' },
  maths:       { label: 'Maths',       emoji: '🔢', color: '#7B61FF' },
  astronomy:   { label: 'Astronomy',   emoji: '🌌', color: '#00B4D8' },
  engineering: { label: 'Engineering', emoji: '🔧', color: '#FF9800' },
  nature:      { label: 'Nature',      emoji: '🌿', color: '#4CAF50' },
  technology:  { label: 'Technology',  emoji: '💻', color: '#7B61FF' },
};

export const AGE_MODES = {
  explorer:   { label: 'Explorer',   ages: '3-7',   icon: '🌱' },
  discoverer: { label: 'Discoverer', ages: '8-12',  icon: '🔭' },
  scientist:  { label: 'Scientist',  ages: '13+',   icon: '🔬' },
};

export const LEVELS = [
  { name: 'Curious Atom',  minXP: 0,    maxXP: 100,  color: '#8892B0' },
  { name: 'Sparky',        minXP: 100,  maxXP: 250,  color: '#4CAF50' },
  { name: 'Explorer',      minXP: 250,  maxXP: 500,  color: '#00B4D8' },
  { name: 'Discoverer',    minXP: 500,  maxXP: 1000, color: '#7B61FF' },
  { name: 'Scientist',     minXP: 1000, maxXP: 2500, color: '#FFD700' },
  { name: 'Universe',      minXP: 2500, maxXP: 9999, color: '#FF6B6B' },
];

export function getLevelInfo(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return { ...LEVELS[i], levelIndex: i };
  }
  return { ...LEVELS[0], levelIndex: 0 };
}

export const MASCOTS = {
  sprouty:     { name: 'Sprouty',      emoji: '🌱', color: '#4CAF50' },
  drSprout:    { name: 'Dr. Sprout',   emoji: '🔬', color: '#7B61FF' },
  ausomeKoala: { name: 'Ausome Koala', emoji: '🐨', color: '#00B4D8' },
  quizzle:     { name: 'Quizzle',      emoji: '❓', color: '#FFD700' },
  wombles:     { name: 'Wombles',      emoji: '🐛', color: '#FF9800' },
  zoomerroo:   { name: 'Zoomerroo',    emoji: '🦘', color: '#FF6B6B' },
  neuroSprout: { name: 'Neuro Sprout', emoji: '🌟', color: '#9B81FF' },
};

export const CARD_GRADIENTS = {
  fact:       ['#1A1F4E', '#0E1235'],
  quiz:       ['#1E1550', '#0E1235'],
  experiment: ['#1A2E1A', '#0E1235'],
  story:      ['#2A1A3E', '#0E1235'],
  diagram:    ['#1A2A3E', '#0E1235'],
};

export const TYPE_COLORS = {
  fact:       '#7B61FF',
  quiz:       '#FFD700',
  experiment: '#4CAF50',
  story:      '#FF6B6B',
  diagram:    '#00B4D8',
};
