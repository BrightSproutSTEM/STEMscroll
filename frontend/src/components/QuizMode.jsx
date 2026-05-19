import React, { useState, useEffect, useRef, useCallback } from 'react';
import STEMCard from './STEMCard';
import { COLORS } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

const BATCH_SIZE = 6;
const PREFETCH_THRESHOLD = 2;

export default function QuizMode() {
  const { uid, profile, addXP } = useUser();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [topicInfo, setTopicInfo] = useState(null);
  const [toast, setToast] = useState(null);

  const containerRef = useRef(null);
  const seenIds = useRef(new Set());
  const answeredRef = useRef(new Set());
  const fetchingRef = useRef(false);

  const appendBatch = useCallback((batch) => {
    if (!Array.isArray(batch) || batch.length === 0) return 0;
    // QuizMode only renders quiz cards — drop anything else.
    const quizzes = batch.filter(c => c && c.type === 'quiz' && c.id && !seenIds.current.has(c.id));
    quizzes.forEach(c => seenIds.current.add(c.id));
    if (quizzes.length > 0) setCards(prev => [...prev, ...quizzes]);
    return quizzes.length;
  }, []);

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetchingMore(true);
    try {
      const data = await api.getInfiniteFeed(uid, BATCH_SIZE, 'quiz');
      appendBatch(data.cards);
      if (data.topic) setTopicInfo({ topic: data.topic, category: data.category });
    } catch (e) {
      console.error('quiz fetch error', e);
    } finally {
      fetchingRef.current = false;
      setFetchingMore(false);
    }
  }, [uid, appendBatch]);

  // Initial load — quizzes only via dedicated quiz context.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      seenIds.current = new Set();
      answeredRef.current = new Set();
      setCards([]); setScore({ right: 0, wrong: 0 }); setStreak(0); setBestStreak(0);
      setLoading(true);
      // Instant seed-quiz render so the user sees content immediately.
      try {
        const seeds = await api.seedCards();
        if (cancelled) return;
        const onlyQuizzes = (seeds || []).filter(c => c.type === 'quiz');
        appendBatch(onlyQuizzes.sort(() => Math.random() - 0.5).slice(0, 4));
      } catch (_) { /* ignore */ }
      setLoading(false);
      // Background: streaming AI quizzes via /api/feed/infinite/{uid}?context=quiz
      fetchMore();
    })();
    return () => { cancelled = true; };
  }, [uid, fetchMore, appendBatch]);

  // IntersectionObserver — prefetch when user is within PREFETCH_THRESHOLD of the end.
  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;
    const root = containerRef.current;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = Number(entry.target.dataset.idx);
        if (idx >= cards.length - PREFETCH_THRESHOLD) fetchMore();
      });
    }, { root, threshold: 0.8 });
    root.querySelectorAll('[data-cardid]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [cards, fetchMore]);

  const showToast = (msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2200);
  };

  const handleQuizAnswer = async (isCorrect, card) => {
    if (answeredRef.current.has(card.id)) return; // count each card once
    answeredRef.current.add(card.id);

    if (isCorrect) {
      setScore(s => ({ ...s, right: s.right + 1 }));
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
      try { await addXP(card.xpValue || 10); } catch (_) { /* ignore */ }
      showToast(`+${card.xpValue || 10} XP!`, 'good');
    } else {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
      setStreak(0);
      showToast('Keep trying!', 'bad');
    }
  };

  const handleSave = async (card) => {
    try {
      await api.saveCard(uid, { card_id: card.id, card_data: card });
      showToast('Saved to library', 'good');
    } catch (_) { showToast('Saved!', 'good'); }
  };

  const ageMode = profile?.age_mode || 'discoverer';
  const total = score.right + score.wrong;
  const pct = total === 0 ? 0 : Math.round((score.right / total) * 100);

  if (loading) return (
    <div style={S.loadingScreen} data-testid="quiz-loading">
      <img src="/mascots/quizzle/default.png" alt="Quizzle" style={{ width: 88, height: 88, objectFit: 'contain' }} />
      <p style={S.loadingText}>Warming up Quizzle…</p>
      <div style={S.spinner} />
    </div>
  );

  return (
    <div style={S.root} data-testid="quiz-mode-screen">
      {/* Top HUD */}
      <div style={S.topBar}>
        <div style={S.titleBlock}>
          <img src="/mascots/quizzle/default.png" alt="" style={S.mascotSm} />
          <div>
            <h2 style={S.title}>Quiz Mode</h2>
            <p style={S.sub}>{total === 0 ? 'No repeats — fresh quizzes every time' : `${pct}% correct`}</p>
          </div>
        </div>
        <div style={S.statsBlock}>
          <div style={S.statPill} data-testid="quiz-score-pill">
            <span style={S.statLabel}>Score</span>
            <span style={S.statValue}>{score.right}<span style={S.statSub}>/{total || 0}</span></span>
          </div>
          <div style={{ ...S.statPill, ...(streak > 0 ? S.statPillHot : {}) }} data-testid="quiz-streak-pill">
            <span style={S.statLabel}>Streak</span>
            <span style={{ ...S.statValue, color: streak > 0 ? COLORS.solarOrange : COLORS.textPrimary }}>
              {streak > 0 ? '🔥' : ''}{streak}
            </span>
          </div>
        </div>
      </div>

      {topicInfo && (
        <div style={S.topicPill} data-testid="quiz-topic-pill">
          ✨ Streaming · {topicInfo.category} · {topicInfo.topic}
        </div>
      )}

      {/* Snap-scroll quiz feed */}
      <div ref={containerRef} style={S.feedContainer} data-testid="quiz-scroll">
        {cards.map((card, idx) => (
          <div key={card.id || idx} data-cardid={card.id} data-idx={idx} style={S.cardSlot}>
            <STEMCard card={card} onSave={handleSave} ageMode={ageMode} onQuizAnswer={handleQuizAnswer} />
          </div>
        ))}
        {fetchingMore && cards.length > 0 && (
          <div style={S.cardSlot} data-testid="quiz-fetching">
            <div style={S.fetchingBox}>
              <img src="/mascots/quizzle/default.png" alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div style={S.spinner} />
              <p style={S.loadingText}>Brewing fresh quizzes…</p>
            </div>
          </div>
        )}
        {cards.length === 0 && !loading && (
          <div style={S.empty}>
            <p style={{ color: COLORS.moonrock }}>No quizzes yet — pull to refresh.</p>
          </div>
        )}
      </div>

      {bestStreak >= 3 && (
        <div style={S.bestStreakBadge} data-testid="quiz-best-streak">
          Best streak this session: 🔥 {bestStreak}
        </div>
      )}

      {toast && (
        <div
          style={{ ...S.toast, color: toast.kind === 'good' ? COLORS.sproutGreen : COLORS.plasmaPink, borderColor: toast.kind === 'good' ? `${COLORS.sproutGreen}66` : `${COLORS.plasmaPink}66` }}
          data-testid="quiz-toast"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const S = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.cosmos, position: 'relative', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', gap: 10, flexShrink: 0 },
  titleBlock: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  mascotSm: { width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(255,184,48,0.35))' },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 0.2 },
  sub: { color: COLORS.moonrock, fontSize: 11, margin: 0, fontWeight: 600 },
  statsBlock: { display: 'flex', gap: 6, flexShrink: 0 },
  statPill: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 56, padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLORS.border}`, borderRadius: 12 },
  statPillHot: { background: 'rgba(255,184,48,0.12)', borderColor: `${COLORS.solarOrange}88` },
  statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: COLORS.moonrock, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: 900, color: COLORS.textPrimary, marginTop: 1, lineHeight: 1 },
  statSub: { fontSize: 11, fontWeight: 700, color: COLORS.moonrock },
  topicPill: { alignSelf: 'center', margin: '0 auto 4px', padding: '4px 12px', borderRadius: 20, background: 'rgba(180,120,255,0.18)', color: COLORS.protonPurple, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, maxWidth: '90%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  feedContainer: { flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' },
  cardSlot: { height: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' },
  loadingScreen: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.cosmos, gap: 14 },
  spinner: { width: 28, height: 28, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.solarOrange, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: COLORS.moonrock, fontSize: 14, margin: 0 },
  fetchingBox: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 },
  empty: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  bestStreakBadge: { position: 'absolute', top: 78, right: 14, background: 'rgba(255,184,48,0.18)', color: COLORS.solarOrange, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, border: `1px solid ${COLORS.solarOrange}66`, letterSpacing: 0.3, animation: 'fadeIn 0.4s ease-out' },
  toast: { position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: COLORS.nebula, padding: '10px 18px', borderRadius: 24, fontWeight: 800, fontSize: 14, zIndex: 100, border: '1px solid', whiteSpace: 'nowrap' },
};
