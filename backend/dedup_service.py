"""
Deduplication Service for STEMScroll.

Implements the Universal Non-Repeat Engine using MongoDB:
- SeenContentRegistry: permanent per-user-per-context card history
- RecentBuffer: rolling last-10 shown per context (immediate block)
- UniqueCounter: tracks unique count per category+type for 200/5 rule
- MemoryBank: stores every approved card for offline serving
"""

import hashlib
import json
import random
import uuid
from datetime import datetime, timezone
from typing import Optional

import motor.motor_asyncio

# DB injected at startup
_db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


def init_db(db: motor.motor_asyncio.AsyncIOMotorDatabase):
    global _db
    _db = db


# ── Context key namespace ──────────────────────────────────────────────────
class CONTEXTS:
    @staticmethod
    def FEED(user_id: str) -> str:        return f"feed_{user_id}"
    @staticmethod
    def QUIZ(user_id: str) -> str:        return f"quiz_{user_id}"
    @staticmethod
    def DIAGRAM(user_id: str) -> str:     return f"diagram_{user_id}"
    @staticmethod
    def FACT(user_id: str) -> str:        return f"fact_{user_id}"
    @staticmethod
    def EXPERIMENT(user_id: str) -> str:  return f"experiment_{user_id}"
    @staticmethod
    def MISSION(user_id: str, mission_id: str) -> str:
        return f"mission_{mission_id}_{user_id}"
    @staticmethod
    def DAILY(user_id: str) -> str:       return f"daily_challenge_{user_id}"


# ── Card hashing ──────────────────────────────────────────────────────────
_HASH_EXTRACTORS = {
    "fact":       lambda c: (c.get("headline") or c.get("title","")) + (c.get("body") or c.get("mainContent","")),
    "quiz":       lambda c: (c.get("headline") or c.get("title","")) + "".join(c.get("quizOptions") or []) + str(c.get("correctAnswer","")),
    "diagram":    lambda c: (c.get("headline") or c.get("title","")) + "".join(p.get("desc","") for p in (c.get("diagramParts") or [])),
    "experiment": lambda c: (c.get("headline") or c.get("title","")) + "".join(c.get("steps") or []),
    "story":      lambda c: (c.get("headline") or c.get("title","")) + (c.get("body") or c.get("content","")),
}


def hash_card(card: dict) -> str:
    """SHA-256 of the content-defining fields for the card type."""
    extractor = _HASH_EXTRACTORS.get(
        card.get("type", "fact"),
        lambda c: (c.get("headline","") + c.get("body","")),
    )
    raw = extractor(card).lower().strip()
    return hashlib.sha256(raw.encode()).hexdigest()


# ── Ensure MongoDB indexes ─────────────────────────────────────────────────
async def ensure_indexes():
    await _db.seen_registry.create_index(
        [("user_id", 1), ("context", 1), ("content_hash", 1)], unique=True)
    await _db.seen_registry.create_index([("user_id", 1), ("context", 1), ("last_seen_at", -1)])
    await _db.recent_buffer.create_index(
        [("user_id", 1), ("context", 1), ("content_hash", 1)], unique=True)
    await _db.recent_buffer.create_index([("user_id", 1), ("context", 1), ("position", 1)])
    await _db.unique_counter.create_index(
        [("user_id", 1), ("context", 1), ("category", 1), ("card_type", 1)], unique=True)
    await _db.memory_bank.create_index([("content_hash", 1)], unique=True)
    await _db.memory_bank.create_index([("category", 1), ("age_tier", 1), ("card_type", 1)])


# ── Gate 1: Recent buffer check ────────────────────────────────────────────
async def _in_recent_buffer(user_id: str, context: str, content_hash: str) -> bool:
    doc = await _db.recent_buffer.find_one(
        {"user_id": user_id, "context": context, "content_hash": content_hash},
    )
    return doc is not None


# ── Gate 2+3: Registry check ────────────────────────────────────────────────
async def _check_registry(user_id: str, context: str, content_hash: str,
                           category: str, card_type: str) -> dict:
    """Returns allow/deny with reason."""
    existing = await _db.seen_registry.find_one(
        {"user_id": user_id, "context": context, "content_hash": content_hash}
    )
    if not existing:
        return {"allowed": True, "is_new": True}

    # 200-unique threshold
    counter = await _db.unique_counter.find_one(
        {"user_id": user_id, "context": context, "category": category, "card_type": card_type}
    )
    unique_count = (counter or {}).get("unique_count", 0)
    if unique_count < 200:
        return {"allowed": False, "reason": "under_200_threshold"}

    # 5-repeat cap
    if existing.get("seen_count", 0) >= 5:
        return {"allowed": False, "reason": "repeat_cap_reached"}

    return {"allowed": True, "is_new": False, "is_repeat": True,
            "current_count": existing["seen_count"]}


async def can_show_card(user_id: str, context: str, card: dict) -> dict:
    """Three-gate deduplication check. Returns {allowed, hash, reason?, is_new?}."""
    content_hash = hash_card(card)
    category = card.get("subject", card.get("category", "general"))
    card_type = card.get("type", "fact")

    # Gate 1 — recent buffer (last 10)
    if await _in_recent_buffer(user_id, context, content_hash):
        return {"allowed": False, "hash": content_hash, "reason": "recent_buffer"}

    # Gates 2 + 3 — registry + 200/5 rule
    result = await _check_registry(user_id, context, content_hash, category, card_type)
    result["hash"] = content_hash
    return result


async def register_shown(user_id: str, context: str, card: dict,
                          content_hash: str, is_new: bool):
    """Record card as shown. Updates registry, rolling buffer, and unique counter."""
    now = datetime.now(timezone.utc).isoformat()
    category = card.get("subject", card.get("category", "general"))
    card_type = card.get("type", "fact")
    age_tier = card.get("ageTier", card.get("age_mode", "discoverer"))

    # Upsert seen registry
    await _db.seen_registry.update_one(
        {"user_id": user_id, "context": context, "content_hash": content_hash},
        {"$inc": {"seen_count": 1},
         "$set": {"last_seen_at": now, "category": category, "card_type": card_type},
         "$setOnInsert": {"first_seen_at": now, "age_tier": age_tier}},
        upsert=True,
    )

    # Update rolling RecentBuffer (max 10 per context)
    # Increment positions of all existing
    await _db.recent_buffer.update_many(
        {"user_id": user_id, "context": context},
        {"$inc": {"position": 1}},
    )
    # Insert/replace the new one at position 1
    await _db.recent_buffer.update_one(
        {"user_id": user_id, "context": context, "content_hash": content_hash},
        {"$set": {"position": 1, "shown_at": now}},
        upsert=True,
    )
    # Prune anything > 10
    old = await _db.recent_buffer.find(
        {"user_id": user_id, "context": context, "position": {"$gt": 10}},
    ).to_list(50)
    if old:
        await _db.recent_buffer.delete_many(
            {"user_id": user_id, "context": context, "position": {"$gt": 10}}
        )

    # Increment unique counter (only for brand-new cards)
    if is_new:
        await _db.unique_counter.update_one(
            {"user_id": user_id, "context": context,
             "category": category, "card_type": card_type},
            {"$inc": {"unique_count": 1}},
            upsert=True,
        )

    # Auto-save to memory bank
    await _auto_bank(card, content_hash, category, card_type, age_tier)


async def _auto_bank(card: dict, content_hash: str, category: str,
                     card_type: str, age_tier: str):
    """Save every shown card to the memory bank (for offline serving)."""
    await _db.memory_bank.update_one(
        {"content_hash": content_hash},
        {"$setOnInsert": {
            "id": str(uuid.uuid4()),
            "card_type": card_type,
            "category": category,
            "age_tier": age_tier,
            "content": json.dumps(card),
            "content_hash": content_hash,
            "engagement_score": 0,
            "source": "gemini_generated",
            "verified": card.get("verified", False),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )


async def filter_approved_cards(user_id: str, context: str,
                                 cards: list) -> list:
    """Batch deduplication filter. Returns only cards that pass all 3 gates."""
    approved = []
    for card in cards:
        result = await can_show_card(user_id, context, card)
        if result["allowed"]:
            await register_shown(user_id, context, card,
                                  result["hash"], result.get("is_new", True))
            card["content_hash"] = result["hash"]
            card["is_repeat"] = result.get("is_repeat", False)
            approved.append(card)
    return approved


async def get_recent_hashes(user_id: str, context: str, limit: int = 20) -> list:
    """Return the most recently shown content hashes for anti-repeat prompt injection."""
    docs = await _db.seen_registry.find(
        {"user_id": user_id, "context": context},
        {"content_hash": 1},
    ).sort("last_seen_at", -1).limit(limit).to_list(limit)
    return [d["content_hash"] for d in docs]


async def get_dedup_stats(user_id: str, context: str) -> dict:
    """Return statistics about the deduplication state for a user+context."""
    total_seen = await _db.seen_registry.count_documents(
        {"user_id": user_id, "context": context})
    buffer_size = await _db.recent_buffer.count_documents(
        {"user_id": user_id, "context": context})
    counters = await _db.unique_counter.find(
        {"user_id": user_id, "context": context},
        {"_id": 0},
    ).to_list(100)
    bank_size = await _db.memory_bank.count_documents({})
    return {
        "total_seen": total_seen,
        "recent_buffer": buffer_size,
        "unique_counters": counters,
        "memory_bank_size": bank_size,
    }


async def get_offline_cards(user_id: str, context: str, card_type: str,
                             category: str, age_tier: str, count: int) -> list:
    """Serve cards from the memory bank when offline, still respecting dedup rules."""
    candidates = await _db.memory_bank.find(
        {"card_type": card_type, "category": category},
        {"_id": 0},
    ).limit(50).to_list(50)

    approved = []
    for item in candidates:
        try:
            card = json.loads(item["content"])
        except Exception:
            continue
        result = await can_show_card(user_id, context, card)
        if result["allowed"]:
            await register_shown(user_id, context, card,
                                  result["hash"], result.get("is_new", True))
            card["offline_source"] = True
            card["from_stash"] = True
            approved.append(card)
            if len(approved) >= count:
                break
    return approved


async def serve_from_bank(user_id: str, context: str, count: int,
                           categories: list = None) -> list:
    """
    Serve approved (not-yet-seen) cards from the memory bank.
    Used when Gemini generation is slow / ingress would time out.
    Categories filter is optional — if provided, prefer those subjects.
    """
    query: dict = {}
    if categories:
        query["category"] = {"$in": categories}

    # Pull a larger pool so the dedup filter can find unseen cards.
    candidates = await _db.memory_bank.find(query, {"_id": 0}) \
        .sort("created_at", -1).limit(120).to_list(120)
    random.shuffle(candidates)

    approved = []
    for item in candidates:
        try:
            card = json.loads(item["content"])
        except Exception:
            continue
        result = await can_show_card(user_id, context, card)
        if not result["allowed"]:
            continue
        await register_shown(user_id, context, card,
                              result["hash"], result.get("is_new", True))
        card["from_stash"] = True
        approved.append(card)
        if len(approved) >= count:
            break
    return approved

