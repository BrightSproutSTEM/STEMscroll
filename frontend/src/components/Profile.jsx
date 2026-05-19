import React from 'react';
import { COLORS, getLevelInfo, AGE_MODES, SUBJECTS } from '../theme';
import { useUser } from '../userContext';

export default function Profile() {
  const { uid, profile } = useUser();
  const xp = profile?.xp || 0;
  const level = getLevelInfo(xp);
  const progress = Math.min(1, (xp - level.minXP) / (level.maxXP - level.minXP));

  return (
    <div style={styles.screen} data-testid="profile-screen">
      {/* Avatar / Level card */}
      <div style={styles.heroCard}>
        <div style={styles.avatar}>🌟</div>
        <h2 style={styles.levelName}>{level.name}</h2>
        <div style={styles.xpText}>{xp} XP</div>
        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress * 100}%`, background: level.color }} />
        </div>
        <div style={styles.progressLabels}>
          <span>{level.minXP} XP</span>
          <span>{level.maxXP} XP</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard icon="🔥" label="Streak" value={`${profile?.streak || 0} days`} />
        <StatCard icon="⚡" label="XP" value={xp} />
        <StatCard icon="🏆" label="Level" value={level.levelIndex + 1} />
      </div>

      {/* Settings */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Settings</p>
        <SettingRow icon={AGE_MODES[profile?.age_mode]?.icon || '🔭'} label="Age mode" value={AGE_MODES[profile?.age_mode]?.label || '—'} />
        <SettingRow icon="🧠" label="Neuro mode" value={profile?.neuro_mode ? 'On' : 'Off'} />
        <SettingRow icon="📚" label="Topics" value={profile?.subjects?.length ? `${profile.subjects.length} selected` : 'All'} />
      </div>

      {/* Subjects */}
      {profile?.subjects?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionLabel}>Your topics</p>
          <div style={styles.subjectRow}>
            {profile.subjects.map(s => {
              const sub = SUBJECTS[s];
              if (!sub) return null;
              return (
                <span key={s} style={{ ...styles.subjectChip, background: `${sub.color}22`, color: sub.color }}>
                  {sub.emoji} {sub.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <p style={styles.uid}>User ID: {uid?.slice(-8)}</p>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function SettingRow({ icon, label, value }) {
  return (
    <div style={styles.settingRow}>
      <span style={styles.settingIcon}>{icon}</span>
      <span style={styles.settingLabel}>{label}</span>
      <span style={styles.settingValue}>{value}</span>
    </div>
  );
}

const styles = {
  screen: { height: '100%', overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' },
  heroCard: { background: `linear-gradient(135deg, ${COLORS.bgCard}, #1E2A5E)`, borderRadius: 20, padding: '24px 20px', border: `1px solid ${COLORS.border}`, textAlign: 'center', marginBottom: 16 },
  avatar: { fontSize: 56, marginBottom: 8 },
  levelName: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  xpText: { color: COLORS.gold, fontWeight: 700, fontSize: 16, marginBottom: 12 },
  progressTrack: { background: COLORS.border, borderRadius: 6, height: 10, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, transition: 'width 1s ease' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 },
  statCard: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' },
  statValue: { color: COLORS.textPrimary, fontWeight: 800, fontSize: 18, marginTop: 4 },
  statLabel: { color: COLORS.textSecondary, fontSize: 11 },
  section: { marginBottom: 16 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' },
  settingRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` },
  settingIcon: { fontSize: 18, marginRight: 12 },
  settingLabel: { color: COLORS.textSecondary, flex: 1, fontSize: 14 },
  settingValue: { color: COLORS.textPrimary, fontWeight: 600, fontSize: 14 },
  subjectRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  subjectChip: { fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20 },
  uid: { color: COLORS.border, fontSize: 11, textAlign: 'center', marginTop: 16 },
};
