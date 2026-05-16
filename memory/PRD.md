# STEMScroll — Product Requirements

## What it is
A vertical-scroll STEM knowledge "doom scroller" mobile app (Expo React Native) for ages 3–15, homeschool parents, and neurodiverse families. Like TikTok but every card makes you smarter.

## Core MVP features (shipped)
- **Onboarding** (4 steps): welcome + neurodiverse toggle → age mode → topic picker → growth plan
- **Feed**: vertical FlatList with `snapToInterval` paging through STEM cards. 5 card types: Fact, Quiz, Experiment, Story, Diagram
- **NeuroCrew Mascots**: 7 branded characters with real PNG art + 4 motion variants (Sprouty, Dr. Sprout, Ausome Koala, Quizzle, Wombles, Zoomerroo, Neuro Sprouty)
- **Streak system + XP/Levels** (Curious Atom → Universe, 6 tiers) with global Level-Up celebration
- **SaveToast** with Neuro Sprouty blowing kisses
- **Library / Missions / Explore / Profile** tabs
- **AI Card Generation** (Claude Sonnet 4.5)

## Production-grade enhancements (this iteration)
### Hallucination prevention pipeline (3-layer)
- Every seed card carries `confidence` (0.0–1.0), `verified` boolean, `last_verified`, `source_url`
- AI generation runs a **two-step Claude pipeline**: generate → second Claude self-verifies → score; if confidence <0.65, the card is rejected and logged to `rejected_generations`; <0.85 surfaces as "CHECK WITH A GROWN-UP" instead of "VERIFIED"
- Visible **VERIFIED** (green shield) and **unverified** (orange warning) badges on every card

### Source citations
- Every fact has a tappable **Source: …** pill with external-link icon (opens canonical URL — Nat Geo Kids, NASA, BBC Earth, Royal Society of Chemistry, etc.)

### Annealing / self-learning
- View dwell-time → if user swiped past in <2.2s, backend records a **skip** signal
- New `/api/user/{uid}/annealed-feed` endpoint scores cards by `confidence + saves_by_subject*0.15 − skips_by_subject*0.08 + small randomness` (high-temperature exploration cools as engagement data accumulates)
- Saved cards excluded from feed (novelty bias)

### Connectivity intelligence
- Frontend polls `/api/` every 15s — top bar shows green **🟢 LIVE** pill or amber **OFFLINE** pill
- Architecturally ready for offline Gemma-4 layer (placeholder; on-device LLM requires native modules + ejecting Expo Go)

### Accessibility
- **Read-aloud TTS** button on every card (expo-speech, slower rate for Explorer mode)
- Skeleton loader matches card shape during fetch
- WCAG-friendly contrast, 44pt+ touch targets, `accessibilityLabel`s

## Tech
- Frontend: Expo SDK 54, expo-router, expo-speech, expo-haptics, react-native-reanimated, expo-linear-gradient
- Backend: FastAPI + Motor (MongoDB), `/api/*` endpoints, Claude Sonnet 4.5 via emergentintegrations
- Confidence pipeline: Claude generate → Claude verify → score → store in `rejected_generations` if <0.65

## Honestly-deferred (require ejecting Expo / weeks of work)
- On-device Gemma 4 E2B (3 GB model + LiteRT/MediaPipe native modules)
- LanceDB/FAISS on-device vector store
- Real-time RAG against live Wikipedia/NASA/Khan APIs (each needs auth + rate limits)
- 5,000-card hand-curated bank (current: 46 high-confidence verified facts; AI-extension active)
- Full Material You dynamic palette extraction (requires Android 12+ native API)

## Smart business hook
The verified-only generator + source citations make this credibly classroom-deployable — the foundation for a **B2B "STEMScroll for Schools" subscription** (curriculum-aligned mission packs, teacher dashboard).
