import React, { useEffect, useState } from 'react';
import { COLORS } from '../theme';
import { useUser } from '../userContext';

export default function LevelUpOverlay() {
  const { levelUp } = useUser();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (levelUp) { setVisible(true); const t = setTimeout(() => setVisible(false), 4000); return () => clearTimeout(t); }
  }, [levelUp]);

  if (!visible || !levelUp) return null;

  return (
    <div style={styles.backdrop} data-testid="levelup-overlay">
      <div style={styles.card}>
        <div style={{ fontSize: 72 }}>🎉</div>
        <h2 style={styles.title}>Level Up!</h2>
        <p style={styles.from}>{levelUp.from}</p>
        <div style={styles.arrow}>↓</div>
        <p style={styles.to}>{levelUp.to}</p>
        <div style={styles.stars}>✨ ✨ ✨</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, animation: 'fadeIn 0.3s ease' },
  card: { background: `linear-gradient(135deg, ${COLORS.bgCard}, #1E2A5E)`, borderRadius: 28, padding: '36px 32px', textAlign: 'center', border: `2px solid ${COLORS.gold}`, boxShadow: `0 0 60px ${COLORS.gold}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  title: { color: COLORS.gold, fontSize: 32, fontWeight: 900, margin: 0 },
  from: { color: COLORS.textSecondary, fontSize: 16, margin: 0, textDecoration: 'line-through' },
  arrow: { color: COLORS.gold, fontSize: 20 },
  to: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 },
  stars: { fontSize: 24, marginTop: 8, letterSpacing: 8 },
};
