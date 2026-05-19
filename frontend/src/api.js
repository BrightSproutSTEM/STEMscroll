const BASE = process.env.REACT_APP_BACKEND_URL;
const API  = `${BASE}/api`;

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  health: ()                          => req('GET', '/'),
  seedCards: ()                       => req('GET', '/cards/seed').then(d => d.cards || d),
  getCard: (id)                       => req('GET', `/cards/${id}`),
  getUser: (uid)                      => req('GET', `/user/${uid}`),
  onboardUser: (uid, data)            => req('POST', `/user/${uid}/onboard`, data),
  updateStreak: (uid)                 => req('POST', `/user/${uid}/streak`, {}),
  addXP: (uid, amount)                => req('POST', `/user/${uid}/xp`, { amount }),
  setAgeMode: (uid, mode)             => req('POST', `/user/${uid}/age-mode`, { mode }),
  getSaved: (uid)                     => req('GET', `/user/${uid}/saved`).then(d => (d.saved || d.cards || d).map(s => s.card_data || s)),
  saveCard: (uid, card)               => req('POST', `/user/${uid}/saved`, card),
  unsaveCard: (uid, cardId)           => req('DELETE', `/user/${uid}/saved/${cardId}`),
  recordView: (uid, cardId, dwell)    => req('POST', `/user/${uid}/view`, { card_id: cardId, dwell_ms: dwell }),
  recordSkip: (uid, cardId)           => req('POST', `/user/${uid}/skip`, { card_id: cardId }),
  getMissions: ()                     => req('GET', '/missions').then(d => d.missions || d),
  getMission: (id)                    => req('GET', `/missions/${id}`).then(d => d.cards || d),
  generateCard: (uid, subjectFilter, ageMode) =>
    req('POST', '/cards/generate', { user_id: uid, subject_filter: subjectFilter, age_mode: ageMode }),
  getAnnealedFeed: (uid)             => req('GET', `/user/${uid}/annealed-feed`).then(d => d.cards || d),
  getInfiniteFeed: (uid, count = 8, context = 'feed') =>
    req('GET', `/feed/infinite/${uid}?context=${encodeURIComponent(context)}&count=${count}`)
      .then(d => ({ cards: d.cards || [], topic: d.topic, category: d.category, aiGenerated: d.ai_generated })),
  getDedupStats: (uid, context = 'feed') =>
    req('GET', `/dedup/stats/${uid}?context=${encodeURIComponent(context)}`),
};
