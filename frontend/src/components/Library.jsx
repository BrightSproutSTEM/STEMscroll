import React, { useState, useEffect } from 'react';
import { COLORS, SUBJECTS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';
import STEMCard from './STEMCard';

export default function Library() {
  const { uid } = useUser();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.getSaved(uid).then(d => setSaved(Array.isArray(d) ? d : [])).catch(() => setSaved([])).finally(() => setLoading(false));
  }, [uid]);

  const handleUnsave = async (cardId) => {
    try { await api.unsaveCard(uid, cardId); setSaved(s => s.filter(c => c.id !== cardId)); if (active?.id === cardId) setActive(null); } catch (_) {}
  };

  if (loading) return <div style={S.center} data-testid="library-loading"><div style={S.spinner} /></div>;

  return (
    <div style={S.screen} data-testid="library-screen">
      <h2 style={S.title}>My Library</h2>
      <p style={S.sub}>{saved.length} saved card{saved.length !== 1 ? 's' : ''}</p>

      {saved.length === 0 ? (
        <div style={S.empty}>
          <img src="/mascots/neuro-sprouty/happy.png" alt="Neuro" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <p style={{ color: COLORS.moonrock, textAlign: 'center' }}>No saved cards yet.<br />Tap ♡ on any card to save it!</p>
        </div>
      ) : (
        <div style={S.grid}>
          {saved.map(card => (
            <button key={card.id} data-testid={`library-card-${card.id}`} onClick={() => setActive(card)} style={S.tile}>
              <span style={{ fontSize: 28 }}>{card.emoji}</span>
              <span style={S.tileTitle}>{card.headline}</span>
              <span style={S.tileType}>{card.type}</span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div style={S.backdrop} onClick={() => setActive(null)} data-testid="library-detail-modal">
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <STEMCard card={active} ageMode="discoverer" onSave={() => {}} />
            </div>
            <button data-testid="unsave-btn" onClick={() => handleUnsave(active.id)} style={S.unsaveBtn}>Remove from Library</button>
            <button onClick={() => setActive(null)} style={S.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  screen: { height: '100%', overflowY: 'auto', padding: '16px', boxSizing: 'border-box' },
  center: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.auroraTeal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sub: { color: COLORS.moonrock, fontSize: 14, margin: '0 0 16px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 60 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  tile: { background: COLORS.nebula, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' },
  tileTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  tileType: { color: COLORS.moonrock, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: COLORS.nebula, borderRadius: 24, width: '100%', maxWidth: 440, maxHeight: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' },
  unsaveBtn: { background: 'rgba(255,94,125,0.2)', color: COLORS.plasmaPink, border: `1px solid ${COLORS.plasmaPink}44`, borderRadius: 0, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  closeBtn: { background: COLORS.nebula, color: COLORS.moonrock, border: `1px solid ${COLORS.border}`, borderRadius: 0, padding: '10px', fontSize: 14, cursor: 'pointer' },
};
