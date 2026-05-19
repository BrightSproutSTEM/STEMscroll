# STEMScroll Test Results

## Latest Session (2026-05-19)

### Emergent Preview Environment
**URL**: https://inclusive-stem-lab.preview.emergentagent.com
**Status**: ✅ FULLY WORKING

The Emergent preview now runs a **React web implementation** of STEMScroll (for web preview purposes).
The **GitHub repo** continues to contain the production **Expo React Native** app (iOS + Android).

### Bug Fixes Applied
| # | Fix | Status |
|---|-----|--------|
| 1 | app.json: splash-icon.png → splash-image.png | ✅ Fixed |
| 2 | app.json: name/slug/scheme "frontend" → "STEMScroll" | ✅ Fixed |
| 3 | Ionicons font preloading via useFonts + SplashScreen | ✅ Fixed |
| 4 | Card f16 emoji ⚫ → 🎵 (invisible on dark bg) | ✅ Fixed |
| 5 | FastAPI lifespan handler (was @app.on_event deprecated) | ✅ Fixed |
| 6 | Seed cards 46 → 50 (f21, f22, q10, d6 added) | ✅ Fixed |

### Web Preview Features Working
- Onboarding: 4 steps (welcome+neuro → age mode → subjects → plan) ✅
- Feed: 50 STEM cards with snap scroll ✅
- Card types: Fact, Quiz (interactive), Experiment (steps), Story, Diagram ✅
- VERIFIED/UNVERIFIED confidence badges ✅
- Save card → XP toast ✅
- Tab navigation: Feed / Missions / Library / Explore / Me ✅
- Missions: list + step-through card view ✅
- Library: saved cards grid + detail modal ✅
- Explore: AI card generation (Claude via emergentintegrations) ✅
- Profile: level/XP/streak/settings ✅
- LIVE connectivity indicator ✅

### Known Limitations
- "Made with Emergent" badge overlaps rightmost nav tabs at 390px; JS click still works
- AI generation (Explore) uses Claude Sonnet 4.5 via emergentintegrations key
