import React, { useState, useEffect } from 'react';
import { COLORS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';
import STEMCard from './STEMCard';

export default function Library() {
  const { uid } = useUser();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.getSaved(uid)
      .then(data => setSaved(Array.isArray(data) ? data : []))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleUnsave = async (cardId) => {
    try {
      await api.unsaveCard(uid, cardId);
      setSaved(s => s.filter(c => c.id !== cardId));
      if (active?.id === cardId) setActive(null);
    } catch (_) {}
  };

  if (loading) return <div style={styles.center} data-testid="library-loading"><div style={styles.spinner} /></div>;

  return (
    <div style={styles.screen} data-testid="library-screen">
      <h2 style={styles.title}>My Library</h2>
      <p style={styles.sub}>{saved.length} saved card{saved.length !== 1 ? 's' : ''}</p>

      {saved.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 56 }}>📚</div>
          <p style={{ color: COLORS.textSecondary }}>No saved cards yet.<br />Tap ☆ on any card to save it!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {saved.map(card => (
            <button
              key={card.id}
              data-testid={`library-card-${card.id}`}
              onClick={() => setActive(card)}
              style={styles.tile}
            >
              <span style={{ fontSize: 28 }}>{card.emoji}</span>
              <span style={styles.tileTitle}>{card.headline}</span>
              <span style={styles.tileType}>{card.type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card detail modal */}
      {active && (
        <div style={styles.modalBackdrop} onClick={() => setActive(null)} data-testid="library-detail-modal">
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <STEMCard card={active} ageMode="discoverer" onSave={() => {}} />
            <button
              data-testid="unsave-btn"
              onClick={() => handleUnsave(active.id)}
              style={styles.unsaveBtn}
            >
              Remove from Library
            </button>
            <button onClick={() => setActive(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: { height: '100%', overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' },
  center: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sub: { color: COLORS.textSecondary, fontSize: 14, margin: '0 0 20px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 60 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  tile: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'border-color 0.2s', textAlign: 'center' },
  tileTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  tileType: { color: COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: COLORS.bgCard, borderRadius: 24, width: '100%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  unsaveBtn: { background: '#FF6B6B22', color: COLORS.coral, border: `1px solid ${COLORS.coral}44`, borderRadius: 12, padding: '10px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  closeBtn: { background: COLORS.bgCardAlt, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px', fontSize: 14, cursor: 'pointer' },
};
