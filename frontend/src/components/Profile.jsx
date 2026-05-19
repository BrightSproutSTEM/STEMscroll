import React, { useState, useEffect } from 'react';
import { COLORS, getLevelInfo, AGE_MODES, SUBJECTS, getMascotImage } from '../theme';
import { useUser } from '../userContext';

export default function Profile() {
  const { uid, profile } = useUser();
  const xp = profile?.xp || 0;
  const level = getLevelInfo(xp);
  const progress = Math.min(1, (xp - level.minXP) / Math.max(1, level.maxXP - level.minXP));
  const ageMode = profile?.age_mode || 'explorer';

  return (
    <div style={S.screen} data-testid="profile-screen">
      {/* Hero */}
      <div style={S.hero}>
        <img src={getMascotImage('drSprout', 'thumbsUp') || '/mascots/dr-sprout/thumbsup.png'} alt="Dr Sprout" style={S.heroImg} />
        <h2 style={S.levelName}>{level.name}</h2>
        <p style={S.xpText}>{xp} XP</p>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progress * 100}%`, background: level.color }} />
        </div>
        <div style={S.progressLabels}>
          <span>{level.minXP} XP</span>
          <span style={{ color: level.color, fontWeight: 700 }}>{level.maxXP} XP</span>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[['🔥', 'Streak', `${profile?.streak || 0}d`], ['⚡', 'XP', xp], ['🏆', 'Level', level.levelIndex + 1]].map(([icon, label, value]) => (
          <div key={label} style={S.statCard}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span style={S.statValue}>{value}</span>
            <span style={S.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={S.section}>
        <p style={S.sectionLabel}>Settings</p>
        {[
          [AGE_MODES[ageMode]?.emoji || '🔭', 'Age mode', AGE_MODES[ageMode]?.label || '—'],
          ['🧠', 'Neuro mode', profile?.neuro_mode ? 'On' : 'Off'],
          ['📚', 'Topics', profile?.subjects?.length ? `${profile.subjects.length} selected` : 'All'],
        ].map(([icon, label, value]) => (
          <div key={label} style={S.settingRow}>
            <span style={{ fontSize: 18, marginRight: 12 }}>{icon}</span>
            <span style={{ color: COLORS.moonrock, flex: 1, fontSize: 14 }}>{label}</span>
            <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Subject chips */}
      {profile?.subjects?.length > 0 && (
        <div style={S.section}>
          <p style={S.sectionLabel}>Your topics</p>
          <div style={S.subjectRow}>
            {profile.subjects.map(s => {
              const sub = SUBJECTS[s]; if (!sub) return null;
              return <span key={s} style={{ ...S.chip, background: `${sub.color}22`, color: sub.color }}>{sub.emoji} {sub.label}</span>;
            })}
          </div>
        </div>
      )}

      {/* Mascot squad */}
      <div style={S.section}>
        <p style={S.sectionLabel}>Meet the NeuroCrew</p>
        <div style={S.mascotGrid}>
          {['sprouty','drSprout','ausomeKoala','quizzle','wombles','zoomerroo','neuroSprouty'].map(id => {
            const img = getMascotImage(id);
            return img ? <img key={id} src={img} alt={id} style={S.mascotThumb} /> : null;
          })}
        </div>
      </div>

      <p style={S.uid}>ID: {uid?.slice(-8)}</p>
    </div>
  );
}

const S = {
  screen: { height: '100%', overflowY: 'auto', padding: '16px', boxSizing: 'border-box' },
  hero: { background: `linear-gradient(135deg, ${COLORS.nebula}, #1E2A5E)`, borderRadius: 20, padding: '20px', border: `1px solid ${COLORS.border}`, textAlign: 'center', marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroImg: { width: 80, height: 80, objectFit: 'contain', marginBottom: 8, filter: 'drop-shadow(0 0 12px rgba(0,229,195,0.3))' },
  levelName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 800, margin: '0 0 4px' },
  xpText: { color: COLORS.solarOrange, fontWeight: 700, fontSize: 15, margin: '0 0 10px' },
  progressTrack: { background: COLORS.border, borderRadius: 6, height: 10, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, transition: 'width 1s ease' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', color: COLORS.moonrock, fontSize: 11, marginTop: 4, width: '100%' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 },
  statCard: { background: COLORS.nebula, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.textPrimary, fontWeight: 800, fontSize: 18 },
  statLabel: { color: COLORS.moonrock, fontSize: 11 },
  section: { marginBottom: 14 },
  sectionLabel: { color: COLORS.moonrock, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' },
  settingRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` },
  subjectRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20 },
  mascotGrid: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  mascotThumb: { width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' },
  uid: { color: COLORS.border, fontSize: 11, textAlign: 'center', marginTop: 8 },
};
