"""STEMScroll backend API tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"

TEST_UID = "test_user_t1_001"


class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


class TestSeedCards:
    def test_seed_cards(self):
        r = requests.get(f"{API}/cards/seed")
        assert r.status_code == 200
        data = r.json()
        cards = data.get("cards", data)
        assert isinstance(cards, list)
        assert len(cards) >= 10
        # Validate first card structure
        c = cards[0]
        assert "id" in c
        assert "type" in c
        assert "subject" in c

    def test_card_types_present(self):
        r = requests.get(f"{API}/cards/seed")
        cards = r.json().get("cards", [])
        types = {c.get("type") for c in cards}
        assert len(types) > 1  # multiple card types


class TestUserEndpoints:
    def test_get_user_creates_profile(self):
        r = requests.get(f"{API}/user/{TEST_UID}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("user_id") == TEST_UID

    def test_onboard_user(self):
        payload = {
            "age_mode": "discoverer",
            "selected_topics": ["Physics", "Biology"],
            "is_neurodiverse": False
        }
        r = requests.post(f"{API}/user/{TEST_UID}/onboard", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("onboarded") is True

    def test_annealed_feed(self):
        r = requests.get(f"{API}/user/{TEST_UID}/annealed-feed")
        assert r.status_code == 200
        data = r.json()
        cards = data.get("cards", data)
        assert isinstance(cards, list)
        assert len(cards) > 0

    def test_add_xp(self):
        r = requests.post(f"{API}/user/{TEST_UID}/xp", json={"amount": 10})
        assert r.status_code == 200

    def test_save_card(self):
        # Get a card to save
        cards_r = requests.get(f"{API}/cards/seed")
        card = cards_r.json().get("cards", [])[0]
        payload = {"card_id": card["id"], "card_data": card}
        r = requests.post(f"{API}/user/{TEST_UID}/saved", json=payload)
        assert r.status_code == 200

    def test_get_saved(self):
        r = requests.get(f"{API}/user/{TEST_UID}/saved")
        assert r.status_code == 200
        data = r.json()
        saved = data.get("saved", data)
        assert isinstance(saved, list)

    def test_record_view(self):
        cards_r = requests.get(f"{API}/cards/seed")
        card = cards_r.json().get("cards", [])[0]
        r = requests.post(f"{API}/user/{TEST_UID}/view", json={"card_id": card["id"], "dwell_ms": 5000})
        assert r.status_code == 200

    def test_record_skip(self):
        cards_r = requests.get(f"{API}/cards/seed")
        card = cards_r.json().get("cards", [])[0]
        r = requests.post(f"{API}/user/{TEST_UID}/skip", json={"card_id": card["id"]})
        assert r.status_code == 200

    def test_update_streak(self):
        r = requests.post(f"{API}/user/{TEST_UID}/streak", json={})
        assert r.status_code == 200


class TestMissions:
    def test_get_missions(self):
        r = requests.get(f"{API}/missions")
        assert r.status_code == 200
        data = r.json()
        missions = data.get("missions", data)
        assert isinstance(missions, list)
        assert len(missions) > 0

    def test_get_mission_cards(self):
        r = requests.get(f"{API}/missions")
        missions = r.json().get("missions", [])
        if not missions:
            pytest.skip("No missions available")
        mid = missions[0].get("id")
        r2 = requests.get(f"{API}/missions/{mid}")
        assert r2.status_code == 200
        data = r2.json()
        cards = data.get("cards", data)
        assert isinstance(cards, list)
