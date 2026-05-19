// ── Original STEMScroll theme colours (from /src/theme.ts in repo) ──────────
export const COLORS = {
  cosmos:       '#0B0F2E',   // page background
  nebula:       '#1A1F4E',   // card background
  auroraTeal:   '#00E5C3',   // source/teal accents
  solarOrange:  '#FFB830',   // XP / warmth
  plasmaPink:   '#FF5E7D',   // save heart / error
  protonPurple: '#7B61FF',   // accent purple
  sproutGreen:  '#4CAF50',   // verified / biology
  electron:     '#4DFFE0',   // bright teal
  stardust:     '#F0F4FF',   // body text (near-white)
  moonrock:     '#8892B0',   // secondary / muted
  textPrimary:  '#FFFFFF',
  textSecondary:'#B0B5D8',
  border:       'rgba(255,255,255,0.10)',
  cardBg:       '#1A1F4E',
  glass:        'rgba(11,15,46,0.85)',
};

// Subject definitions — exact colours & gradients from original repo
export const SUBJECTS = {
  biology:     { label: 'Biology',     emoji: '🔬', color: COLORS.sproutGreen, gradient: ['#0B4D2C','#1A8C50'] },
  chemistry:   { label: 'Chemistry',   emoji: '⚗️',  color: COLORS.protonPurple, gradient: ['#2D0B4D','#6B1A8C'] },
  astronomy:   { label: 'Astronomy',   emoji: '🔭', color: COLORS.solarOrange, gradient: ['#0B0F4D','#1A2F8C'] },
  physics:     { label: 'Physics',     emoji: '⚡',  color: COLORS.solarOrange, gradient: ['#4D2B0B','#8C5A1A'] },
  nature:      { label: 'Nature',      emoji: '🌿', color: COLORS.sproutGreen, gradient: ['#1A4D0B','#3D8C1A'] },
  maths:       { label: 'Maths',       emoji: '🧮', color: COLORS.auroraTeal,  gradient: ['#0B3D4D','#1A7A8C'] },
  technology:  { label: 'Technology',  emoji: '💻', color: COLORS.auroraTeal,  gradient: ['#0B1A4D','#1A3A8C'] },
  engineering: { label: 'Engineering', emoji: '🏗️', color: COLORS.solarOrange, gradient: ['#3D3D0B','#7A7A1A'] },
};

export const AGE_MODES = {
  explorer:   { label: 'Explorer',   desc: 'Ages 3-7',   emoji: '🧸' },
  discoverer: { label: 'Discoverer', desc: 'Ages 8-12',  emoji: '🔭' },
  scientist:  { label: 'Scientist',  desc: 'Ages 13-15', emoji: '🧬' },
  guide:      { label: 'Guide',      desc: 'Parent / Educator', emoji: '📚' },
};

export const LEVELS = [
  { name: 'Curious Atom',  minXP: 0,    maxXP: 100,  color: COLORS.moonrock },
  { name: 'Sparky',        minXP: 100,  maxXP: 250,  color: COLORS.sproutGreen },
  { name: 'Explorer',      minXP: 250,  maxXP: 500,  color: COLORS.auroraTeal },
  { name: 'Discoverer',    minXP: 500,  maxXP: 1000, color: COLORS.protonPurple },
  { name: 'Scientist',     minXP: 1000, maxXP: 2500, color: COLORS.solarOrange },
  { name: 'Universe',      minXP: 2500, maxXP: 9999, color: COLORS.plasmaPink },
];

export function getLevelInfo(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return { ...LEVELS[i], levelIndex: i };
  }
  return { ...LEVELS[0], levelIndex: 0 };
}

// ── Mascot definitions (from /src/mascots.ts) ──────────────────────────────
export const MASCOTS = {
  sprouty: {
    id: 'sprouty', name: 'Sprouty', emoji: '🌱',
    color: '#4CAF50', bgColor: 'rgba(76,175,80,0.18)',
    tagline: 'Your STEM buddy',
    messages: { quizRight: "YES! You nailed it! You're a STEM superstar! ⭐", quizWrong: "Oops! Now you know! Sprouty believes in you!" },
  },
  drSprout: {
    id: 'drSprout', name: 'Dr. Sprout', emoji: '🥼',
    color: '#2E7D32', bgColor: 'rgba(46,125,50,0.2)',
    tagline: 'The brilliant scientist',
    messages: { quizRight: 'Correct! Concept applied perfectly.', quizWrong: 'Not quite — observe, adjust, try again.' },
  },
  ausomeKoala: {
    id: 'ausomeKoala', name: 'Ausome', emoji: '🐨',
    color: '#9C7FD4', bgColor: 'rgba(156,127,212,0.2)',
    tagline: 'Every brain is brilliant',
    messages: { quizRight: 'Your unique brain got it exactly right! 🌈', quizWrong: "That's okay! We can come back to this." },
  },
  quizzle: {
    id: 'quizzle', name: 'Quizzle', emoji: '❓',
    color: '#F5A623', bgColor: 'rgba(245,166,35,0.2)',
    tagline: 'Quiz champion',
    messages: { quizRight: "BOOM! Quizzle's doing a happy dance! 🎉", quizWrong: 'Oops! The answer was hiding — now you know where!' },
  },
  wombles: {
    id: 'wombles', name: 'Wombles', emoji: '🥽',
    color: '#8D6E63', bgColor: 'rgba(141,110,99,0.25)',
    tagline: 'Hands-on expert',
    messages: { quizRight: 'Did you see that?! THAT is real science!', quizWrong: 'Try again — even Einstein made messes!' },
  },
  zoomerroo: {
    id: 'zoomerroo', name: 'Zoomerroo', emoji: '🦘',
    color: '#FF6D00', bgColor: 'rgba(255,109,0,0.2)',
    tagline: 'Tech explorer',
    messages: { quizRight: 'ZOOOM! Right on target!', quizWrong: 'Re-route and try again!' },
  },
  neuroSprouty: {
    id: 'neuroSprouty', name: 'Neuro', emoji: '🧠',
    color: '#76C442', bgColor: 'rgba(118,196,66,0.2)',
    tagline: 'Neurodiverse champion',
    messages: { quizRight: 'Your brain is brilliant!', quizWrong: 'Take a breath. Try again at your pace.' },
  },
};

// Static image map — paths served from /public/mascots/
export const MASCOT_IMAGES = {
  sprouty:     { default: '/mascots/sprouty/default.png', surprise: '/mascots/sprouty/surprise.png', thinking: '/mascots/sprouty/thinking.png', thumbsUp: '/mascots/sprouty/default.png', celebrate: '/mascots/sprouty/default.png' },
  ausomeKoala: { default: '/mascots/ausome-koala/koala-default.png', armsUp: '/mascots/ausome-koala/koala-armsup.png', sensory: '/mascots/ausome-koala/koala-sensory.png', celebrate: '/mascots/ausome-koala/koala-armsup.png' },
  drSprout:    { default: '/mascots/dr-sprout/thumbsup.png', victory: '/mascots/dr-sprout/victory.png', surprise: '/mascots/dr-sprout/surprise.png', thumbsUp: '/mascots/dr-sprout/thumbsup.png', celebrate: '/mascots/dr-sprout/victory.png', meditating: '/mascots/dr-sprout/meditating.png' },
  quizzle:     { default: '/mascots/quizzle/default.png', celebrate: '/mascots/quizzle/default.png' },
  wombles:     { default: '/mascots/wombles/default.png', celebrate: '/mascots/wombles/default.png' },
  zoomerroo:   { default: '/mascots/zoomerroo/default.png', celebrate: '/mascots/zoomerroo/default.png' },
  neuroSprouty:{ default: '/mascots/neuro-sprouty/happy.png', happy: '/mascots/neuro-sprouty/happy.png', brainwave: '/mascots/neuro-sprouty/brainwave.png', kisses: '/mascots/neuro-sprouty/kisses.png', celebrate: '/mascots/neuro-sprouty/brainwave.png' },
};

export function getMascotImage(mascotId, pose = 'default') {
  const set = MASCOT_IMAGES[mascotId];
  if (!set) return null;
  return set[pose] || set.default || null;
}

export function getMascotForCard(card, ageMode, isND = false) {
  if (card?.mascot && MASCOTS[card.mascot]) return MASCOTS[card.mascot];
  if (card?.type === 'quiz')       return MASCOTS.quizzle;
  if (card?.type === 'experiment') return MASCOTS.wombles;
  if (['technology','engineering','maths'].includes(card?.subject)) return MASCOTS.zoomerroo;
  if (ageMode === 'scientist')     return MASCOTS.drSprout;
  if (isND)                        return MASCOTS.ausomeKoala;
  return MASCOTS.sprouty;
}
