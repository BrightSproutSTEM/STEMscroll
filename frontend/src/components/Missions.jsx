import React, { useState, useEffect } from 'react';
import { COLORS, SUBJECTS } from '../theme';
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
    api.getMissions()
      .then(data => setMissions(Array.isArray(data) ? data : []))
      .catch(() => setMissions([]))
      .finally(() => setLoading(false));
  }, []);

  const openMission = async (m) => {
    setActiveMission(m);
    setCardIdx(0);
    setLoadingCards(true);
    try {
      const cards = await api.getMission(m.id);
      setMissionCards(Array.isArray(cards) ? cards : []);
    } catch (_) {
      setMissionCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  if (activeMission) {
    return (
      <div style={styles.screen} data-testid="mission-detail">
        <button style={styles.backBtn} onClick={() => setActiveMission(null)}>← Back</button>
        <div style={styles.missionHeader}>
          <span style={{ fontSize: 36 }}>{activeMission.emoji}</span>
          <div>
            <h3 style={styles.missionTitle}>{activeMission.title}</h3>
            <span style={styles.missionMeta}>{activeMission.curriculum} · {activeMission.estimatedMinutes} min · {activeMission.xpReward} XP</span>
          </div>
        </div>
        {loadingCards ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : missionCards.length === 0 ? (
          <p style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 }}>No cards in this mission yet.</p>
        ) : (
          <div>
            <p style={styles.cardCounter}>{cardIdx + 1} / {missionCards.length}</p>
            <div style={{ height: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column' }}>
              <STEMCard card={missionCards[cardIdx]} ageMode={profile?.age_mode || 'discoverer'} onSave={() => {}} />
            </div>
            <div style={styles.navRow}>
              {cardIdx > 0 && (
                <button style={styles.navBtn} onClick={() => setCardIdx(i => i - 1)}>← Prev</button>
              )}
              {cardIdx < missionCards.length - 1 ? (
                <button data-testid="mission-next-card" style={{ ...styles.navBtn, background: `linear-gradient(135deg, ${COLORS.accent}, #5B41DF)`, color: '#fff' }} onClick={() => setCardIdx(i => i + 1)}>
                  Next →
                </button>
              ) : (
                <button data-testid="mission-complete" style={{ ...styles.navBtn, background: '#4CAF5033', color: COLORS.green }} onClick={() => setActiveMission(null)}>
                  Complete! +{activeMission.xpReward} XP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.screen} data-testid="missions-screen">
      <h2 style={styles.title}>Missions</h2>
      <p style={styles.sub}>Curated learning journeys</p>
      <div style={styles.list}>
        {missions.map(m => {
          const subj = SUBJECTS[m.subject] || {};
          return (
            <button
              key={m.id}
              data-testid={`mission-${m.id}`}
              onClick={() => openMission(m)}
              style={styles.missionCard}
            >
              <span style={styles.missionEmoji}>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.missionCardTitle}>{m.title}</div>
                <div style={styles.missionCardMeta}>
                  {subj.emoji} {subj.label || m.subject} · {m.totalCards} cards · {m.estimatedMinutes} min
                </div>
              </div>
              <div style={styles.xpChip}>+{m.xpReward} XP</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  screen: { height: '100%', overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' },
  center: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sub: { color: COLORS.textSecondary, fontSize: 14, margin: '0 0 16px' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  missionCard: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s', width: '100%' },
  missionEmoji: { fontSize: 32, flexShrink: 0 },
  missionCardTitle: { color: COLORS.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 4 },
  missionCardMeta: { color: COLORS.textSecondary, fontSize: 12 },
  xpChip: { background: '#FFD70022', color: COLORS.gold, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12, flexShrink: 0 },
  backBtn: { background: 'transparent', color: COLORS.textSecondary, border: 'none', fontSize: 15, cursor: 'pointer', padding: '0 0 16px', display: 'block' },
  missionHeader: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, background: COLORS.bgCard, borderRadius: 16, padding: '14px 16px', border: `1px solid ${COLORS.border}` },
  missionTitle: { color: COLORS.textPrimary, fontWeight: 800, fontSize: 17, margin: 0 },
  missionMeta: { color: COLORS.textSecondary, fontSize: 12 },
  cardCounter: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  navRow: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 },
  navBtn: { background: COLORS.bgCard, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '10px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
