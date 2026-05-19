"""
Gemini Generation Service for STEMScroll.

Uses emergentintegrations.LlmChat → Gemini 2.5-flash with temperature=0.95
to generate batches of unique STEM cards. Anti-repeat hashes are injected
into every prompt so Gemini avoids previously-seen content.
"""

import json
import logging
import random
import re
import uuid
from datetime import date
from typing import Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage

log = logging.getLogger("stemscroll.gemini")

PROVIDER = "gemini"
MODEL = "gemini-2.5-flash"
TEMPERATURE = 0.95
MAX_TOKENS = 8192
BATCH_SIZE = 8

AGE_RULES = {
    "explorer":   "Audience: ages 3-7. Max 2 short sentences per card. Words a 4-year-old knows. Wonder and magic. NO jargon, NO numbers above 100.",
    "discoverer": "Audience: ages 8-12. 3-5 sentences. Relatable analogies. One genuine 'wow factor' per card.",
    "scientist":  "Audience: 13-15. Real terminology with brief inline definitions. Real-world applications. Max 120 words per card.",
    "guide":      "Audience: parents/educators. Include curriculum link, one discussion question, and the common misconception being corrected.",
}

CARD_SCHEMA = (
    '{"type":"fact|quiz|experiment|story|diagram",'
    '"subject":"biology|chemistry|astronomy|physics|nature|maths|technology|engineering",'
    '"emoji":"single emoji",'
    '"headline":"max 10 words — must be surprising or a question",'
    '"body":"main explanation text",'
    '"source":"real source attribution (journal, institution, etc.)",'
    '"quizOptions":["option A","option B","option C"],'
    '"correctAnswer":0,'
    '"explanation":"why the correct answer is right",'
    '"materials":["..."],'
    '"steps":["numbered step 1","step 2"],'
    '"whatHappens":"expected result of experiment",'
    '"parentNote":"optional safety or curriculum note",'
    '"diagramParts":[{"label":"part name","desc":"what it does"}],'
    '"xpValue":10,'
    '"mascot":"sprouty|drSprout|quizzle|wombles|zoomerroo|ausomeKoala|neuroSprouty",'
    '"ageTier":"explorer|discoverer|scientist|guide",'
    '"confidence":0.95}'
)


def _build_system_prompt(age_mode: str) -> str:
    age_rule = AGE_RULES.get(age_mode, AGE_RULES["discoverer"])
    return (
        "You are a world-class STEM content creator for STEMScroll, a neurodiversity-affirming "
        "children's STEM learning platform. You generate batches of engaging STEM cards.\n\n"
        f"AGE RULE: {age_rule}\n\n"
        "OUTPUT FORMAT: Reply with a JSON object: {\"cards\":[...]} containing a 'cards' array. "
        "No markdown, no prose, no explanation. Pure JSON only. Each card must follow this schema:\n"
        f"{CARD_SCHEMA}\n\n"
        "CONTENT RULES:\n"
        "- Each card must cover a genuinely DIFFERENT angle or fact\n"
        "- Quiz cards must have exactly 3 options and one plausible misconception as a wrong answer\n"
        "- Experiment cards use only common household materials (max 7 steps)\n"
        "- Fact headlines must be surprising, counterintuitive, or phrased as a question\n"
        "- Diagram cards must visually explain a concept (use diagramParts array)\n"
        "- Every card must feel like a dopamine hit — surprising, memorable, exciting\n"
        "- confidence: 0.95 means you are sure every claim is verified scientific consensus\n"
        "CRITICAL: MAXIMUM VARIATION. Generate the most surprising, diverse, unexpected content possible. "
        "Avoid all obvious or generic facts."
    )


def _build_user_prompt(
    topic: str,
    category: str,
    age_mode: str,
    card_types: list,
    count: int,
    recent_hashes: list,
    avoid_headlines: list,
) -> str:
    hash_block = ""
    if recent_hashes:
        hash_block = (
            "\nCRITICAL — Do NOT generate content similar to these already-seen cards "
            "(identified by content hash — any similarity will be detected and rejected):\n"
            f"Recent hashes: {recent_hashes[:20]}\n"
        )
    if avoid_headlines:
        hash_block += (
            "These headlines are BANNED — do not use similar phrasing:\n"
            f"{avoid_headlines[:15]}\n"
        )

    type_distribution = ", ".join(card_types)
    return (
        f"Generate EXACTLY {count} STEM cards about: \"{topic}\" (category: {category}).\n"
        f"Card type mix: {type_distribution}\n"
        f"Age mode: {age_mode}\n"
        f"{hash_block}\n"
        f"Each card must cover a COMPLETELY DIFFERENT angle of '{topic}'.\n"
        f"Apply temperature=0.95 thinking: explore unexpected, niche, and counterintuitive aspects.\n"
        f"Return ONLY a valid JSON object of the form: "
        f"{{\"cards\":[<{count} card objects>]}}"
    )


def _get_type_mix(n: int, preferences: list = None) -> list:
    all_types = ["fact", "fact", "quiz", "experiment", "diagram", "story"]
    types = (preferences or []) * 3 + all_types * 3
    random.shuffle(types)
    return types[:n]


def _strip_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        # remove first ``` line and any trailing ```
        raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
        raw = re.sub(r"\n?```\s*$", "", raw)
    return raw.strip()


def _parse_cards(raw_text: str) -> list:
    """Parse Gemini response. Accepts either {"cards":[...]} or [...] forms."""
    raw = _strip_fences(raw_text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Last-resort: extract first JSON array from the text
        m = re.search(r"\[\s*\{.*?\}\s*\]", raw, re.DOTALL)
        if not m:
            raise
        data = json.loads(m.group())
    if isinstance(data, dict):
        cards = data.get("cards") or data.get("data") or []
        if not cards and any(k in data for k in ("type", "headline")):
            cards = [data]
    elif isinstance(data, list):
        cards = data
    else:
        cards = []
    return cards


class GeminiService:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def _make_chat(self, age_mode: str, session_suffix: str = "") -> LlmChat:
        session_id = f"feedgen-{uuid.uuid4().hex[:10]}{session_suffix}"
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=_build_system_prompt(age_mode),
        ).with_model(PROVIDER, MODEL).with_params(
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )
        return chat

    async def generate_batch(
        self,
        topic: str,
        category: str,
        age_mode: str = "discoverer",
        count: int = BATCH_SIZE,
        recent_hashes: list = None,
        avoid_headlines: list = None,
        card_types: list = None,
    ) -> list:
        if not self.api_key:
            log.warning("Gemini API key missing — returning empty batch")
            return []

        recent_hashes = recent_hashes or []
        avoid_headlines = avoid_headlines or []
        card_types = card_types or _get_type_mix(count)

        chat = self._make_chat(age_mode)
        prompt_text = _build_user_prompt(
            topic=topic,
            category=category,
            age_mode=age_mode,
            card_types=card_types,
            count=count,
            recent_hashes=recent_hashes,
            avoid_headlines=avoid_headlines,
        )

        raw_text = ""
        try:
            raw_text = await chat.send_message(UserMessage(text=prompt_text))
            cards = _parse_cards(raw_text)
        except json.JSONDecodeError as e:
            log.error(f"Gemini JSON parse error: {e} — raw: {raw_text[:300]}")
            return []
        except Exception as e:
            log.error(f"Gemini generation error: {e}")
            return []

        today = date.today().isoformat()
        stamped = []
        for c in cards:
            if not isinstance(c, dict):
                continue
            c["id"] = f"g-{uuid.uuid4().hex[:8]}"
            c.setdefault("ageTier", age_mode)
            c.setdefault("confidence", 0.90)
            c.setdefault("verified", c.get("confidence", 0) >= 0.85)
            c.setdefault("last_verified", today)
            c.setdefault("source_url", "")
            c.setdefault("xpValue", 10)
            c["ai_generated"] = True
            stamped.append(c)

        log.info(
            f"Gemini generated {len(stamped)} cards for topic='{topic}' "
            f"category='{category}' age_mode={age_mode}"
        )
        return stamped

    async def verify_card(self, card: dict) -> dict:
        """Second pass: fact-check a generated card. Returns {verified, confidence, issues}."""
        if not self.api_key:
            return {"verified": False, "confidence": 0.5, "issues": "no_api_key"}
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"verify-{uuid.uuid4().hex[:10]}",
            system_message=(
                "You are a strict STEM fact-checker for a children's educational app. "
                "Given a card, check every factual claim. "
                "Reply with ONLY valid JSON: "
                '{"verified": true|false, "confidence": 0.0-1.0, "issues": "brief reason"}. '
                "verified=true ONLY if every claim is mainstream scientific consensus and age-appropriate. "
                "When in doubt, lower confidence."
            ),
        ).with_model(PROVIDER, MODEL).with_params(temperature=0.1, max_tokens=256)

        try:
            raw = await chat.send_message(
                UserMessage(text=f"Verify this card:\n{json.dumps(card)}")
            )
            raw = _strip_fences(raw)
            return json.loads(raw)
        except Exception as e:
            log.error(f"Gemini verify error: {e}")
            return {"verified": False, "confidence": 0.5, "issues": str(e)}


# Singleton
_service: Optional[GeminiService] = None


def init_gemini(api_key: str):
    global _service
    _service = GeminiService(api_key)
    log.info(f"Gemini service initialized via emergentintegrations: model={MODEL} temperature={TEMPERATURE}")


def get_gemini() -> Optional[GeminiService]:
    return _service
