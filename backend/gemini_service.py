"""
Gemini Generation Service for STEMScroll.

Uses Google Generative AI (gemini-2.5-flash) with temperature=0.95
to generate batches of unique STEM cards. Anti-repeat hashes are
injected into every prompt so Gemini avoids previously seen content.
"""

import json
import logging
import os
import random
import uuid
from datetime import date, datetime, timezone
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

log = logging.getLogger("stemscroll.gemini")

MODEL_NAME = "gemini-2.5-flash"
TEMPERATURE = 0.95        # Maximum creativity / variation as specified
MAX_TOKENS  = 8192
BATCH_SIZE  = 8           # Cards generated per Gemini call

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
        "You are a world-class STEM content creator for BrightSprout, a neurodiversity-affirming "
        "children's STEM learning platform. You generate batches of engaging STEM cards.\n\n"
        f"AGE RULE: {age_rule}\n\n"
        "OUTPUT FORMAT: Reply with a JSON ARRAY of card objects. No markdown, no prose, no explanation. "
        "Pure JSON array only. Each card must follow this schema:\n"
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
            f"\nCRITICAL — Do NOT generate content similar to these already-seen cards "
            f"(identified by content hash — any similarity will be detected and rejected):\n"
            f"Recent hashes: {recent_hashes[:20]}\n"
            f"These headlines are BANNED — do not use similar phrasing:\n"
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
        f"Return ONLY a valid JSON array of {count} card objects."
    )


def _get_type_mix(n: int, preferences: list = None) -> list:
    """Generate a varied mix of card types."""
    all_types = ["fact", "fact", "quiz", "experiment", "diagram", "story"]
    if preferences:
        types = preferences * 3 + all_types
    else:
        types = all_types * 3
    random.shuffle(types)
    return types[:n]


class GeminiService:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self._model = None

    def _get_model(self, age_mode: str):
        """Returns a Gemini model instance with temperature=0.95."""
        return genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=_build_system_prompt(age_mode),
            generation_config=GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_TOKENS,
                response_mime_type="application/json",
            ),
        )

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
        """
        Generate a batch of STEM cards via Gemini with temperature=0.95.
        Injects anti-repeat hashes and banned headlines into the prompt.
        Returns parsed list of card dicts, or [] on failure.
        """
        if not self._is_configured():
            log.warning("Gemini API key not configured — returning empty batch")
            return []

        recent_hashes = recent_hashes or []
        avoid_headlines = avoid_headlines or []
        card_types = card_types or _get_type_mix(count)

        model = self._get_model(age_mode)
        prompt = _build_user_prompt(
            topic=topic,
            category=category,
            age_mode=age_mode,
            card_types=card_types,
            count=count,
            recent_hashes=recent_hashes,
            avoid_headlines=avoid_headlines,
        )

        try:
            response = model.generate_content(prompt)
            raw = response.text.strip()
            # Strip code fences if present
            if raw.startswith("```"):
                raw = raw.strip("`")
                if raw.startswith("json"):
                    raw = raw[4:]
            cards = json.loads(raw.strip())
            if not isinstance(cards, list):
                cards = [cards]

            # Stamp IDs and metadata
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

            log.info(f"Gemini generated {len(stamped)} cards for topic='{topic}' category='{category}'")
            return stamped

        except json.JSONDecodeError as e:
            log.error(f"Gemini JSON parse error: {e} — raw: {raw[:200]}")
            return []
        except Exception as e:
            log.error(f"Gemini generation error: {e}")
            return []

    def _is_configured(self) -> bool:
        try:
            genai.get_model(MODEL_NAME)
            return True
        except Exception:
            return False

    async def verify_card(self, card: dict) -> dict:
        """
        Self-verification pass: second Gemini call to fact-check a generated card.
        Returns {verified: bool, confidence: float, issues: str}
        """
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=(
                "You are a strict STEM fact-checker for a children's educational app. "
                "Given a card, check every factual claim. "
                "Reply with ONLY valid JSON: "
                '{"verified": true|false, "confidence": 0.0-1.0, "issues": "brief reason"}. '
                "verified=true ONLY if every claim is mainstream scientific consensus, age-appropriate, "
                "and the source (if provided) is real. When in doubt, lower confidence."
            ),
            generation_config=GenerationConfig(temperature=0.1, max_output_tokens=256),
        )
        try:
            resp = model.generate_content(f"Verify this card:\n{json.dumps(card)}")
            raw = resp.text.strip()
            if raw.startswith("```"):
                raw = raw.strip("`").lstrip("json").strip()
            return json.loads(raw)
        except Exception as e:
            log.error(f"Gemini verify error: {e}")
            return {"verified": False, "confidence": 0.5, "issues": str(e)}


# Singleton instance — initialized in server.py lifespan
_service: Optional[GeminiService] = None


def init_gemini(api_key: str):
    global _service
    _service = GeminiService(api_key)
    log.info(f"Gemini service initialized with model={MODEL_NAME} temperature={TEMPERATURE}")


def get_gemini() -> Optional[GeminiService]:
    return _service
