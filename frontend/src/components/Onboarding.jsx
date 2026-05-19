import React, { useState, useEffect } from 'react';
import { COLORS, AGE_MODES, SUBJECTS, MASCOTS, getMascotImage } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

const STEPS = ['welcome', 'age', 'subjects', 'plan'];

export default function Onboarding({ onDone }) {
  const { uid, setProfile } = useUser();
  const [step, setStep] = useState(0);
  const [neuro, setNeuro] = useState(false);
  const [ageMode, setAgeMode] = useState('explorer');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = s => setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const finish = async () => {
    setLoading(true);
    try {
      await api.onboardUser(uid, { age_mode: ageMode, subjects: subjects.length ? subjects : Object.keys(SUBJECTS), neuro_mode: neuro });
      setProfile(p => ({ ...p, onboarded: true, age_mode: ageMode, subjects, neuro_mode: neuro }));
      onDone();
    } catch { onDone(); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="onboarding-screen" style={S.screen}>
      {/* Progress dots */}
      <div style={S.dots}>{STEPS.map((_, i) => <div key={i} style={{ ...S.dot, background: i <= step ? COLORS.auroraTeal : COLORS.border }} />)}</div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div style={S.step} data-testid="onboarding-step-welcome">
          <img src="/mascots/sprouty/default.png" alt="Sprouty" style={S.mascotImg} />
          <h1 style={S.h1}>Welcome to<br /><span style={{ color: COLORS.auroraTeal }}>STEMScroll</span></h1>
          <p style={S.sub}>Swipe through bite-size STEM facts, quizzes, and experiments. Every card earns XP!</p>
          <div style={S.neuroCard}>
            <div style={S.neuroRow}>
              <div>
                <div style={S.neuroTitle}>Neuro-friendly mode</div>
                <div style={S.neuroSub}>Larger text, calm colours, no timers</div>
              </div>
              <button data-testid="neuro-toggle" onClick={() => setNeuro(n => !n)}
                style={{ ...S.toggle, background: neuro ? COLORS.auroraTeal : COLORS.border }}>
                <div style={{ ...S.toggleThumb, transform: neuro ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>
            {neuro && <img src="/mascots/ausome-koala/koala-default.png" alt="Ausome" style={{ width: 64, height: 64, objectFit: 'contain', marginTop: 12, alignSelf: 'center' }} />}
          </div>
          <button data-testid="onboarding-next-0" style={S.btn} onClick={() => setStep(1)}>Let's go! →</button>
        </div>
      )}

      {/* Step 1: Age mode */}
      {step === 1 && (
        <div style={S.step} data-testid="onboarding-step-age">
          <img src="/mascots/dr-sprout/thumbsup.png" alt="Dr Sprout" style={S.mascotImg} />
          <h2 style={S.h2}>How old are you?</h2>
          <p style={S.sub}>This adjusts language and content complexity</p>
          <div style={S.ageModeGrid}>
            {Object.entries(AGE_MODES).map(([key, val]) => (
              <button key={key} data-testid={`age-mode-${key}`} onClick={() => setAgeMode(key)}
                style={{ ...S.ageModeBtn, border: `2px solid ${ageMode === key ? COLORS.auroraTeal : COLORS.border}`, background: ageMode === key ? 'rgba(0,229,195,0.12)' : COLORS.nebula }}>
                <div style={{ fontSize: 28 }}>{val.emoji}</div>
                <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 13 }}>{val.label}</div>
                <div style={{ color: COLORS.moonrock, fontSize: 11 }}>{val.desc}</div>
              </button>
            ))}
          </div>
          <div style={S.navRow}>
            <button style={S.btnSec} onClick={() => setStep(0)}>← Back</button>
            <button data-testid="onboarding-next-1" style={S.btn} onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 2: Subjects */}
      {step === 2 && (
        <div style={S.step} data-testid="onboarding-step-subjects">
          <img src="/mascots/zoomerroo/default.png" alt="Zoomerroo" style={S.mascotImg} />
          <h2 style={S.h2}>Pick your topics</h2>
          <p style={S.sub}>Choose as many as you like!</p>
          <div style={S.subjectGrid}>
            {Object.entries(SUBJECTS).map(([key, val]) => {
              const sel = subjects.includes(key);
              return (
                <button key={key} data-testid={`subject-${key}`} onClick={() => toggleSubject(key)}
                  style={{ ...S.subjectBtn, border: `2px solid ${sel ? val.color : COLORS.border}`, background: sel ? `${val.color}22` : COLORS.nebula }}>
                  <span style={{ fontSize: 22 }}>{val.emoji}</span>
                  <span style={{ color: sel ? val.color : COLORS.moonrock, fontSize: 11, fontWeight: 600 }}>{val.label}</span>
                </button>
              );
            })}
          </div>
          <div style={S.navRow}>
            <button style={S.btnSec} onClick={() => setStep(1)}>← Back</button>
            <button data-testid="onboarding-next-2" style={S.btn} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Plan */}
      {step === 3 && (
        <div style={S.step} data-testid="onboarding-step-plan">
          <img src="/mascots/sprouty/surprise.png" alt="Sprouty" style={S.mascotImg} />
          <h2 style={S.h2}>Your learning plan</h2>
          <div style={S.planCard}>
            {[
              { icon: '🎯', label: 'Age mode',  value: AGE_MODES[ageMode]?.label },
              { icon: '📚', label: 'Topics',    value: subjects.length ? `${subjects.length} selected` : 'All topics' },
              { icon: '🧠', label: 'Neuro mode', value: neuro ? 'On' : 'Off' },
              { icon: '⚡', label: 'Starting XP', value: '0 XP' },
              { icon: '🏆', label: 'First level', value: 'Curious Atom' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={S.planRow}>
                <span style={S.planLabel}>{icon} {label}</span>
                <span style={S.planValue}>{value}</span>
              </div>
            ))}
          </div>
          <div style={S.navRow}>
            <button style={S.btnSec} onClick={() => setStep(2)}>← Back</button>
            <button data-testid="onboarding-start" style={{ ...S.btn, minWidth: 180 }} onClick={finish} disabled={loading}>
              {loading ? 'Starting…' : 'Start Learning! 🌟'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  screen: { minHeight: '100vh', background: COLORS.cosmos, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', boxSizing: 'border-box' },
  dots: { display: 'flex', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, transition: 'background 0.3s' },
  step: { width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  mascotImg: { width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,229,195,0.3))' },
  h1: { color: COLORS.textPrimary, fontSize: 30, fontWeight: 900, textAlign: 'center', margin: 0, lineHeight: 1.3 },
  h2: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 800, textAlign: 'center', margin: 0 },
  sub: { color: COLORS.moonrock, fontSize: 15, textAlign: 'center', margin: 0, lineHeight: 1.6 },
  btn: { background: `linear-gradient(135deg, ${COLORS.protonPurple}, #5B41DF)`, color: '#fff', border: 'none', borderRadius: 24, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', minWidth: 140, marginTop: 8 },
  btnSec: { background: 'transparent', color: COLORS.moonrock, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '14px 24px', fontSize: 15, cursor: 'pointer' },
  navRow: { display: 'flex', gap: 12, justifyContent: 'center', width: '100%', marginTop: 8 },
  neuroCard: { width: '100%', background: COLORS.nebula, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' },
  neuroRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  neuroTitle: { color: COLORS.textPrimary, fontWeight: 700, fontSize: 15 },
  neuroSub: { color: COLORS.moonrock, fontSize: 12, marginTop: 2 },
  toggle: { width: 52, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 0.3s' },
  toggleThumb: { position: 'absolute', top: 4, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'transform 0.3s' },
  ageModeGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%' },
  ageModeBtn: { borderRadius: 16, padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%' },
  subjectBtn: { borderRadius: 12, padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' },
  planCard: { width: '100%', background: COLORS.nebula, borderRadius: 16, padding: '8px 20px', border: `1px solid ${COLORS.border}` },
  planRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` },
  planLabel: { color: COLORS.moonrock, fontSize: 14 },
  planValue: { color: COLORS.textPrimary, fontWeight: 700, fontSize: 14 },
};
