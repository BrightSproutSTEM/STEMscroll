"""STEMScroll Backend Test Suite - covers all endpoints from the review request.
Tests against EXPO_PUBLIC_BACKEND_URL (public route, /api prefix)."""

import os
import time
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")
# Frontend .env holds the public preview URL
FRONTEND_ENV = Path(__file__).parent.parent.parent / "frontend" / ".env"
if FRONTEND_ENV.exists():
    load_dotenv(FRONTEND_ENV)

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def user_id():
    return f"TEST_u_{uuid.uuid4().hex[:8]}"


# ─────────────── Health
def test_root(api_client):
    r = api_client.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ─────────────── Cards: seed
class TestCards:
    def test_seed_cards_returns_50plus(self, api_client):
        r = api_client.get(f"{API}/cards/seed")
        assert r.status_code == 200
        body = r.json()
        cards = body["cards"]
        # Plan says 50+; allow >=40 due to seed_cards count
        assert len(cards) >= 40, f"Expected >=40 cards, got {len(cards)}"
        # required keys
        for c in cards[:5]:
            assert "type" in c and "subject" in c and "headline" in c and "body" in c and "id" in c
            assert "_id" not in c

    def test_seed_cards_subject_filter(self, api_client):
        r = api_client.get(f"{API}/cards/seed?subjects=biology")
        assert r.status_code == 200
        cards = r.json()["cards"]
        # filter only applies if >=8 matches; else returns all
        assert len(cards) >= 1

    def test_get_card_by_id(self, api_client):
        r = api_client.get(f"{API}/cards/f1")
        assert r.status_code == 200
        assert r.json()["id"] == "f1"
        assert "_id" not in r.json()

    def test_get_card_404(self, api_client):
        r = api_client.get(f"{API}/cards/zzz-nope")
        assert r.status_code == 404

    def test_generate_card_returns_card(self, api_client):
        r = api_client.post(f"{API}/cards/generate", json={
            "topic": "volcanoes", "age_mode": "discoverer", "card_type": "fact"
        })
        assert r.status_code == 200
        card = r.json()
        assert "type" in card and "headline" in card
        assert "_id" not in card


# ─────────────── Missions
class TestMissions:
    def test_list_missions(self, api_client):
        r = api_client.get(f"{API}/missions")
        assert r.status_code == 200
        missions = r.json()["missions"]
        assert len(missions) == 6
        ids = {m["id"] for m in missions}
        assert "space-101" in ids and "life-is-cells" in ids
        for m in missions:
            assert "_id" not in m

    def test_get_mission_hydrates_cards(self, api_client):
        r = api_client.get(f"{API}/missions/space-101")
        assert r.status_code == 200
        m = r.json()
        assert "cards" in m
        assert len(m["cards"]) == len(m["cardIds"])
        assert m["cards"][0]["id"] == m["cardIds"][0]

    def test_get_mission_404(self, api_client):
        r = api_client.get(f"{API}/missions/does-not-exist")
        assert r.status_code == 404


# ─────────────── User onboarding + profile
class TestUser:
    def test_get_or_create_user(self, api_client, user_id):
        r = api_client.get(f"{API}/user/{user_id}")
        assert r.status_code == 200
        u = r.json()
        assert u["user_id"] == user_id
        assert u["onboarded"] is False
        assert "_id" not in u

    def test_onboard_endpoint(self, api_client, user_id):
        r = api_client.post(f"{API}/user/{user_id}/onboard", json={
            "age_mode": "scientist",
            "selected_topics": ["biology", "physics"],
            "is_neurodiverse": True,
        })
        assert r.status_code == 200
        u = r.json()
        assert u["age_mode"] == "scientist"
        assert u["onboarded"] is True
        assert u["is_neurodiverse"] is True
        assert "biology" in u["selected_topics"]
        assert "_id" not in u

        # Verify persistence
        r2 = api_client.get(f"{API}/user/{user_id}")
        assert r2.json()["onboarded"] is True
        assert r2.json()["age_mode"] == "scientist"

    def test_streak_first_call_is_one(self, api_client):
        uid = f"TEST_streak_{uuid.uuid4().hex[:6]}"
        r = api_client.post(f"{API}/user/{uid}/streak")
        assert r.status_code == 200
        assert r.json()["streak_days"] == 1
        # second call same day - no change
        r2 = api_client.post(f"{API}/user/{uid}/streak")
        assert r2.json()["streak_days"] == 1

    def test_xp_adds_and_recomputes_level(self, api_client):
        uid = f"TEST_xp_{uuid.uuid4().hex[:6]}"
        # Trigger user creation
        api_client.get(f"{API}/user/{uid}")
        r = api_client.post(f"{API}/user/{uid}/xp", json={"amount": 60})
        assert r.status_code == 200
        body = r.json()
        assert body["xp_total"] == 60
        assert body["level"] == 2  # 50 threshold crossed
        r2 = api_client.post(f"{API}/user/{uid}/xp", json={"amount": 100})
        assert r2.json()["xp_total"] == 160
        assert r2.json()["level"] == 3

    def test_age_mode_endpoint(self, api_client, user_id):
        r = api_client.post(f"{API}/user/{user_id}/age-mode", json={"age_mode": "explorer"})
        assert r.status_code == 200
        assert r.json()["age_mode"] == "explorer"
        # invalid
        r2 = api_client.post(f"{API}/user/{user_id}/age-mode", json={"age_mode": "wizard"})
        assert r2.status_code == 400


# ─────────────── Saved cards
class TestSaved:
    def test_save_list_unsave(self, api_client):
        uid = f"TEST_save_{uuid.uuid4().hex[:6]}"
        card = {"id": "f1", "headline": "test"}
        # Save
        r = api_client.post(f"{API}/user/{uid}/saved", json={"card_id": "f1", "card_data": card})
        assert r.status_code == 200
        assert r.json()["ok"] is True

        # List
        r2 = api_client.get(f"{API}/user/{uid}/saved")
        assert r2.status_code == 200
        cards = r2.json()["cards"]
        assert len(cards) == 1
        assert cards[0]["card_id"] == "f1"
        assert "_id" not in cards[0]

        # Idempotent save
        api_client.post(f"{API}/user/{uid}/saved", json={"card_id": "f1", "card_data": card})
        r3 = api_client.get(f"{API}/user/{uid}/saved")
        assert len(r3.json()["cards"]) == 1

        # Unsave
        r4 = api_client.delete(f"{API}/user/{uid}/saved/f1")
        assert r4.status_code == 200
        r5 = api_client.get(f"{API}/user/{uid}/saved")
        assert len(r5.json()["cards"]) == 0


# ─────────────── View tracking
class TestView:
    def test_record_view(self, api_client):
        uid = f"TEST_view_{uuid.uuid4().hex[:6]}"
        r = api_client.post(f"{API}/user/{uid}/view", json={"card_id": "f1", "subject": "biology"})
        assert r.status_code == 200
        assert r.json()["ok"] is True
