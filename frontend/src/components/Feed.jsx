import React, { useState, useEffect, useRef, useCallback } from 'react';
import STEMCard from './STEMCard';
import { COLORS, AGE_MODES } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

export default function Feed() {
  const { uid, profile, addXP } = useUser();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const containerRef = useRef(null);
  const cardTimers = useRef({});
  const viewedRef = useRef(new Set());

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      try { data = await api.getAnnealedFeed(uid); } catch (_) {}
      if (!Array.isArray(data) || data.length === 0) data = await api.seedCards();
      setCards(Array.isArray(data) ? data : []);
    } catch (e) { console.error('feed error', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    const check = async () => { try { await api.health(); setOnline(true); } catch (_) { setOnline(false); } };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const cardId = entry.target.dataset.cardid;
        if (!cardId) return;
        if (entry.isIntersecting) { cardTimers.current[cardId] = Date.now(); }
        else {
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
    }, { root: containerRef.current, threshold: 0.8 });
    containerRef.current.querySelectorAll('[data-cardid]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [cards, uid]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async (card) => {
    try {
      await api.saveCard(uid, card);
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
          <span style={{ ...S.connPill, background: online ? 'rgba(76,175,80,0.2)' : 'rgba(255,184,48,0.2)', color: online ? COLORS.sproutGreen : COLORS.solarOrange }}>
            {online ? '● LIVE' : '○ OFFLINE'}
          </span>
          <span style={S.ageBadge}>{AGE_MODES[ageMode]?.emoji} {AGE_MODES[ageMode]?.label}</span>
        </div>
      </div>

      {/* Snap-scroll feed */}
      <div ref={containerRef} style={S.feedContainer} data-testid="feed-scroll">
        {cards.map((card, idx) => (
          <div key={card.id || idx} data-cardid={card.id} style={S.cardSlot}>
            <STEMCard card={card} onSave={handleSave} ageMode={ageMode} />
          </div>
        ))}
        {cards.length === 0 && (
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
  feedContainer: { flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' },
  cardSlot: { height: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' },
  loadingScreen: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.cosmos, gap: 16 },
  mascotLoad: { marginBottom: 8 },
  spinner: { width: 32, height: 32, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.protonPurple, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: COLORS.moonrock, fontSize: 15 },
  empty: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  toast: { position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', background: COLORS.nebula, color: COLORS.solarOrange, padding: '10px 18px', borderRadius: 24, fontWeight: 700, fontSize: 15, zIndex: 100, border: `1px solid ${COLORS.solarOrange}44`, display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' },
};
