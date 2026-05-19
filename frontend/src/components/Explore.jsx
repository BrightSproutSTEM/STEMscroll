import React, { useState, useEffect } from 'react';
import { COLORS, SUBJECTS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

export default function Explore() {
  const { uid, profile } = useUser();
  const [subject, setSubject] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const TYPES = ['fact', 'quiz', 'experiment', 'story', 'diagram'];
  const [typeFilter, setTypeFilter] = useState('');

  const generate = async () => {
    setGenerating(true);
    setResult(null);
    setError('');
    try {
      const card = await api.generateCard(uid, subject || null, profile?.age_mode || 'explorer');
      setResult(card);
    } catch (e) {
      setError('Generation failed. Try again or check your connection.');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={styles.screen} data-testid="explore-screen">
      <h2 style={styles.title}>Explore</h2>
      <p style={styles.sub}>Generate a new STEM card using AI</p>

      {/* Subject chips */}
      <div style={styles.section}>
        <p style={styles.label}>Topic (optional)</p>
        <div style={styles.chipRow}>
          {Object.entries(SUBJECTS).map(([key, val]) => (
            <button
              key={key}
              data-testid={`explore-subject-${key}`}
              onClick={() => setSubject(s => s === key ? '' : key)}
              style={{
                ...styles.chip,
                background: subject === key ? `${val.color}33` : COLORS.bgCard,
                border: `1.5px solid ${subject === key ? val.color : COLORS.border}`,
                color: subject === key ? val.color : COLORS.textSecondary,
              }}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type chips */}
      <div style={styles.section}>
        <p style={styles.label}>Card type (optional)</p>
        <div style={styles.chipRow}>
          {TYPES.map(t => (
            <button
              key={t}
              data-testid={`explore-type-${t}`}
              onClick={() => setTypeFilter(f => f === t ? '' : t)}
              style={{ ...styles.chip, background: typeFilter === t ? COLORS.accentGlow : COLORS.bgCard, border: `1.5px solid ${typeFilter === t ? COLORS.accent : COLORS.border}`, color: typeFilter === t ? COLORS.accent : COLORS.textSecondary }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        data-testid="generate-btn"
        onClick={generate}
        disabled={generating}
        style={{ ...styles.genBtn, opacity: generating ? 0.7 : 1 }}
      >
        {generating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={styles.mini_spinner} /> Generating…
          </span>
        ) : '✨ Generate Card'}
      </button>

      {error && <p style={styles.error} data-testid="generate-error">{error}</p>}

      {result && (
        <div style={styles.resultCard} data-testid="generated-card">
          <div style={styles.resultHeader}>
            <span style={{ fontSize: 36 }}>{result.emoji}</span>
            <div>
              <div style={{ color: COLORS.textPrimary, fontWeight: 800, fontSize: 16 }}>{result.headline}</div>
              <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>{result.type} · {result.subject}</div>
            </div>
          </div>
          <p style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.body}</p>
          {result.source && <p style={{ color: COLORS.sky, fontSize: 12, margin: '8px 0 0' }}>Source: {result.source}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <span style={{ background: `${result.confidence >= 0.85 ? '#4CAF50' : '#FF9800'}22`, color: result.confidence >= 0.85 ? COLORS.mint : COLORS.orange, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {result.confidence >= 0.85 ? '✓ VERIFIED' : '⚠ UNVERIFIED'} ({Math.round((result.confidence || 0) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: { height: '100%', overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sub: { color: COLORS.textSecondary, fontSize: 14, margin: '0 0 20px' },
  section: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, padding: '6px 12px', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 },
  genBtn: { width: '100%', padding: '14px', background: `linear-gradient(135deg, ${COLORS.accent}, #5B41DF)`, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  mini_spinner: { display: 'inline-block', width: 16, height: 16, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  error: { color: COLORS.coral, fontSize: 14, textAlign: 'center', margin: '0 0 16px' },
  resultCard: { background: COLORS.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}` },
  resultHeader: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 },
};
