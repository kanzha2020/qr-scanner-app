"""Tests for the QR Scanner server, focusing on the front-end dashboard route."""

import os
import tempfile
import pytest

# Point to a temporary database before importing the app
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.environ["DB_PATH"] = _db_path

from server import app, init_db  # noqa: E402


@pytest.fixture(autouse=True)
def setup_db():
    """Initialise a fresh database for every test."""
    init_db()
    yield
    # DB file is reused across tests in the same process; that's fine for
    # read-heavy tests. The tempfile is cleaned up at process exit.


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ── Front-end dashboard ──────────────────────────────────────

def test_index_returns_html(client):
    """GET / should return the dashboard HTML page."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"QR Scanner Dashboard" in resp.data
    assert resp.content_type.startswith("text/html")


def test_index_contains_key_elements(client):
    """The dashboard should contain essential UI elements."""
    resp = client.get("/")
    html = resp.data.decode()
    assert "total-scans" in html
    assert "device-filter" in html
    assert "search-input" in html
    assert "/api/export/csv" in html
    assert "/api/health" in html


# ── API smoke tests ──────────────────────────────────────────

def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"
    assert "total_scans" in data


def test_scans_empty(client):
    resp = client.get("/api/scans")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"


def test_post_and_list_scan(client):
    payload = {
        "qr_content": "https://example.com",
        "latitude": 37.77,
        "longitude": -122.42,
        "scan_time": "2026-02-06T14:30:00Z",
        "device_id": "TestDevice",
    }
    resp = client.post("/api/scan", json=payload)
    assert resp.status_code == 201

    resp = client.get("/api/scans")
    data = resp.get_json()
    assert data["count"] >= 1
    assert data["scans"][0]["qr_content"] == "https://example.com"
