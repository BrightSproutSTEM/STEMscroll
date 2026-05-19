import React, { useState } from 'react';
import { COLORS, SUBJECTS, TYPE_COLORS, CARD_GRADIENTS, MASCOTS } from '../theme';

const TYPE_LABELS = { fact: 'FACT', quiz: 'QUIZ', experiment: 'TRY IT', story: 'STORY', diagram: 'DIAGRAM' };

export default function STEMCard({ card, onSave, ageMode }) {
  const [quizState, setQuizState] = useState({ answered: false, selected: null });
  const [speaking, setSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);

  const subject = SUBJECTS[card.subject] || {};
  const typeColor = TYPE_COLORS[card.type] || COLORS.accent;
  const mascot = MASCOTS[card.mascot] || MASCOTS.sprouty;
  const gradient = CARD_GRADIENTS[card.type] || CARD_GRADIENTS.fact;

  const handleSave = () => {
    if (saved) return;
    setSaved(true);
    onSave && onSave(card);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const text = `${card.headline}. ${card.body || ''}`;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = ageMode === 'explorer' ? 0.8 : 1.0;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    }
  };

  const handleQuiz = (idx) => {
    if (quizState.answered) return;
    setQuizState({ answered: true, selected: idx });
  };

  const isVerified = card.confidence >= 0.85;

  return (
    <div
      data-testid={`stem-card-${card.id}`}
      style={{
        ...styles.card,
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
      }}
    >
      {/* Top row: type badge + subject + verify badge */}
      <div style={styles.topRow}>
        <span data-testid={`card-type-${card.id}`} style={{ ...styles.typeBadge, background: `${typeColor}22`, color: typeColor }}>
          {TYPE_LABELS[card.type] || card.type?.toUpperCase()}
        </span>
        {subject.emoji && (
          <span style={styles.subjectPill}>
            {subject.emoji} <span style={{ color: subject.color }}>{subject.label}</span>
          </span>
        )}
        <span
          data-testid={`verify-badge-${card.id}`}
          style={{ ...styles.verifyBadge, background: isVerified ? '#4CAF5022' : '#FF980022', color: isVerified ? COLORS.mint : COLORS.orange }}
        >
          {isVerified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
        </span>
      </div>

      {/* Emoji hero */}
      <div data-testid={`card-emoji-${card.id}`} style={styles.emoji}>{card.emoji}</div>

      {/* Headline */}
      <h2 data-testid={`card-headline-${card.id}`} style={styles.headline}>{card.headline}</h2>

      {/* Card type specific content */}
      {card.type === 'quiz' ? (
        <QuizBody card={card} quizState={quizState} onSelect={handleQuiz} />
      ) : card.type === 'experiment' ? (
        <ExperimentBody card={card} />
      ) : card.type === 'diagram' ? (
        <DiagramBody card={card} />
      ) : (
        <p data-testid={`card-body-${card.id}`} style={styles.body}>{card.body}</p>
      )}

      {/* Source */}
      {card.source && (
        <div style={styles.sourcePill}>
          <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>Source: </span>
          <span style={{ color: COLORS.sky, fontSize: 12, fontWeight: 600 }}>{card.source}</span>
        </div>
      )}

      {/* Footer: mascot + actions */}
      <div style={styles.footer}>
        <div style={styles.mascotRow}>
          <span style={styles.mascotEmoji}>{mascot.emoji}</span>
          <span style={styles.mascotName}>{mascot.name}</span>
          <span style={{ ...styles.xpBadge }}>+{card.xpValue || 5} XP</span>
        </div>
        <div style={styles.actions}>
          <button
            data-testid={`speak-btn-${card.id}`}
            onClick={handleSpeak}
            style={{ ...styles.actionBtn, background: speaking ? COLORS.accentGlow : 'transparent' }}
            title="Read aloud"
          >
            {speaking ? '🔊' : '🔈'}
          </button>
          <button
            data-testid={`save-btn-${card.id}`}
            onClick={handleSave}
            style={{ ...styles.actionBtn, background: saved ? '#FFD70022' : 'transparent' }}
            title={saved ? 'Saved!' : 'Save card'}
          >
            {saved ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizBody({ card, quizState, onSelect }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="quiz-options">
      {(card.quizOptions || []).map((opt, i) => {
        const isCorrect = i === card.correctAnswer;
        let bg = `${COLORS.bgCardAlt}`;
        let border = COLORS.border;
        if (quizState.answered && i === quizState.selected) {
          bg = isCorrect ? '#4CAF5022' : '#FF6B6B22';
          border = isCorrect ? COLORS.green : COLORS.coral;
        } else if (quizState.answered && isCorrect) {
          bg = '#4CAF5022'; border = COLORS.green;
        }
        return (
          <button
            key={i}
            data-testid={`quiz-option-${i}`}
            onClick={() => onSelect(i)}
            style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '10px 14px', color: COLORS.textPrimary, fontSize: 14, textAlign: 'left', cursor: quizState.answered ? 'default' : 'pointer', transition: 'all 0.2s' }}
          >
            <span style={{ color: COLORS.textSecondary, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        );
      })}
      {quizState.answered && card.explanation && (
        <div data-testid="quiz-explanation" style={{ background: '#7B61FF11', borderRadius: 12, padding: '10px 14px', color: COLORS.textSecondary, fontSize: 13, borderLeft: `3px solid ${COLORS.accent}` }}>
          {card.explanation}
        </div>
      )}
    </div>
  );
}

function ExperimentBody({ card }) {
  return (
    <div style={{ width: '100%' }} data-testid="experiment-body">
      <p style={{ ...styles.body, marginBottom: 12 }}>{card.body}</p>
      {card.steps && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {card.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ background: COLORS.green + '33', color: COLORS.green, width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagramBody({ card }) {
  return (
    <div style={{ width: '100%' }} data-testid="diagram-body">
      <p style={{ ...styles.body, marginBottom: 12 }}>{card.body}</p>
      {card.diagramParts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {card.diagramParts.map((part, i) => (
            <div key={i} style={{ background: COLORS.bgCardAlt, borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 10 }}>
              <span style={{ color: COLORS.sky, fontWeight: 700, fontSize: 13, minWidth: 80, flexShrink: 0 }}>{part.label}</span>
              <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{part.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { width: '100%', maxWidth: 440, borderRadius: 24, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box', border: `1px solid ${COLORS.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', minHeight: 0, flex: 1, maxHeight: '100%', overflow: 'auto' },
  topRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  typeBadge: { fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: 1.2 },
  subjectPill: { fontSize: 12, color: COLORS.textSecondary, padding: '2px 8px', borderRadius: 12, background: COLORS.bgCardAlt },
  verifyBadge: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: 0.5, marginLeft: 'auto' },
  emoji: { fontSize: 64, textAlign: 'center', lineHeight: 1.2 },
  headline: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3, textAlign: 'center' },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7, margin: 0, textAlign: 'left' },
  sourcePill: { display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${COLORS.border}` },
  mascotRow: { display: 'flex', alignItems: 'center', gap: 6 },
  mascotEmoji: { fontSize: 22 },
  mascotName: { color: COLORS.textSecondary, fontSize: 12 },
  xpBadge: { background: '#FFD70022', color: COLORS.gold, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 },
  actions: { display: 'flex', gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, border: `1px solid ${COLORS.border}`, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
};
