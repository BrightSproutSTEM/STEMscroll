import React, { useEffect, useState } from 'react';
import { COLORS } from '../theme';
import { useUser } from '../userContext';

export default function LevelUpOverlay() {
  const { levelUp } = useUser();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (levelUp) { setVisible(true); const t = setTimeout(() => setVisible(false), 4500); return () => clearTimeout(t); }
  }, [levelUp]);
  if (!visible || !levelUp) return null;

  return (
    <div style={S.backdrop} data-testid="levelup-overlay">
      <div style={S.card}>
        <img src="/mascots/neuro-sprouty/brainwave.png" alt="Neuro" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <h2 style={S.title}>Level Up!</h2>
        <p style={S.from}>{levelUp.from}</p>
        <p style={{ color: COLORS.solarOrange, fontSize: 22, margin: 0 }}>↓</p>
        <p style={S.to}>{levelUp.to}</p>
        <div style={S.stars}>✨ ✨ ✨</div>
      </div>
    </div>
  );
}

const S = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, animation: 'fadeIn 0.3s ease' },
  card: { background: `linear-gradient(135deg, ${COLORS.nebula}, #1E2A5E)`, borderRadius: 28, padding: '32px 28px', textAlign: 'center', border: `2px solid ${COLORS.solarOrange}`, boxShadow: `0 0 60px ${COLORS.solarOrange}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  title: { color: COLORS.solarOrange, fontSize: 30, fontWeight: 900, margin: 0 },
  from: { color: COLORS.moonrock, fontSize: 15, margin: 0, textDecoration: 'line-through' },
  to: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 },
  stars: { fontSize: 24, marginTop: 8, letterSpacing: 8 },
};
