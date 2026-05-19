import React from 'react';
import { COLORS } from '../theme';

const TABS = [
  { id: 'feed',     icon: '⚡', label: 'Feed' },
  { id: 'missions', icon: '🎯', label: 'Missions' },
  { id: 'library',  icon: '📚', label: 'Library' },
  { id: 'explore',  icon: '✨', label: 'Explore' },
  { id: 'me',       icon: '👤', label: 'Me' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={styles.nav} data-testid="bottom-nav">
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={`nav-${tab.id}`}
            onClick={() => onChange(tab.id)}
            style={{ ...styles.tab, color: isActive ? COLORS.accent : COLORS.textSecondary }}
          >
            <span style={{ ...styles.icon, filter: isActive ? `drop-shadow(0 0 6px ${COLORS.accent})` : 'none' }}>
              {tab.icon}
            </span>
            <span style={{ ...styles.label, color: isActive ? COLORS.accent : COLORS.textSecondary }}>
              {tab.label}
            </span>
            {isActive && <div style={styles.dot} />}
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', background: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}`, flexShrink: 0, zIndex: 50 },
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 6px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', transition: 'color 0.2s', minHeight: 54 },
  icon: { fontSize: 22, lineHeight: 1, transition: 'filter 0.2s' },
  label: { fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: 0.5, transition: 'color 0.2s' },
  dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, background: COLORS.accent },
};
