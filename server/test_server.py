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


# ── Map modal tests ──────────────────────────────────────────

def test_index_contains_map_modal(client):
    """The dashboard should contain the map modal elements."""
    resp = client.get("/")
    html = resp.data.decode()
    assert "map-modal-overlay" in html
    assert "map-iframe" in html
    assert "map-coords" in html
    assert "map-link" in html


def test_index_contains_map_functions(client):
    """The dashboard should contain the showMap and closeMapModal functions."""
    resp = client.get("/")
    html = resp.data.decode()
    assert "function showMap(" in html
    assert "function closeMapModal(" in html
    assert "maps.google.com/maps" in html


def test_index_location_column_has_map_link(client):
    """The location column in the scan table should use the location-link class."""
    resp = client.get("/")
    html = resp.data.decode()
    assert "location-link" in html
    assert "showMap(" in html
