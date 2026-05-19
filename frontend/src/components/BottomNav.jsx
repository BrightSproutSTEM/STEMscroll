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
    <nav style={S.nav} data-testid="bottom-nav">
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={`nav-${tab.id}`}
            onClick={() => onChange(tab.id)}
            style={{ ...S.tab, color: isActive ? COLORS.auroraTeal : COLORS.moonrock }}
          >
            <span style={{ fontSize: 22, filter: isActive ? `drop-shadow(0 0 6px ${COLORS.auroraTeal})` : 'none', transition: 'filter 0.2s' }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: 0.5, color: isActive ? COLORS.auroraTeal : COLORS.moonrock }}>
              {tab.label}
            </span>
            {isActive && <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, background: COLORS.auroraTeal }} />}
          </button>
        );
      })}
    </nav>
  );
}

const S = {
  nav: { display: 'flex', background: COLORS.nebula, borderTop: `1px solid ${COLORS.border}`, flexShrink: 0, zIndex: 50 },
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', transition: 'color 0.2s', minHeight: 56 },
};
