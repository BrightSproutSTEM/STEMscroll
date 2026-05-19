# STEMScroll — Product Requirements

## What it is
A vertical-scroll STEM knowledge "doom scroller" for ages 3–15, homeschool parents, and neurodiverse families. Web preview + Expo mobile.

## Section A — Infinite Feed Generation (NEW, shipped Feb 2026)
**The Universal Non-Repeat Engine** — the same fact never shows up twice for 200+ unique cards, then at most 5 times max.

### Architecture
- `GET /api/feed/infinite/{user_id}` — non-blocking endpoint, responds <500ms
- Serves unseen cards from `MemoryBank` (filtered by 3-gate dedup)
- Tops up with seed cards if bank is thin
- Schedules a `BackgroundTasks` Gemini generation that hydrates the bank for the next request
- Result: ingress timeouts (30s) are bypassed; Gemini's 20–30s cold latency is hidden from the user

### Dedup engine (MongoDB collections)
- **SeenContentRegistry** — permanent per-user-per-context card history (200/5 rule)
- **RecentBuffer** — rolling last-10 shown per context (immediate block)
- **UniqueCounter** — tracks unique count per category+type
- **MemoryBank** — every approved AI card stored for offline + low-latency serving
- Universal `content_hash` (SHA-256 over content-defining fields per card type)

### Gemini integration
- `emergentintegrations.llm.chat.LlmChat` → `gemini-2.5-flash`, `temperature=0.95`
- System prompt enforces JSON schema, age rule, mascot, diversity
- User prompt injects up to 20 recent hashes + banned headlines as anti-repeat signal
- Background generation pre-warms MemoryBank so subsequent fetches are instant

### Frontend infinite scroll (`Feed.jsx`)
- Initial render: seed cards in <500ms (no waiting)
- Background fetches `/api/feed/infinite/{uid}` and appends AI cards
- IntersectionObserver on the last card triggers next batch when user is within 3 cards of the end
- Topic pill shows what's currently streaming (`✨ Streaming · physics · wave-particle duality`)
- Client-side `seenIds` Set prevents re-rendering the same card

## Existing MVP features (still shipped)
- Onboarding (4 steps), age modes, neurodiverse toggle
- Annealing (`saves×0.15 − skips×0.08`), confidence pipeline, source citations
- NeuroCrew Mascots (7 PNGs + 4 motion variants)
- Streak / XP / Levels, Save toast, Library/Missions/Explore/Profile tabs

## Tech
- Backend: FastAPI + Motor (MongoDB)
- AI: Gemini 2.5-flash via emergentintegrations (EMERGENT_LLM_KEY)
- Frontend (web preview): React + theme.js + faithful Expo UI port
- Frontend (mobile): Expo SDK 54

## Backlog (P1)
- Wire infinite-feed dedup into Quiz / Diagram / Experiment / Mission contexts
- Populate `avoid_headlines` from recent registry (placeholder exists)
- Verification pass on AI cards (already wired in `verify_card`, not yet enabled by default — saves Gemini cost)

## Backlog (P2)
- Offline mode UI: surface `from_stash` badge when MemoryBank serves
- Admin dashboard for dedup stats (`/api/dedup/stats/{uid}` exists)
- Re-enable Expo build (currently web preview only on platform)

## Smart business hook
Verified-only generator + source citations → B2B "STEMScroll for Schools" subscription (curriculum-aligned mission packs, teacher dashboard).
