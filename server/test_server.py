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


def test_index_uses_inline_map_instead_of_modal(client):
    """The dashboard should display inline maps, not a modal popup."""
    resp = client.get("/")
    html = resp.data.decode()
    # Inline map CSS classes should be present
    assert "inline-map" in html
    assert "inline-map-link" in html
    # Numerical coordinates should not be shown
    assert "inline-map-coords" not in html
    # The old modal elements should be removed
    assert "map-modal-overlay" not in html
    assert "map-modal-close" not in html
    assert "showMap(" not in html
    assert "closeMapModal" not in html
    # The old location-link clickable span should be gone
    assert "location-link" not in html


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


# ── Duplicate detection ──────────────────────────────────────

def test_duplicate_scan_rejected(client):
    """Posting the same QR content from the same device twice quickly
    should return a duplicate response on the second request."""
    payload = {
        "qr_content": "https://duplicate.example.com",
        "latitude": 40.0,
        "longitude": -74.0,
        "scan_time": "2026-02-07T10:00:00Z",
        "device_id": "DupDevice",
    }
    resp1 = client.post("/api/scan", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/scan", json=payload)
    data2 = resp2.get_json()
    assert resp2.status_code == 200
    assert data2["status"] == "duplicate"

    # Only one scan should be stored
    resp = client.get("/api/scans?device_id=DupDevice")
    data = resp.get_json()
    assert data["count"] == 1


def test_different_qr_content_not_duplicate(client):
    """Different QR content from the same device should both be accepted."""
    base = {
        "latitude": 40.0,
        "longitude": -74.0,
        "scan_time": "2026-02-07T10:00:00Z",
        "device_id": "DiffContentDevice",
    }
    resp1 = client.post("/api/scan", json={**base, "qr_content": "https://a.example.com"})
    assert resp1.status_code == 201

    resp2 = client.post("/api/scan", json={**base, "qr_content": "https://b.example.com"})
    assert resp2.status_code == 201


def test_scans_returned_in_chronological_order(client):
    """Scans should be listed newest-first by scan_time, regardless of insert order."""
    base = {
        "latitude": 40.0,
        "longitude": -74.0,
        "device_id": "OrderDevice",
    }
    # Insert older scan first
    resp1 = client.post("/api/scan", json={**base, "qr_content": "older", "scan_time": "2026-02-06T10:00:00Z"})
    assert resp1.status_code == 201

    # Insert newer scan second
    resp2 = client.post("/api/scan", json={**base, "qr_content": "newer", "scan_time": "2026-02-07T10:00:00Z"})
    assert resp2.status_code == 201

    # Insert middle scan last (out of order by insertion)
    resp3 = client.post("/api/scan", json={**base, "qr_content": "middle", "scan_time": "2026-02-06T18:00:00Z"})
    assert resp3.status_code == 201

    resp = client.get("/api/scans?device_id=OrderDevice")
    data = resp.get_json()
    assert data["count"] == 3
    # Should be ordered newest scan_time first
    assert data["scans"][0]["qr_content"] == "newer"
    assert data["scans"][1]["qr_content"] == "middle"
    assert data["scans"][2]["qr_content"] == "older"


def test_different_device_not_duplicate(client):
    """Same QR content from different devices should both be accepted."""
    base = {
        "qr_content": "https://shared.example.com",
        "latitude": 40.0,
        "longitude": -74.0,
        "scan_time": "2026-02-07T10:00:00Z",
    }
    resp1 = client.post("/api/scan", json={**base, "device_id": "DeviceA"})
    assert resp1.status_code == 201

    resp2 = client.post("/api/scan", json={**base, "device_id": "DeviceB"})
    assert resp2.status_code == 201
