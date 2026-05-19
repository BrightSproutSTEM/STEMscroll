import React, { useState, useEffect, useRef, useCallback } from 'react';
import STEMCard from './STEMCard';
import { COLORS, AGE_MODES } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

const BATCH_SIZE = 8;
// Trigger a new fetch when the user is this many cards from the end.
const PREFETCH_THRESHOLD = 3;

export default function Feed() {
  const { uid, profile, addXP } = useUser();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const [topicInfo, setTopicInfo] = useState(null);

  const containerRef = useRef(null);
  const cardTimers = useRef({});
  const viewedRef = useRef(new Set());
  const seenIds = useRef(new Set());
  const fetchingRef = useRef(false);

  // Append batch with dedup-by-id so the same card never renders twice on the client.
  const appendBatch = useCallback((batch) => {
    if (!Array.isArray(batch) || batch.length === 0) return 0;
    const fresh = batch.filter(c => c && c.id && !seenIds.current.has(c.id));
    fresh.forEach(c => seenIds.current.add(c.id));
    if (fresh.length > 0) setCards(prev => [...prev, ...fresh]);
    return fresh.length;
  }, []);

  // Fetch one infinite-feed batch (Gemini-backed). 20–30s on cold start, so we
  // call this in the background after seeds have already rendered.
  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetchingMore(true);
    try {
      const data = await api.getInfiniteFeed(uid, BATCH_SIZE, 'feed');
      appendBatch(data.cards);
      if (data.topic) setTopicInfo({ topic: data.topic, category: data.category, ai: data.aiGenerated });
    } catch (e) {
      console.error('infinite feed error', e);
    } finally {
      fetchingRef.current = false;
      setFetchingMore(false);
    }
  }, [uid, appendBatch]);

  // Initial load — show seeds INSTANTLY, then stream AI batch on top.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      seenIds.current = new Set();
      setCards([]);
      setLoading(true);
      // 1. Instant seed render so the user sees content immediately.
      try {
        const seeds = await api.seedCards();
        if (cancelled) return;
        // Randomise + cap to a reasonable opening set.
        const shuffled = [...seeds].sort(() => Math.random() - 0.5).slice(0, 6);
        appendBatch(shuffled);
      } catch (_) { /* ignore */ }
      setLoading(false);
      // 2. Background: start streaming AI-generated cards.
      fetchMore();
    })();
    return () => { cancelled = true; };
  }, [uid, fetchMore, appendBatch]);

  // Connectivity poller
  useEffect(() => {
    const check = async () => { try { await api.health(); setOnline(true); } catch (_) { setOnline(false); } };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  // Track which card is in view → dwell time, skip/view signals, and prefetch trigger.
  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;
    const root = containerRef.current;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        const cardId = el.dataset.cardid;
        const idx = Number(el.dataset.idx);
        if (!cardId) return;

        if (entry.isIntersecting) {
          cardTimers.current[cardId] = Date.now();
          // Prefetch when user is within PREFETCH_THRESHOLD of the end.
          if (idx >= cards.length - PREFETCH_THRESHOLD) fetchMore();
        } else {
          const enterTime = cardTimers.current[cardId];
          if (enterTime && !viewedRef.current.has(cardId)) {
            const dwell = Date.now() - enterTime;
            delete cardTimers.current[cardId];
            viewedRef.current.add(cardId);
            if (dwell < 2200) api.recordSkip(uid, cardId).catch(() => {});
            else api.recordView(uid, cardId, dwell).catch(() => {});
          }
        }
      });
    }, { root, threshold: 0.8 });

    root.querySelectorAll('[data-cardid]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [cards, uid, fetchMore]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async (card) => {
    try {
      await api.saveCard(uid, { card_id: card.id, card_data: card });
      await addXP(card.xpValue || 5);
      showToast(`+${card.xpValue || 5} XP saved!`);
    } catch (_) { showToast('Saved!'); }
  };

  const ageMode = profile?.age_mode || 'explorer';

  if (loading) return (
    <div style={S.loadingScreen} data-testid="feed-loading">
      <div style={S.mascotLoad}><img src="/mascots/sprouty/thinking.png" alt="Loading" style={{ width: 80, height: 80, objectFit: 'contain' }} /></div>
      <p style={S.loadingText}>Loading your STEM feed…</p>
      <div style={S.spinner} />
    </div>
  );

  return (
    <div style={S.root} data-testid="feed-screen">
      {/* Top bar */}
      <div style={S.topBar}>
        <span style={S.logo}>STEMScroll</span>
        <div style={S.topRight}>
          <span style={{ ...S.connPill, background: online ? 'rgba(76,175,80,0.2)' : 'rgba(255,184,48,0.2)', color: online ? COLORS.sproutGreen : COLORS.solarOrange }} data-testid="conn-pill">
            {online ? '● LIVE' : '○ OFFLINE'}
          </span>
          <span style={S.ageBadge}>{AGE_MODES[ageMode]?.emoji} {AGE_MODES[ageMode]?.label}</span>
        </div>
      </div>

      {topicInfo?.ai && (
        <div style={S.topicPill} data-testid="topic-pill">
          ✨ Streaming · {topicInfo.category} · {topicInfo.topic}
        </div>
      )}

      {/* Snap-scroll infinite feed */}
      <div ref={containerRef} style={S.feedContainer} data-testid="feed-scroll">
        {cards.map((card, idx) => (
          <div key={card.id || idx} data-cardid={card.id} data-idx={idx} style={S.cardSlot}>
            <STEMCard card={card} onSave={handleSave} ageMode={ageMode} />
          </div>
        ))}
        {fetchingMore && cards.length > 0 && (
          <div style={S.cardSlot} data-testid="feed-fetching">
            <div style={S.fetchingBox}>
              <img src="/mascots/sprouty/thinking.png" alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div style={S.spinner} />
              <p style={S.loadingText}>Brewing fresh facts…</p>
            </div>
          </div>
        )}
        {cards.length === 0 && !loading && (
          <div style={S.empty}>
            <img src="/mascots/sprouty/default.png" alt="Sprouty" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            <p style={{ color: COLORS.moonrock }}>No cards yet — generate one in Explore!</p>
          </div>
        )}
      </div>

      {toast && (
        <div style={S.toast} data-testid="save-toast">
          <img src="/mascots/neuro-sprouty/kisses.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

const S = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.cosmos, position: 'relative', overflow: 'hidden' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', flexShrink: 0, background: `${COLORS.cosmos}ee`, zIndex: 10 },
  logo: { color: COLORS.textPrimary, fontWeight: 900, fontSize: 20, letterSpacing: 0.5 },
  topRight: { display: 'flex', gap: 8, alignItems: 'center' },
  connPill: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 },
  ageBadge: { fontSize: 12, color: COLORS.moonrock, fontWeight: 600 },
  topicPill: { alignSelf: 'center', margin: '4px auto 6px', padding: '4px 12px', borderRadius: 20, background: 'rgba(180,120,255,0.18)', color: COLORS.protonPurple, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, maxWidth: '90%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  feedContainer: { flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' },
  cardSlot: { height: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' },
  loadingScreen: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.cosmos, gap: 16 },
  mascotLoad: { marginBottom: 8 },
  spinner: { width: 32, height: 32, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.protonPurple, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: COLORS.moonrock, fontSize: 15 },
  fetchingBox: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 },
  empty: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  toast: { position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', background: COLORS.nebula, color: COLORS.solarOrange, padding: '10px 18px', borderRadius: 24, fontWeight: 700, fontSize: 15, zIndex: 100, border: `1px solid ${COLORS.solarOrange}44`, display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' },
};
