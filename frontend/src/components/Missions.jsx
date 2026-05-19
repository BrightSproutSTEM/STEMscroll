import React, { useState, useEffect } from 'react';
import { COLORS, SUBJECTS, getMascotImage } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';
import STEMCard from './STEMCard';

export default function Missions() {
  const { uid, profile } = useUser();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMission, setActiveMission] = useState(null);
  const [missionCards, setMissionCards] = useState([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    api.getMissions().then(d => setMissions(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openMission = async (m) => {
    setActiveMission(m); setCardIdx(0); setLoadingCards(true);
    try { const c = await api.getMission(m.id); setMissionCards(Array.isArray(c) ? c : []); }
    catch (_) { setMissionCards([]); }
    finally { setLoadingCards(false); }
  };

  if (loading) return <div style={S.center}><div style={S.spinner} /></div>;

  if (activeMission) {
    return (
      <div style={S.screen} data-testid="mission-detail">
        <button style={S.back} onClick={() => setActiveMission(null)}>← Back to missions</button>
        <div style={S.missionHdr}>
          <span style={{ fontSize: 32 }}>{activeMission.emoji}</span>
          <div>
            <h3 style={S.missionTitle}>{activeMission.title}</h3>
            <p style={S.missionMeta}>{activeMission.curriculum} · {activeMission.estimatedMinutes} min · {activeMission.xpReward} XP</p>
          </div>
        </div>
        {loadingCards ? <div style={S.center}><div style={S.spinner} /></div> : missionCards.length === 0 ? (
          <p style={{ color: COLORS.moonrock, textAlign: 'center', marginTop: 40 }}>No cards in this mission yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <p style={S.counter}>{cardIdx + 1} / {missionCards.length}</p>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <STEMCard card={missionCards[cardIdx]} ageMode={profile?.age_mode || 'discoverer'} onSave={() => {}} />
            </div>
            <div style={S.navRow}>
              {cardIdx > 0 && <button style={S.navBtn} onClick={() => setCardIdx(i => i - 1)}>← Prev</button>}
              {cardIdx < missionCards.length - 1
                ? <button data-testid="mission-next-card" style={{ ...S.navBtn, background: `linear-gradient(135deg, ${COLORS.protonPurple}, #5B41DF)`, color: '#fff', border: 'none' }} onClick={() => setCardIdx(i => i + 1)}>Next →</button>
                : <button data-testid="mission-complete" style={{ ...S.navBtn, background: 'rgba(76,175,80,0.2)', color: COLORS.sproutGreen, border: `1px solid ${COLORS.sproutGreen}44` }} onClick={() => setActiveMission(null)}>
                    Complete! +{activeMission.xpReward} XP 🎉
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.screen} data-testid="missions-screen">
      <div style={S.topRow}>
        <img src={getMascotImage('quizzle')} alt="Quizzle" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        <div>
          <h2 style={S.title}>Missions</h2>
          <p style={S.sub}>Curated learning journeys</p>
        </div>
      </div>
      <div style={S.list}>
        {missions.map(m => {
          const subj = SUBJECTS[m.subject] || {};
          return (
            <button key={m.id} data-testid={`mission-${m.id}`} onClick={() => openMission(m)} style={S.mCard}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{m.emoji}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.title}</div>
                <div style={{ color: COLORS.moonrock, fontSize: 12 }}>{subj.emoji} {subj.label || m.subject} · {m.totalCards} cards · {m.estimatedMinutes} min</div>
              </div>
              <div style={S.xpChip}>+{m.xpReward} XP</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  screen: { height: '100%', overflowY: 'auto', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.auroraTeal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  topRow: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: COLORS.moonrock, fontSize: 13, margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  mCard: { background: COLORS.nebula, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s', width: '100%' },
  xpChip: { background: `rgba(255,184,48,0.15)`, color: COLORS.solarOrange, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12, flexShrink: 0, border: `1px solid ${COLORS.solarOrange}44` },
  back: { background: 'transparent', color: COLORS.moonrock, border: 'none', fontSize: 15, cursor: 'pointer', padding: '0 0 12px', textAlign: 'left' },
  missionHdr: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, background: COLORS.nebula, borderRadius: 16, padding: '14px 16px', border: `1px solid ${COLORS.border}` },
  missionTitle: { color: COLORS.textPrimary, fontWeight: 800, fontSize: 17, margin: 0 },
  missionMeta: { color: COLORS.moonrock, fontSize: 12, margin: 0 },
  counter: { color: COLORS.moonrock, fontSize: 13, textAlign: 'center', margin: '0 0 8px' },
  navRow: { display: 'flex', justifyContent: 'center', gap: 10, padding: '10px 0 0' },
  navBtn: { background: COLORS.nebula, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '10px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
