# STEMScroll — Product Requirements

## What it is
A vertical-scroll STEM knowledge "doom scroller" mobile app (Expo React Native) for ages 3–15, homeschool parents, and neurodiverse families. Like TikTok but every card makes you smarter.

## Core MVP features (shipped)
- **Onboarding** (4 steps): welcome + neurodiverse toggle → age mode (Explorer/Discoverer/Scientist/Guide) → topic picker (8 subjects) → growth plan
- **Feed**: vertical FlatList with `snapToInterval` paging through STEM cards. 5 card types: Fact, Quiz (3-option MCQ with instant feedback), Experiment (materials + steps + reveal), Story (first-person), Diagram (numbered parts)
- **Mascots**: 7 emoji-circle branded avatars (Sprouty, Dr. Sprout, Ausome Koala, Quizzle, Wombles, Zoomerroo, Neuro Sprouty) — auto-assigned per card type/subject/age mode
- **Streak system**: bumps automatically on feed entry; resets if a day is missed
- **XP & Levels**: +5 fact view, +10 correct quiz, +3 attempted, etc. Levels: Curious Atom → Universe (6 tiers)
- **Library**: 2-column grid of saved cards, swipe-to-refresh, unsave inline
- **Missions**: 6 curated missions across all subjects, each completes with XP claim
- **Explore**: AI card generator (Claude Sonnet 4.5 via Emergent LLM Key) + subject browser
- **Profile**: stats, age mode switcher, neurodiverse toggle, mascot roster, reset

## Tech
- Frontend: Expo SDK 54, expo-router (file-based), React Native, expo-linear-gradient, expo-haptics, @expo/vector-icons
- Backend: FastAPI + Motor (MongoDB), endpoints under `/api`
- AI: Claude Sonnet 4.5 via `emergentintegrations` with EMERGENT_LLM_KEY (falls back to seed cards on failure)
- Storage: `@/src/utils/storage` (AsyncStorage) for anonymous user_id

## Out of scope (per spec)
- Social feed, user-generated content, paywalls, video, push notifications, admin dashboard, custom PNG mascots (deferred — emoji placeholders used)

## Smart business enhancement
The AI **Explore** generator drives engagement beyond the 50 seed cards: parents who hit "limit" naturally try AI mode → exposure path to a premium "Unlimited AI cards + curriculum packs" subscription post-MVP.
