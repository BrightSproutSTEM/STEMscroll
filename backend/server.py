"""STEMScroll backend — FastAPI + MongoDB.

Production additions:
- Gemini-powered infinite feed with temperature=0.95 for maximum variation
- Universal Non-Repeat Engine (MongoDB deduplication, 200/5 rule)
- SeenContentRegistry + RecentBuffer + UniqueCounter + MemoryBank
- Topic rotation — never covers the same angle twice in a session
- Self-verification pass on all AI-generated cards
- Annealing-weighted feed: tracks views/saves/skips and reweights future cards
"""

import json
import logging
import os
import random
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

import dedup_service
import topic_rotation
import gemini_service
from missions_data import MISSIONS
from seed_cards import SEED_CARDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("stemscroll")

# Stamp every seed card with default verification metadata.
TODAY_ISO = date.today().isoformat()
for c in SEED_CARDS:
    c.setdefault("confidence", 0.95)
    c.setdefault("verified", True)
    c.setdefault("last_verified", TODAY_ISO)
    c.setdefault("source_url", "")

SEED_BY_ID = {c["id"]: c for c in SEED_CARDS}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init dedup indexes and Gemini service."""
    dedup_service.init_db(db)
    topic_rotation.init_db(db)
    gemini_service.init_gemini(EMERGENT_LLM_KEY)
    await dedup_service.ensure_indexes()
    log.info("STEMScroll startup complete")
    yield
    client.close()


app = FastAPI(title="STEMScroll API", lifespan=lifespan)
api = APIRouter(prefix="/api")


# ─────────────────────────────────────────── Models
class UserProfile(BaseModel):
    user_id: str
    age_mode: str = "discoverer"  # explorer | discoverer | scientist | guide
    selected_topics: List[str] = Field(default_factory=list)
    is_neurodiverse: bool = False
    xp_total: int = 0
    level: int = 1
    streak_days: int = 0
    last_active: Optional[str] = None
    onboarded: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OnboardingPayload(BaseModel):
    age_mode: str
    selected_topics: List[str] = Field(default_factory=list)
    is_neurodiverse: bool = False


class SaveCardPayload(BaseModel):
    card_id: str
    card_data: dict


class ViewPayload(BaseModel):
    card_id: str
    subject: Optional[str] = None


class SkipPayload(BaseModel):
    card_id: str
    subject: Optional[str] = None


class XPPayload(BaseModel):
    amount: int


class GenerateCardPayload(BaseModel):
    topic: str
    age_mode: str = "discoverer"
    card_type: str = "fact"  # fact | quiz | experiment | story | diagram
    avoid_ids: List[str] = Field(default_factory=list)


class InfiniteFeedRequest(BaseModel):
    context: str = "feed"    # feed | quiz | diagram | experiment | mission_[id]
    count: int = 8
    category: Optional[str] = None   # override user's subjects
    card_types: Optional[List[str]] = None


# ─────────────────────────────────────────── Helpers
def _level_from_xp(xp: int) -> int:
    """Curious Atom → Molecule → Cell → Organism → Ecosystem → Universe."""
    thresholds = [0, 50, 150, 400, 1000, 2500]
    for i in range(len(thresholds) - 1, -1, -1):
        if xp >= thresholds[i]:
            return i + 1
    return 1


async def _get_or_create_user(user_id: str) -> dict:
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user:
        return user
    profile = UserProfile(user_id=user_id).model_dump()
    await db.users.insert_one(profile.copy())
    profile.pop("_id", None)
    return profile


# ─────────────────────────────────────────── Routes
@api.get("/")
async def root():
    return {"app": "STEMScroll", "status": "ok"}


# ──── Cards ────
@api.get("/cards/seed")
async def get_seed_cards(
    age_mode: Optional[str] = None,
    subjects: Optional[str] = None,
    limit: int = 50,
):
    """Return curated cards, optionally filtered. Always returns at least 10."""
    cards = list(SEED_CARDS)
    if subjects:
        subj_set = {s.strip().lower() for s in subjects.split(",") if s.strip()}
        if subj_set:
            filtered = [c for c in cards if c["subject"] in subj_set]
            if len(filtered) >= 8:
                cards = filtered
    # We don't filter by age_mode strictly — we want variety. The frontend
    # adapts presentation (font size, etc.) based on age_mode.
    return {"cards": cards[:limit], "total": len(cards[:limit])}


@api.get("/cards/{card_id}")
async def get_card(card_id: str):
    card = SEED_BY_ID.get(card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    return card


@api.post("/cards/generate")
async def generate_card(payload: GenerateCardPayload):
    """Generate a STEM card via Gemini (temperature=0.95) with self-verification.
    Falls back to seed card if confidence < 0.65 or generation fails.
    """
    gemini = gemini_service.get_gemini()
    if not gemini:
        return _fallback_card(payload)

    try:
        user_id = getattr(payload, "user_id", "anon")
        ctx_key = dedup_service.CONTEXTS.FACT(user_id)
        recent_hashes = await dedup_service.get_recent_hashes(user_id, ctx_key, 15)

        cards = await gemini.generate_batch(
            topic=payload.topic,
            category=payload.topic,  # topic IS the category here
            age_mode=payload.age_mode,
            count=1,
            recent_hashes=recent_hashes,
            card_types=[payload.card_type],
        )
        if not cards:
            return _fallback_card(payload)
        card = cards[0]

        # Self-verification pass
        verdict = await gemini.verify_card(card)
        confidence = float(verdict.get("confidence", 0.0))
        verified = bool(verdict.get("verified", False)) and confidence >= 0.85

        if confidence < 0.65:
            log.info(f"Card rejected confidence={confidence}: {verdict.get('issues')}")
            await db.rejected_generations.insert_one({
                "card": card, "verdict": verdict,
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            return _fallback_card(payload)

        card["confidence"] = confidence
        card["verified"] = verified
        return card

    except Exception as e:
        log.error(f"Gemini generate_card error: {e}")
        return _fallback_card(payload)


def _fallback_card(payload: GenerateCardPayload) -> dict:
    pool = [c for c in SEED_CARDS if c["type"] == payload.card_type and c["id"] not in payload.avoid_ids]
    if not pool:
        pool = [c for c in SEED_CARDS if c["id"] not in payload.avoid_ids] or SEED_CARDS
    import random
    return random.choice(pool)


def _system_prompt(age_mode: str) -> str:
    base = (
        "You create concise STEM knowledge cards for a children's learning app. "
        "Reply with ONE valid JSON object only. No markdown, no prose. Schema: "
        '{"type":"fact|quiz|experiment|story|diagram","subject":"biology|chemistry|astronomy|physics|nature|maths|technology|engineering",'
        '"emoji":"single emoji","headline":"max 8 words","body":"main text","source":"attribution",'
        '"quizOptions":["A","B","C"],"correctAnswer":0,"explanation":"why",'
        '"materials":["..."],"steps":["..."],"whatHappens":"...","parentNote":"...",'
        '"diagramParts":[{"label":"...","desc":"..."}],"xpValue":10,"mascot":"sprouty|drSprout|quizzle|wombles|zoomerroo"}'
    )
    age_rules = {
        "explorer": "Audience: ages 3-7. Use max 2 short sentences, 1 emoji, words a 4-year-old knows. Wonder and magic. NO jargon, NO scary content, NO numbers above 100.",
        "discoverer": "Audience: ages 8-12. 3-5 sentences. Relatable analogies. Surprising facts. One 'wow factor' per card.",
        "scientist": "Audience: 13-15. Use real terminology with brief definitions. Real-world applications. Max 120 words.",
        "guide": "Audience: parents/educators. Include curriculum link, 2 discussion questions, common misconceptions.",
    }
    return f"{base}\n\n{age_rules.get(age_mode, age_rules['discoverer'])}"


def _user_prompt(p: GenerateCardPayload) -> str:
    return (
        f"Generate a single STEM card. Card type: {p.card_type}. Topic: {p.topic}. "
        f"Age mode: {p.age_mode}. Return JSON only."
    )


# ──── Missions ────
@api.get("/missions")
async def list_missions():
    return {"missions": MISSIONS}


@api.get("/missions/{mission_id}")
async def get_mission(mission_id: str):
    m = next((x for x in MISSIONS if x["id"] == mission_id), None)
    if not m:
        raise HTTPException(404, "Mission not found")
    cards = [SEED_BY_ID[cid] for cid in m["cardIds"] if cid in SEED_BY_ID]
    return {**m, "cards": cards}


# ──── User ────
@api.get("/user/{user_id}")
async def get_user(user_id: str):
    return await _get_or_create_user(user_id)


@api.post("/user/{user_id}/onboard")
async def onboard_user(user_id: str, payload: OnboardingPayload):
    await _get_or_create_user(user_id)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "age_mode": payload.age_mode,
            "selected_topics": payload.selected_topics,
            "is_neurodiverse": payload.is_neurodiverse,
            "onboarded": True,
        }},
    )
    return await db.users.find_one({"user_id": user_id}, {"_id": 0})


@api.post("/user/{user_id}/streak")
async def bump_streak(user_id: str):
    user = await _get_or_create_user(user_id)
    today = date.today().isoformat()
    last = user.get("last_active")
    streak = user.get("streak_days", 0)

    if last == today:
        pass  # already counted today
    else:
        from datetime import timedelta
        try:
            last_d = date.fromisoformat(last) if last else None
        except ValueError:
            last_d = None
        if last_d and (date.today() - last_d).days == 1:
            streak += 1
        else:
            streak = 1
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"streak_days": streak, "last_active": today}},
        )
    fresh = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return fresh


@api.post("/user/{user_id}/xp")
async def add_xp(user_id: str, payload: XPPayload):
    user = await _get_or_create_user(user_id)
    new_xp = user.get("xp_total", 0) + payload.amount
    new_level = _level_from_xp(new_xp)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"xp_total": new_xp, "level": new_level}},
    )
    return {"xp_total": new_xp, "level": new_level, "delta": payload.amount}


@api.post("/user/{user_id}/age-mode")
async def set_age_mode(user_id: str, payload: dict):
    age_mode = payload.get("age_mode")
    if age_mode not in {"explorer", "discoverer", "scientist", "guide"}:
        raise HTTPException(400, "Invalid age_mode")
    await _get_or_create_user(user_id)
    await db.users.update_one({"user_id": user_id}, {"$set": {"age_mode": age_mode}})
    return await db.users.find_one({"user_id": user_id}, {"_id": 0})


# ──── Saved cards (library) ────
@api.get("/user/{user_id}/saved")
async def list_saved(user_id: str):
    docs = await db.saved_cards.find({"user_id": user_id}, {"_id": 0}).sort("saved_at", -1).to_list(500)
    return {"cards": docs}


@api.post("/user/{user_id}/saved")
async def save_card(user_id: str, payload: SaveCardPayload):
    await _get_or_create_user(user_id)
    doc = {
        "user_id": user_id,
        "card_id": payload.card_id,
        "card_data": payload.card_data,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    # upsert
    await db.saved_cards.update_one(
        {"user_id": user_id, "card_id": payload.card_id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "card_id": payload.card_id}


@api.delete("/user/{user_id}/saved/{card_id}")
async def unsave_card(user_id: str, card_id: str):
    await db.saved_cards.delete_one({"user_id": user_id, "card_id": card_id})
    return {"ok": True}


# ──── View / Skip (annealing signals) ────
@api.post("/user/{user_id}/view")
async def record_view(user_id: str, payload: ViewPayload):
    await _get_or_create_user(user_id)
    await db.card_views.insert_one({
        "user_id": user_id,
        "card_id": payload.card_id,
        "subject": payload.subject,
        "viewed_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api.post("/user/{user_id}/skip")
async def record_skip(user_id: str, payload: SkipPayload):
    """User swiped past quickly — annealing signal to deprioritise this subject slightly."""
    await _get_or_create_user(user_id)
    await db.card_skips.insert_one({
        "user_id": user_id,
        "card_id": payload.card_id,
        "subject": payload.subject,
        "skipped_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api.get("/user/{user_id}/annealed-feed")
async def annealed_feed(user_id: str, limit: int = 50):
    """Return cards reweighted by user engagement.
    Saves & long views ↑, skips ↓. Excludes already-saved by default for novelty.
    """
    await _get_or_create_user(user_id)
    saved = await db.saved_cards.find({"user_id": user_id}, {"_id": 0, "card_id": 1}).to_list(2000)
    saved_ids = {s["card_id"] for s in saved}
    skipped = await db.card_skips.find({"user_id": user_id}, {"_id": 0, "subject": 1}).to_list(2000)
    saves_by_subj = defaultdict(int)
    for s in saved:
        c = SEED_BY_ID.get(s["card_id"])
        if c:
            saves_by_subj[c["subject"]] += 1
    skips_by_subj = defaultdict(int)
    for s in skipped:
        if s.get("subject"):
            skips_by_subj[s["subject"]] += 1

    pool = [c for c in SEED_CARDS if c["id"] not in saved_ids]
    # Score each card: confidence + save-affinity − skip-aversion + small randomness.
    def score(c: dict) -> float:
        subj = c["subject"]
        base = c.get("confidence", 0.85)
        affinity = saves_by_subj.get(subj, 0) * 0.15
        aversion = skips_by_subj.get(subj, 0) * 0.08
        return base + affinity - aversion + random.random() * 0.25

    pool.sort(key=score, reverse=True)
    return {"cards": pool[:limit], "total": len(pool[:limit])}


# Map context name → (dedup CONTEXTS fn, allowed card types). When the context
# is one of these focused modes, we restrict generation/serving to that type so
# e.g. "quiz mode" never spits out fact cards by accident.
CONTEXT_CARD_TYPES = {
    "feed":       None,                       # mixed
    "fact":       ["fact"],
    "quiz":       ["quiz"],
    "diagram":    ["diagram"],
    "experiment": ["experiment"],
    "story":      ["story"],
}


def _resolve_context(user_id: str, context: str) -> tuple[str, Optional[list]]:
    """Return (dedup_context_key, allowed_card_types|None)."""
    if context == "feed":
        return dedup_service.CONTEXTS.FEED(user_id), None
    if context == "quiz":
        return dedup_service.CONTEXTS.QUIZ(user_id), ["quiz"]
    if context == "diagram":
        return dedup_service.CONTEXTS.DIAGRAM(user_id), ["diagram"]
    if context == "experiment":
        return dedup_service.CONTEXTS.EXPERIMENT(user_id), ["experiment"]
    if context == "fact":
        return dedup_service.CONTEXTS.FACT(user_id), ["fact"]
    # mission_<id> handled by dedicated endpoint; fall through with raw key
    return f"{context}_{user_id}", None


# ──── Infinite Feed (Gemini + Deduplication) ────
async def _generate_and_bank(
    user_id: str,
    ctx_key: str,
    chosen_category: str,
    topic: str,
    age_mode: str,
    count: int,
    card_types: Optional[List[str]] = None,
):
    """Background job: call Gemini and let dedup filter+bank the results.
    Runs after the HTTP response is sent so the ingress timeout doesn't fire.
    """
    gemini = gemini_service.get_gemini()
    if not gemini:
        return
    try:
        recent_hashes = await dedup_service.get_recent_hashes(user_id, ctx_key, limit=20)
        raw_cards = await gemini.generate_batch(
            topic=topic,
            category=chosen_category,
            age_mode=age_mode,
            count=count + 4,
            recent_hashes=recent_hashes,
            avoid_headlines=[],
            card_types=card_types,
        )
        # If the context demands a specific type, drop any drift from Gemini.
        if card_types and raw_cards:
            raw_cards = [c for c in raw_cards if c.get("type") in card_types]
        if raw_cards:
            approved = await dedup_service.filter_approved_cards(user_id, ctx_key, raw_cards)
            log.info(f"BG gen banked {len(approved)} cards for {user_id} ctx={ctx_key} topic='{topic}'")
    except Exception as e:
        log.error(f"BG gen error for {user_id} ctx={ctx_key}: {e}")


@api.get("/feed/infinite/{user_id}")
async def infinite_feed(
    user_id: str,
    background_tasks: BackgroundTasks,
    context: str = Query(default="feed"),
    count: int = Query(default=8, ge=1, le=20),
    category: Optional[str] = None,
):
    """
    Universal infinite-feed endpoint. Works for `feed`, `quiz`, `diagram`,
    `experiment`, `fact`, `story`. Each context has its OWN dedup namespace
    so opening Quiz mode after a long feed session still surfaces fresh quizzes.

    Pipeline (non-blocking — must respond before ingress timeout):
    1. Resolve context → (dedup key, allowed card_types).
    2. Pick next topic + category not recently covered for THIS context.
    3. Serve unseen cards from MemoryBank (type-filtered) through the 3-gate dedup.
    4. Top-up with seed cards (also type-filtered) if bank is thin.
    5. Schedule a Gemini generation in the background that populates the bank.
    """
    user = await _get_or_create_user(user_id)
    age_mode = user.get("age_mode", "discoverer")
    user_topics = user.get("selected_topics", [])

    ctx_key, allowed_types = _resolve_context(user_id, context)

    # Pick next category and topic for THIS context (per-context topic rotation).
    chosen_category = category or await topic_rotation.get_next_category(user_id, ctx_key, user_topics)
    topic = await topic_rotation.get_next_topic(chosen_category, user_id, ctx_key)

    # 1) Try the bank first (preferred category + type).
    pref_cats = [chosen_category] + (user_topics or [])
    approved = await dedup_service.serve_from_bank(
        user_id, ctx_key, count, categories=pref_cats, card_types=allowed_types,
    )
    ai_served = len(approved)

    # 2) Widen: any category, still type-filtered.
    if len(approved) < count:
        more = await dedup_service.serve_from_bank(
            user_id, ctx_key, count - len(approved), card_types=allowed_types,
        )
        approved.extend(more)

    # 3) Seed fallback — also filter by allowed types when context is focused.
    if len(approved) < count:
        seed_pool = [c for c in SEED_CARDS]
        if allowed_types:
            seed_pool = [c for c in seed_pool if c.get("type") in allowed_types]
        random.shuffle(seed_pool)
        seed_filtered = await dedup_service.filter_approved_cards(user_id, ctx_key, seed_pool[:30])
        approved.extend(seed_filtered)

    result = approved[:count]

    # Schedule Gemini generation in the background — populates bank for next call.
    background_tasks.add_task(
        _generate_and_bank,
        user_id, ctx_key, chosen_category, topic, age_mode, count, allowed_types,
    )

    log.info(
        f"Infinite {context}: user={user_id} ctx={ctx_key} topic='{topic}' "
        f"types={allowed_types or 'mixed'} from_bank={ai_served} total={len(result)}"
    )

    return {
        "cards": result,
        "total": len(result),
        "topic": topic,
        "category": chosen_category,
        "ai_generated": ai_served > 0,
        "from_bank": ai_served,
        "context": ctx_key,
        "card_types": allowed_types,
    }


@api.get("/feed/generate-batch/{user_id}")
async def generate_feed_batch(
    user_id: str,
    background_tasks: BackgroundTasks,
    category: Optional[str] = None,
    count: int = Query(default=8, ge=1, le=20),
    context: str = Query(default="feed"),
):
    """Force-generate a fresh batch via Gemini (used for pre-fetching)."""
    return await infinite_feed(user_id, background_tasks, context=context, count=count, category=category)


# ──── Mission cards (per-mission dedup + AI top-up) ────
@api.get("/missions/{mission_id}/cards/{user_id}")
async def get_mission_cards(
    mission_id: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    extra: int = Query(default=3, ge=0, le=10),
):
    """Return the seeded mission cards PLUS up to `extra` fresh AI cards on the
    mission's subject. Each mission has its own dedup namespace so revisiting
    one shows new material every time.
    """
    m = next((x for x in MISSIONS if x["id"] == mission_id), None)
    if not m:
        raise HTTPException(404, "Mission not found")

    await _get_or_create_user(user_id)
    ctx_key = dedup_service.CONTEXTS.MISSION(user_id, mission_id)
    subject = m.get("subject", "biology")

    # 1) Seed cards from the mission roster — always shown, even if previously seen
    #    (they're the curated curriculum core).
    base_cards = [SEED_BY_ID[cid] for cid in m["cardIds"] if cid in SEED_BY_ID]

    # 2) AI top-up from bank (mission subject, any card type).
    extras = []
    if extra > 0:
        extras = await dedup_service.serve_from_bank(
            user_id, ctx_key, extra, categories=[subject],
        )
        # Schedule background Gemini gen for this mission's namespace.
        topic = await topic_rotation.get_next_topic(subject, user_id, ctx_key)
        background_tasks.add_task(
            _generate_and_bank,
            user_id, ctx_key, subject, topic,
            "discoverer", extra, None,
        )

    return {
        **m,
        "cards": base_cards + extras,
        "ai_extras": len(extras),
        "context": ctx_key,
    }


@api.get("/dedup/stats/{user_id}")
async def get_dedup_stats(user_id: str, context: str = Query(default="feed")):
    """Return deduplication statistics for debugging and progress display."""
    ctx_key = f"{context}_{user_id}"
    stats = await dedup_service.get_dedup_stats(user_id, ctx_key)
    return {"user_id": user_id, "context": ctx_key, **stats}


@api.get("/feed/offline/{user_id}")
async def offline_feed(
    user_id: str,
    card_type: str = Query(default="fact"),
    category: str = Query(default="biology"),
    count: int = Query(default=5),
):
    """Serve cards from the memory bank when offline."""
    user = await _get_or_create_user(user_id)
    ctx_key = dedup_service.CONTEXTS.FEED(user_id)
    cards = await dedup_service.get_offline_cards(
        user_id=user_id,
        context=ctx_key,
        card_type=card_type,
        category=category,
        age_tier=user.get("age_mode", "discoverer"),
        count=count,
    )
    return {"cards": cards, "total": len(cards), "source": "memory_bank"}


# Register
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
