import os

os.environ["LLM_MODE"] = "mock"

import pytest
from fastapi.testclient import TestClient

from app import deps
from app.config import get_settings
from app.main import app
from app.storage.local import LocalJsonRepository


@pytest.fixture
def client(tmp_path):
    get_settings.cache_clear()
    deps.get_generator.cache_clear()
    app.dependency_overrides[deps.get_repo] = lambda: LocalJsonRepository(str(tmp_path))
    yield TestClient(app)
    app.dependency_overrides.clear()


REQ = {"destination": "Paris", "durationDays": 3, "totalBudget": 1500, "interests": ["museums", "food"]}


def test_create_get_refine_delete(client):
    r = client.post("/plans", json=REQ)
    assert r.status_code == 201
    plan = r.json()
    assert plan["totalDays"] == 3
    assert plan["breakdown"]["total"] == plan["totalEstimatedCost"]
    assert plan["budgetStatus"] in {"under_budget", "on_budget", "over_budget"}

    assert client.get(f"/plans/{plan['id']}").status_code == 200
    assert len(client.get("/plans").json()) == 1

    r = client.post(f"/plans/{plan['id']}/refine", json={"instruction": "make day 2 cheaper", "dayNumber": 2})
    assert r.status_code == 200 and r.json()["id"] == plan["id"]

    assert client.delete(f"/plans/{plan['id']}").status_code == 204
    assert client.get(f"/plans/{plan['id']}").status_code == 404


def test_validation_and_traversal(client):
    assert client.post("/plans", json={**REQ, "durationDays": 0}).status_code == 422
    assert client.get("/plans/..%2F..%2Fetc").status_code == 404
