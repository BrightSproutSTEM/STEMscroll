"""
Topic Rotation Service for STEMScroll.
Tracks covered topics per user+context and selects the next topic
to maximise variety and minimise repetition.
"""

import random
from datetime import datetime, timezone
from typing import Optional
import motor.motor_asyncio

_db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

TOPIC_POOLS = {
    "biology": [
        "the human immune system", "plant photosynthesis", "DNA and genetics",
        "deep sea creatures", "symbiosis in nature", "how viruses replicate",
        "animal camouflage", "the brain and neurons", "bacteria everywhere",
        "evolution and natural selection", "how insects communicate",
        "the water cycle in living things", "bioluminescence", "fungi kingdom",
        "gut microbiome", "metamorphosis", "how muscles work",
    ],
    "chemistry": [
        "states of matter and transitions", "acids and bases in everyday life",
        "atoms and electrons", "chemical reactions in cooking",
        "periodic table surprises", "polymers and plastics",
        "why metals conduct electricity", "combustion reactions",
        "osmosis and diffusion", "chemistry of colour",
        "catalysts and enzymes", "radioactivity basics",
    ],
    "astronomy": [
        "black holes and event horizons", "how stars are born and die",
        "the scale of the universe", "dark matter and dark energy",
        "Mars exploration", "exoplanets and habitability",
        "the International Space Station", "Jupiter's Great Red Spot",
        "comets and asteroids", "the Big Bang theory",
        "neutron stars and pulsars", "galaxy formation",
        "Saturn's rings", "the speed of light",
    ],
    "physics": [
        "gravity and general relativity", "light and optics",
        "sound waves and music", "electricity and circuits",
        "quantum mechanics basics", "magnetism and electromagnets",
        "thermodynamics and entropy", "nuclear fission and fusion",
        "Newton's laws of motion", "wave-particle duality",
        "superconductors", "fluid dynamics",
    ],
    "maths": [
        "Fibonacci in nature", "prime numbers and cryptography",
        "the golden ratio", "probability and chance",
        "fractal geometry", "infinity in mathematics",
        "zero and its history", "pi and circles",
        "graph theory", "statistics and data",
        "game theory", "mathematical patterns in music",
    ],
    "technology": [
        "how the internet works", "artificial intelligence basics",
        "quantum computing", "blockchain explained",
        "3D printing technology", "how GPS satellites work",
        "virtual reality science", "how smartphones work",
        "computer vision", "self-driving cars",
        "renewable energy tech", "robotics and automation",
    ],
    "engineering": [
        "bridge engineering principles", "rocket propulsion",
        "how aeroplanes fly", "sustainable architecture",
        "dam and water engineering", "microchip manufacturing",
        "materials science", "biomimicry in engineering",
        "space elevator concepts", "underwater engineering",
    ],
    "nature": [
        "rainforest ecosystems", "the deep ocean world",
        "desert adaptations", "Arctic and Antarctic life",
        "forest food webs", "coral reef ecosystems",
        "soil science and earthworms", "bird migration mysteries",
        "animal intelligence", "plant communication",
    ],
}

# Default rotation order for balanced coverage
CATEGORY_ROTATION = [
    "biology", "astronomy", "physics", "maths",
    "chemistry", "technology", "nature", "engineering",
]


def init_db(db: motor.motor_asyncio.AsyncIOMotorDatabase):
    global _db
    _db = db


async def get_next_topic(category: str, user_id: str, context: str) -> str:
    """
    Returns the next topic to generate for this category+context.
    Tries to avoid recently covered topics.
    """
    pool = TOPIC_POOLS.get(category, TOPIC_POOLS["biology"])
    recent = await _get_recent_topics(user_id, context, category, limit=10)
    fresh = [t for t in pool if t not in recent]
    chosen = random.choice(fresh) if fresh else random.choice(pool)
    await _record_topic(user_id, context, category, chosen)
    return chosen


async def get_next_category(user_id: str, context: str,
                             user_topics: list = None) -> str:
    """
    Returns the next category to cover, balancing across subjects
    the user cares about.
    """
    if user_topics:
        valid = [c for c in user_topics if c in TOPIC_POOLS]
        if valid:
            recent_cats = await _get_recent_categories(user_id, context, limit=4)
            fresh_cats = [c for c in valid if c not in recent_cats]
            return random.choice(fresh_cats) if fresh_cats else random.choice(valid)
    # Default rotation
    recent_cats = await _get_recent_categories(user_id, context, limit=4)
    fresh = [c for c in CATEGORY_ROTATION if c not in recent_cats]
    return random.choice(fresh) if fresh else random.choice(CATEGORY_ROTATION)


async def _get_recent_topics(user_id: str, context: str,
                              category: str, limit: int) -> list:
    if _db is None:
        return []
    docs = await _db.topic_history.find(
        {"user_id": user_id, "context": context, "category": category},
        {"topic": 1},
    ).sort("covered_at", -1).limit(limit).to_list(limit)
    return [d["topic"] for d in docs]


async def _get_recent_categories(user_id: str, context: str, limit: int) -> list:
    if _db is None:
        return []
    docs = await _db.topic_history.find(
        {"user_id": user_id, "context": context},
        {"category": 1},
    ).sort("covered_at", -1).limit(limit).to_list(limit)
    return [d["category"] for d in docs]


async def _record_topic(user_id: str, context: str,
                        category: str, topic: str):
    if _db is None:
        return
    await _db.topic_history.insert_one({
        "user_id": user_id,
        "context": context,
        "category": category,
        "topic": topic,
        "covered_at": datetime.now(timezone.utc).isoformat(),
    })
