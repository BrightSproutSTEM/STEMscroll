import React, { useState, useEffect, useRef, useCallback } from 'react';
import STEMCard from './STEMCard';
import { COLORS, SUBJECTS, AGE_MODES } from '../theme';
import { api } from '../api';
import { useUser } from '../userContext';

const CONN_CHECK_MS = 15000;

export default function Feed() {
  const { uid, profile, addXP } = useUser();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const containerRef = useRef(null);
  const cardTimers = useRef({});
  const viewedRef = useRef(new Set());

  // Fetch feed
  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      try {
        data = await api.getAnnealedFeed(uid);
      } catch (_) {}
      // Fall back to seed cards if annealed feed is empty or failed
      if (!Array.isArray(data) || data.length === 0) {
        data = await api.seedCards();
      }
      setCards(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('feed error', e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Connectivity check
  useEffect(() => {
    const check = async () => {
      try { await api.health(); setOnline(true); }
      catch (_) { setOnline(false); }
    };
    check();
    const t = setInterval(check, CONN_CHECK_MS);
    return () => clearInterval(t);
  }, []);

  // Intersection observer for card view/skip tracking
  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const cardId = entry.target.dataset.cardid;
          if (!cardId) return;
          if (entry.isIntersecting) {
            cardTimers.current[cardId] = Date.now();
          } else {
            const enterTime = cardTimers.current[cardId];
            if (enterTime) {
              const dwell = Date.now() - enterTime;
              delete cardTimers.current[cardId];
              if (!viewedRef.current.has(cardId)) {
                viewedRef.current.add(cardId);
                if (dwell < 2200) {
                  api.recordSkip(uid, cardId).catch(() => {});
                } else {
                  api.recordView(uid, cardId, dwell).catch(() => {});
                }
              }
            }
          }
        });
      },
      { root: containerRef.current, threshold: 0.8 }
    );
    const els = containerRef.current.querySelectorAll('[data-cardid]');
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [cards, uid]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async (card) => {
    try {
      await api.saveCard(uid, card);
      await addXP(card.xpValue || 5);
      showToast(`+${card.xpValue || 5} XP saved!`);
    } catch (_) {
      showToast('Saved!');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen} data-testid="feed-loading">
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your STEM feed…</p>
      </div>
    );
  }

  return (
    <div style={styles.root} data-testid="feed-screen">
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.logo}>STEMScroll</span>
        <div style={styles.topRight}>
          <span
            style={{ ...styles.connPill, background: online ? '#4CAF5033' : '#FF980033', color: online ? COLORS.mint : COLORS.orange }}
          >
            {online ? '● LIVE' : '○ OFFLINE'}
          </span>
          <span style={styles.ageBadge}>{AGE_MODES[profile?.age_mode]?.icon} {AGE_MODES[profile?.age_mode]?.label}</span>
        </div>
      </div>

      {/* Scrollable card feed */}
      <div ref={containerRef} style={styles.feedContainer} data-testid="feed-scroll">
        {cards.map((card, idx) => (
          <div key={card.id || idx} data-cardid={card.id} style={styles.cardSlot}>
            <STEMCard card={card} onSave={handleSave} ageMode={profile?.age_mode || 'explorer'} />
          </div>
        ))}
        {cards.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 64 }}>🔭</div>
            <p style={{ color: COLORS.textSecondary }}>No cards yet — generate one in Explore!</p>
          </div>
        )}
      </div>

      {/* Save toast */}
      {toast && (
        <div style={styles.toast} data-testid="save-toast">
          <span style={{ marginRight: 8 }}>🌟</span>{toast}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.bg, position: 'relative', overflow: 'hidden' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexShrink: 0, zIndex: 10, background: `${COLORS.bg}ee` },
  logo: { color: COLORS.textPrimary, fontWeight: 900, fontSize: 20, letterSpacing: 0.5 },
  topRight: { display: 'flex', gap: 8, alignItems: 'center' },
  connPill: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 },
  ageBadge: { fontSize: 12, color: COLORS.textSecondary, fontWeight: 600 },
  feedContainer: { flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' },
  cardSlot: { height: '100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', boxSizing: 'border-box' },
  loadingScreen: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 },
  spinner: { width: 40, height: 40, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: COLORS.textSecondary, fontSize: 15 },
  emptyState: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  toast: { position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1E2545', color: COLORS.gold, padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: 15, zIndex: 100, border: `1px solid ${COLORS.gold}44`, whiteSpace: 'nowrap' },
};
