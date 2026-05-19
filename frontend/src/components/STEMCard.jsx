import React, { useState } from 'react';
import { COLORS, SUBJECTS, getMascotForCard, getMascotImage } from '../theme';

// ── Mascot circular avatar ────────────────────────────────────────────────
function MascotAvatar({ mascot, size = 48, pose = 'default' }) {
  const imgSrc = getMascotImage(mascot.id, pose);
  return (
    <div
      data-testid={`mascot-${mascot.id}`}
      style={{
        width: size, height: size, borderRadius: size / 2,
        border: `2px solid ${mascot.color}`,
        background: `linear-gradient(135deg, ${mascot.bgColor}, rgba(255,255,255,0.04))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      {imgSrc
        ? <img src={imgSrc} alt={mascot.name} style={{ width: size * 0.94, height: size * 0.94, objectFit: 'contain' }} />
        : <span style={{ fontSize: size * 0.52 }}>{mascot.emoji}</span>
      }
    </div>
  );
}

// ── Quiz sub-component ────────────────────────────────────────────────────
function QuizBody({ card, mascot }) {
  const [picked, setPicked] = useState(null);
  const correct = card.correctAnswer ?? 0;
  const isCorrect = picked === correct;

  return (
    <div>
      <p style={S.body}>{card.body}</p>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(card.quizOptions || []).map((opt, idx) => {
          const showResult = picked !== null;
          const isCorrectAns = idx === correct;
          const isPicked = picked === idx;
          let borderColor = COLORS.border;
          let bg = 'rgba(255,255,255,0.06)';
          if (showResult && isCorrectAns) { borderColor = COLORS.sproutGreen; bg = 'rgba(76,175,80,0.18)'; }
          else if (showResult && isPicked && !isCorrectAns) { borderColor = COLORS.plasmaPink; bg = 'rgba(255,94,125,0.18)'; }
          return (
            <button
              key={idx}
              data-testid={`quiz-option-${idx}`}
              disabled={picked !== null}
              onClick={() => setPicked(idx)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border: `1.5px solid ${borderColor}`, borderRadius: 16, padding: '14px', cursor: picked !== null ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: COLORS.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 600, flex: 1 }}>{opt}</span>
              {showResult && isCorrectAns && <span style={{ color: COLORS.sproutGreen, fontSize: 20 }}>✓</span>}
              {showResult && isPicked && !isCorrectAns && <span style={{ color: COLORS.plasmaPink, fontSize: 20 }}>✗</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 12 }} data-testid="quiz-reaction">
          <MascotAvatar mascot={mascot} size={56} pose={isCorrect ? 'thumbsUp' : 'surprise'} />
          <div style={{ flex: 1 }}>
            <p style={{ color: isCorrect ? COLORS.sproutGreen : COLORS.plasmaPink, fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>
              {isCorrect ? mascot.messages.quizRight : mascot.messages.quizWrong}
            </p>
            {card.explanation && (
              <p style={{ color: COLORS.stardust, fontSize: 14, lineHeight: 1.5, margin: 0 }} data-testid="quiz-explanation">
                {card.explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Experiment sub-component ──────────────────────────────────────────────
function ExperimentBody({ card }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div>
      <p style={S.body}>{card.body}</p>
      {card.materials?.length > 0 && (
        <>
          <p style={S.sectionLabel}>You'll need:</p>
          {card.materials.map((m, i) => <p key={i} style={S.bullet}>• {m}</p>)}
        </>
      )}
      {card.steps?.length > 0 && (
        <>
          <p style={S.sectionLabel}>Steps:</p>
          {card.steps.map((s, i) => <p key={i} style={S.bullet}>{i + 1}. {s}</p>)}
        </>
      )}
      <button
        data-testid="reveal-result-btn"
        onClick={() => setReveal(r => !r)}
        style={S.revealBtn}
      >
        <span>{reveal ? '🙈' : '👁'}</span>
        <span style={{ color: COLORS.auroraTeal, fontWeight: 700, fontSize: 14 }}>{reveal ? 'Hide' : 'What happens?'}</span>
      </button>
      {reveal && card.whatHappens && (
        <div style={S.explainBox}>
          <p style={S.explainLabel}>The science:</p>
          <p style={S.explainText}>{card.whatHappens}</p>
          {card.parentNote && <p style={{ ...S.explainText, marginTop: 8, fontStyle: 'italic' }}>📝 {card.parentNote}</p>}
        </div>
      )}
    </div>
  );
}

// ── Diagram sub-component ─────────────────────────────────────────────────
function DiagramBody({ card }) {
  return (
    <div>
      <p style={S.body}>{card.body}</p>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(card.diagramParts || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.auroraTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: COLORS.cosmos, fontWeight: 900, fontSize: 13 }}>{i + 1}</span>
            </div>
            <div>
              <p style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 15, margin: 0 }}>{p.label}</p>
              <p style={{ color: COLORS.textSecondary, fontSize: 13, margin: '2px 0 0' }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main STEMCard ─────────────────────────────────────────────────────────
export default function STEMCard({ card, onSave, ageMode, isSaved: isSavedProp }) {
  const [saved, setSaved] = useState(isSavedProp || false);
  const [speaking, setSpeaking] = useState(false);

  const subject = SUBJECTS[card.subject] || SUBJECTS.physics;
  const mascot  = getMascotForCard(card, ageMode);
  const verified = card.verified !== false && (card.confidence ?? 0.95) >= 0.85;
  const flagged  = !verified && (card.confidence ?? 0) >= 0.65;

  const handleSave = () => {
    if (saved) return;
    setSaved(true);
    onSave && onSave(card);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const text = `${card.headline}. ${card.body || ''}${card.explanation ? '. ' + card.explanation : ''}`;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = ageMode === 'explorer' ? 0.85 : 0.95;
      u.pitch = 1.05;
      u.onend = u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    }
  };

  const openSource = () => {
    if (card.source_url) window.open(card.source_url, '_blank');
  };

  return (
    <div
      data-testid={`stem-card-${card.id}`}
      style={{
        ...S.root,
        background: `linear-gradient(135deg, ${subject.gradient[0]}, ${COLORS.cosmos})`,
      }}
    >
      {/* ── Top bar: subject pill + verify + TTS ── */}
      <div style={S.topBar}>
        <div style={{ ...S.subjectPill, borderColor: subject.color }}>
          <span style={{ fontSize: 16 }}>{subject.emoji}</span>
          <span style={{ color: subject.color, fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>
            {subject.label.toUpperCase()}
          </span>
        </div>

        {verified ? (
          <div style={S.verifiedPill} data-testid={`verified-badge-${card.id}`}>
            <span style={{ fontSize: 12 }}>🛡</span>
            <span style={S.verifiedText}>VERIFIED</span>
          </div>
        ) : flagged ? (
          <div style={S.unverifiedPill} data-testid={`unverified-badge-${card.id}`}>
            <span style={{ fontSize: 12 }}>⚠</span>
            <span style={S.unverifiedText}>CHECK WITH A GROWN-UP</span>
          </div>
        ) : null}

        <button
          data-testid={`tts-btn-${card.id}`}
          onClick={handleSpeak}
          style={{ ...S.ttsBtn, ...(speaking ? { background: COLORS.auroraTeal, borderColor: COLORS.auroraTeal } : {}) }}
          title="Read aloud"
        >
          <span style={{ fontSize: 16, color: speaking ? COLORS.cosmos : COLORS.textPrimary }}>
            {speaking ? '🔊' : '🔈'}
          </span>
        </button>
      </div>

      {/* ── Scrollable card body ── */}
      <div style={S.scrollBody}>
        <div data-testid={`card-emoji-${card.id}`} style={S.emoji}>{card.emoji}</div>
        <h2 data-testid={`card-headline-${card.id}`} style={S.headline}>{card.headline}</h2>

        {card.type === 'fact'       && <p data-testid={`card-body-${card.id}`} style={{ ...S.body, ...(ageMode === 'explorer' ? S.bodyLarge : {}) }}>{card.body}</p>}
        {card.type === 'quiz'       && <QuizBody card={card} mascot={mascot} />}
        {card.type === 'experiment' && <ExperimentBody card={card} />}
        {card.type === 'story'      && <p style={{ ...S.body, fontStyle: 'italic' }}>{card.body}</p>}
        {card.type === 'diagram'    && <DiagramBody card={card} />}

        {/* Source pill */}
        {card.source && (
          <button
            data-testid={`source-pill-${card.id}`}
            onClick={openSource}
            disabled={!card.source_url}
            style={S.sourcePill}
          >
            <span style={{ fontSize: 13 }}>📚</span>
            <span style={S.sourceText}>Source: {card.source}</span>
            {card.source_url && <span style={{ fontSize: 12, color: COLORS.auroraTeal }}>↗</span>}
          </button>
        )}

        {/* Mascot footer ── REAL PNG IMAGE */}
        <div style={S.mascotFooter} data-testid={`mascot-footer-${card.id}`}>
          <MascotAvatar mascot={mascot} size={48} pose="default" />
          <div style={{ flex: 1, marginLeft: 12 }}>
            <p style={S.mascotName}>{mascot.name}</p>
            <p style={S.mascotTagline}>{mascot.tagline}</p>
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={S.actions}>
        <button
          data-testid={`save-btn-${card.id}`}
          onClick={handleSave}
          style={{ ...S.actionBtn, ...(saved ? { background: 'rgba(255,94,125,0.2)', borderColor: COLORS.plasmaPink } : {}) }}
        >
          <span style={{ fontSize: 22, color: saved ? COLORS.plasmaPink : COLORS.textPrimary }}>
            {saved ? '♥' : '♡'}
          </span>
          <span style={{ ...S.actionLabel, color: saved ? COLORS.plasmaPink : COLORS.textPrimary }}>
            {saved ? 'Saved' : 'Save'}
          </span>
        </button>

        <div style={S.xpBadge} data-testid={`xp-badge-${card.id}`}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={S.xpText}>+{card.xpValue || 5} XP</span>
        </div>

        <div style={S.swipeHint}>
          <span style={{ color: COLORS.moonrock, fontSize: 18 }}>↑</span>
          <span style={S.swipeText}>Swipe</span>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  root: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  topBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 0', flexShrink: 0 },
  subjectPill: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 14, border: '1px solid', background: 'rgba(0,0,0,0.25)' },
  verifiedPill: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 10, background: 'rgba(76,175,80,0.18)', border: `1px solid ${COLORS.sproutGreen}` },
  verifiedText: { color: COLORS.sproutGreen, fontSize: 10, fontWeight: 900, letterSpacing: 0.8 },
  unverifiedPill: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 10, background: 'rgba(255,184,48,0.18)', border: `1px solid ${COLORS.solarOrange}` },
  unverifiedText: { color: COLORS.solarOrange, fontSize: 9, fontWeight: 900, letterSpacing: 0.8 },
  ttsBtn: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid ${COLORS.border}`, cursor: 'pointer', flexShrink: 0 },

  scrollBody: { flex: 1, overflowY: 'auto', padding: '8px 20px 12px' },
  emoji: { fontSize: 76, textAlign: 'center', lineHeight: 1.2, margin: '8px 0' },
  headline: { color: COLORS.textPrimary, fontSize: 26, fontWeight: 800, textAlign: 'center', lineHeight: 1.3, margin: '0 0 16px', letterSpacing: -0.5 },
  body: { color: COLORS.stardust, fontSize: 17, lineHeight: '25px', fontWeight: 400, margin: 0 },
  bodyLarge: { fontSize: 20, lineHeight: '28px' },

  sectionLabel: { color: COLORS.auroraTeal, fontWeight: 800, fontSize: 13, margin: '14px 0 6px', letterSpacing: 0.5 },
  bullet: { color: COLORS.stardust, fontSize: 15, lineHeight: '22px', margin: '0 0 2px' },
  revealBtn: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', background: 'rgba(0,229,195,0.1)', border: `1px solid ${COLORS.auroraTeal}`, borderRadius: 12, cursor: 'pointer' },
  explainBox: { marginTop: 14, background: 'rgba(0,229,195,0.08)', border: `1px solid ${COLORS.auroraTeal}`, borderRadius: 14, padding: 14 },
  explainLabel: { color: COLORS.auroraTeal, fontWeight: 700, fontSize: 13, margin: '0 0 6px' },
  explainText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: '21px', margin: 0 },

  sourcePill: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '6px 10px', background: 'rgba(0,229,195,0.10)', border: `1px solid ${COLORS.auroraTeal}`, borderRadius: 12, cursor: 'pointer' },
  sourceText: { color: COLORS.auroraTeal, fontSize: 12, fontWeight: 700 },

  mascotFooter: { display: 'flex', alignItems: 'center', marginTop: 18, padding: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: `1px solid ${COLORS.border}` },
  mascotName: { color: COLORS.textPrimary, fontWeight: 800, fontSize: 14, margin: 0 },
  mascotTagline: { color: COLORS.textSecondary, fontSize: 12, margin: '2px 0 0' },

  actions: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px 16px', flexShrink: 0 },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 14, cursor: 'pointer' },
  actionLabel: { fontWeight: 700, fontSize: 14 },
  xpBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(255,184,48,0.15)', border: `1px solid ${COLORS.solarOrange}`, borderRadius: 12 },
  xpText: { color: COLORS.solarOrange, fontWeight: 800, fontSize: 12 },
  swipeHint: { marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  swipeText: { color: COLORS.moonrock, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 2 },
};
