"""STEMScroll backend — FastAPI + MongoDB.
Endpoints:
- GET  /api/cards/seed?ageMode=...&subjects=...   → curated seed cards
- GET  /api/cards/{card_id}                       → one card
- POST /api/cards/generate                        → AI-generated card (Claude)
- GET  /api/missions                              → mission list
- GET  /api/user/{user_id}                        → get/create user profile
- POST /api/user/{user_id}/streak                 → bump streak
- POST /api/user/{user_id}/xp                     → add XP
- GET  /api/user/{user_id}/saved                  → saved cards
- POST /api/user/{user_id}/saved                  → save a card
- DELETE /api/user/{user_id}/saved/{card_id}      → unsave
- POST /api/user/{user_id}/view                   → record view
"""

import json
import logging
import os
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from missions_data import MISSIONS
from seed_cards import SEED_CARDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

app = FastAPI(title="STEMScroll API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("stemscroll")

SEED_BY_ID = {c["id"]: c for c in SEED_CARDS}


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


class XPPayload(BaseModel):
    amount: int


class GenerateCardPayload(BaseModel):
    topic: str
    age_mode: str = "discoverer"
    card_type: str = "fact"  # fact | quiz | experiment | story | diagram
    avoid_ids: List[str] = Field(default_factory=list)


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
    """Generate a STEM card via Claude. Falls back to a random seed card on error."""
    if not EMERGENT_LLM_KEY:
        log.warning("No EMERGENT_LLM_KEY — returning seed fallback")
        return _fallback_card(payload)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        system_msg = _system_prompt(payload.age_mode)
        user_msg = _user_prompt(payload)

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"stemscroll-{uuid.uuid4()}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=user_msg))
        text = response.strip()
        # Strip code fences if present
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        card = json.loads(text.strip())
        card["id"] = f"ai-{uuid.uuid4().hex[:8]}"
        card.setdefault("xpValue", 5)
        return card
    except Exception as e:  # noqa: BLE001
        log.error(f"Claude generation failed: {e}")
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


# ──── View tracking ────
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


# Register
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
