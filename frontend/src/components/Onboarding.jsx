import React, { useState, useEffect } from 'react';
import { COLORS, AGE_MODES, SUBJECTS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

const STEPS = ['welcome', 'age', 'subjects', 'plan'];

const NEURO_TIPS = [
  'Read-aloud available on every card',
  'Larger text and calm colours',
  'Skip any card with one swipe',
  'No timers or pressure — learn at your pace',
];

export default function Onboarding({ onDone }) {
  const { uid, setProfile } = useUser();
  const [step, setStep] = useState(0);
  const [neuro, setNeuro] = useState(false);
  const [ageMode, setAgeMode] = useState('explorer');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (s) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const finish = async () => {
    setLoading(true);
    try {
      await api.onboardUser(uid, {
        age_mode: ageMode,
        subjects: subjects.length ? subjects : Object.keys(SUBJECTS),
        neuro_mode: neuro,
      });
      setProfile(p => ({ ...p, onboarded: true, age_mode: ageMode, subjects, neuro_mode: neuro }));
      onDone();
    } catch (e) {
      console.error(e);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="onboarding-screen" style={styles.screen}>
      {/* Progress dots */}
      <div style={styles.dots}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ ...styles.dot, background: i <= step ? COLORS.accent : COLORS.border }} />
        ))}
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div style={styles.stepContainer} data-testid="onboarding-step-welcome">
          <div style={styles.mascotBig}>🌱</div>
          <h1 style={styles.h1}>Welcome to<br /><span style={{ color: COLORS.accent }}>STEMScroll</span></h1>
          <p style={styles.sub}>Swipe through bite-size STEM facts, quizzes, and experiments. Every card earns XP!</p>

          <div style={styles.neuroCard}>
            <div style={styles.neuroRow}>
              <div>
                <div style={styles.neuroTitle}>Neuro-friendly mode</div>
                <div style={styles.neuroSub}>Extra calm, dyslexia-friendly layout</div>
              </div>
              <button
                data-testid="neuro-toggle"
                onClick={() => setNeuro(n => !n)}
                style={{ ...styles.toggle, background: neuro ? COLORS.accent : COLORS.border }}
              >
                <div style={{ ...styles.toggleThumb, transform: neuro ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>
            {neuro && (
              <ul style={styles.neuroList}>
                {NEURO_TIPS.map((t, i) => (
                  <li key={i} style={styles.neuroItem}>
                    <span style={{ color: COLORS.mint }}>✓</span> {t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button data-testid="onboarding-next-0" style={styles.btn} onClick={() => setStep(1)}>
            Let's go! →
          </button>
        </div>
      )}

      {/* Step 1: Age Mode */}
      {step === 1 && (
        <div style={styles.stepContainer} data-testid="onboarding-step-age">
          <div style={styles.mascotBig}>🔭</div>
          <h2 style={styles.h2}>How old are you?</h2>
          <p style={styles.sub}>This adjusts language and content complexity</p>
          <div style={styles.ageModeGrid}>
            {Object.entries(AGE_MODES).map(([key, val]) => (
              <button
                key={key}
                data-testid={`age-mode-${key}`}
                onClick={() => setAgeMode(key)}
                style={{
                  ...styles.ageModeBtn,
                  border: `2px solid ${ageMode === key ? COLORS.accent : COLORS.border}`,
                  background: ageMode === key ? COLORS.accentGlow : COLORS.bgCard,
                }}
              >
                <div style={{ fontSize: 32 }}>{val.icon}</div>
                <div style={styles.ageModeLabel}>{val.label}</div>
                <div style={styles.ageModeAges}>Ages {val.ages}</div>
              </button>
            ))}
          </div>
          <div style={styles.navRow}>
            <button style={styles.btnSecondary} onClick={() => setStep(0)}>← Back</button>
            <button data-testid="onboarding-next-1" style={styles.btn} onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 2: Subjects */}
      {step === 2 && (
        <div style={styles.stepContainer} data-testid="onboarding-step-subjects">
          <div style={styles.mascotBig}>🧬</div>
          <h2 style={styles.h2}>Pick your favourite topics</h2>
          <p style={styles.sub}>Choose as many as you like (or all of them!)</p>
          <div style={styles.subjectGrid}>
            {Object.entries(SUBJECTS).map(([key, val]) => {
              const sel = subjects.includes(key);
              return (
                <button
                  key={key}
                  data-testid={`subject-${key}`}
                  onClick={() => toggleSubject(key)}
                  style={{
                    ...styles.subjectBtn,
                    border: `2px solid ${sel ? val.color : COLORS.border}`,
                    background: sel ? `${val.color}22` : COLORS.bgCard,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{val.emoji}</span>
                  <span style={{ ...styles.subjectLabel, color: sel ? val.color : COLORS.textSecondary }}>
                    {val.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={styles.navRow}>
            <button style={styles.btnSecondary} onClick={() => setStep(1)}>← Back</button>
            <button data-testid="onboarding-next-2" style={styles.btn} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Growth plan */}
      {step === 3 && (
        <div style={styles.stepContainer} data-testid="onboarding-step-plan">
          <div style={styles.mascotBig}>🚀</div>
          <h2 style={styles.h2}>Your learning plan</h2>
          <div style={styles.planCard}>
            <PlanRow icon="🎯" label="Age mode" value={AGE_MODES[ageMode]?.label} />
            <PlanRow icon="📚" label="Topics" value={subjects.length ? `${subjects.length} selected` : 'All topics'} />
            <PlanRow icon="🧠" label="Neuro mode" value={neuro ? 'On' : 'Off'} />
            <PlanRow icon="⚡" label="Starting XP" value="0 XP" />
            <PlanRow icon="🏆" label="First level" value="Curious Atom" />
          </div>
          <div style={styles.navRow}>
            <button style={styles.btnSecondary} onClick={() => setStep(2)}>← Back</button>
            <button data-testid="onboarding-start" style={{ ...styles.btn, minWidth: 160 }} onClick={finish} disabled={loading}>
              {loading ? 'Starting…' : 'Start Learning! 🌟'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.textSecondary, fontSize: 14 }}>{icon} {label}</span>
      <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 14 }}>{value}</span>
    </div>
  );
}

const styles = {
  screen: { minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', boxSizing: 'border-box' },
  dots: { display: 'flex', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, transition: 'background 0.3s' },
  stepContainer: { width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  mascotBig: { fontSize: 64, marginBottom: 8, filter: 'drop-shadow(0 0 20px rgba(123,97,255,0.4))' },
  h1: { color: COLORS.textPrimary, fontSize: 32, fontWeight: 800, textAlign: 'center', margin: 0, lineHeight: 1.3 },
  h2: { color: COLORS.textPrimary, fontSize: 26, fontWeight: 800, textAlign: 'center', margin: 0 },
  sub: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', margin: 0, lineHeight: 1.6 },
  btn: { background: `linear-gradient(135deg, ${COLORS.accent}, #5B41DF)`, color: '#fff', border: 'none', borderRadius: 24, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', minWidth: 140, marginTop: 8 },
  btnSecondary: { background: 'transparent', color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '14px 24px', fontSize: 15, cursor: 'pointer' },
  navRow: { display: 'flex', gap: 12, justifyContent: 'center', width: '100%', marginTop: 8 },
  neuroCard: { width: '100%', background: COLORS.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}` },
  neuroRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  neuroTitle: { color: COLORS.textPrimary, fontWeight: 700, fontSize: 15 },
  neuroSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  toggle: { width: 52, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 0.3s' },
  toggleThumb: { position: 'absolute', top: 4, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'transform 0.3s' },
  neuroList: { listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  neuroItem: { color: COLORS.textSecondary, fontSize: 13 },
  ageModeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' },
  ageModeBtn: { borderRadius: 16, padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' },
  ageModeLabel: { color: COLORS.textPrimary, fontWeight: 700, fontSize: 13 },
  ageModeAges: { color: COLORS.textSecondary, fontSize: 11 },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%' },
  subjectBtn: { borderRadius: 12, padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' },
  subjectLabel: { fontSize: 11, fontWeight: 600 },
  planCard: { width: '100%', background: COLORS.bgCard, borderRadius: 16, padding: '8px 20px', border: `1px solid ${COLORS.border}` },
};
