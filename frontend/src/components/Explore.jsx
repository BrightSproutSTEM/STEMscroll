import React, { useState } from 'react';
import { COLORS, SUBJECTS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

export default function Explore() {
  const { uid, profile } = useUser();
  const [subject, setSubject] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true); setResult(null); setError('');
    try {
      const card = await api.generateCard(uid, subject || null, profile?.age_mode || 'explorer');
      setResult(card);
    } catch (e) {
      setError('Generation failed. Check your connection and try again.');
    } finally { setGenerating(false); }
  };

  return (
    <div style={S.screen} data-testid="explore-screen">
      <div style={S.header}>
        <img src="/mascots/zoomerroo/default.png" alt="Zoomerroo" style={S.headerImg} />
        <div>
          <h2 style={S.title}>Explore</h2>
          <p style={S.sub}>Generate a new STEM card with AI</p>
        </div>
      </div>

      <div style={S.section}>
        <p style={S.label}>Pick a topic (optional)</p>
        <div style={S.chipRow}>
          {Object.entries(SUBJECTS).map(([key, val]) => (
            <button key={key} data-testid={`explore-subject-${key}`}
              onClick={() => setSubject(s => s === key ? '' : key)}
              style={{ ...S.chip, background: subject === key ? `${val.color}33` : COLORS.nebula, border: `1.5px solid ${subject === key ? val.color : COLORS.border}`, color: subject === key ? val.color : COLORS.moonrock }}>
              {val.emoji} {val.label}
            </button>
          ))}
        </div>
      </div>

      <button data-testid="generate-btn" onClick={generate} disabled={generating}
        style={{ ...S.genBtn, opacity: generating ? 0.7 : 1 }}>
        {generating
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={S.miniSpin} /> Generating with AI…</span>
          : '✨ Generate Card'}
      </button>

      {error && <p style={S.error} data-testid="generate-error">{error}</p>}

      {result && (
        <div style={S.resultCard} data-testid="generated-card">
          <div style={S.resultHeader}>
            <span style={{ fontSize: 36 }}>{result.emoji}</span>
            <div>
              <div style={{ color: COLORS.textPrimary, fontWeight: 800, fontSize: 16 }}>{result.headline}</div>
              <div style={{ color: COLORS.moonrock, fontSize: 12 }}>{result.type} · {result.subject}</div>
            </div>
          </div>
          <p style={{ color: COLORS.stardust, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.body}</p>
          {result.source && <p style={{ color: COLORS.auroraTeal, fontSize: 12, margin: '8px 0 0' }}>Source: {result.source}</p>}
          <span style={{ display: 'inline-block', marginTop: 10, background: `${(result.confidence >= 0.85 ? COLORS.sproutGreen : COLORS.solarOrange)}22`, color: result.confidence >= 0.85 ? COLORS.sproutGreen : COLORS.solarOrange, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
            {result.confidence >= 0.85 ? '✓ VERIFIED' : '⚠ UNVERIFIED'} ({Math.round((result.confidence || 0) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}

const S = {
  screen: { height: '100%', overflowY: 'auto', padding: '16px', boxSizing: 'border-box' },
  header: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 },
  headerImg: { width: 60, height: 60, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,109,0,0.3))' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: COLORS.moonrock, fontSize: 13, margin: 0 },
  section: { marginBottom: 16 },
  label: { color: COLORS.moonrock, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, padding: '6px 12px', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 },
  genBtn: { width: '100%', padding: '14px', background: `linear-gradient(135deg, ${COLORS.protonPurple}, #5B41DF)`, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  miniSpin: { display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  error: { color: COLORS.plasmaPink, fontSize: 14, textAlign: 'center', margin: '0 0 16px' },
  resultCard: { background: COLORS.nebula, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}` },
  resultHeader: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 },
};
