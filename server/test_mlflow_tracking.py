"""Tests for the MLflow experiment tracking integration."""

import os
import tempfile
from unittest.mock import patch, MagicMock

import pytest

# Point to a temporary database before importing the app
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.environ["DB_PATH"] = _db_path


@pytest.fixture(autouse=True)
def reset_mlflow_state():
    """Reset module-level state between tests."""
    import mlflow_tracking
    mlflow_tracking._mlflow = None
    original = mlflow_tracking.ENABLE_MLFLOW
    yield
    mlflow_tracking.ENABLE_MLFLOW = original
    mlflow_tracking._mlflow = None


# ── Unit tests for mlflow_tracking module ────────────────────


def test_log_scan_disabled_by_default():
    """log_scan should be a no-op when ENABLE_MLFLOW is false."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = False
    # Should not raise even with invalid arguments
    mlflow_tracking.log_scan(
        scan_id=1, qr_content="test", latitude=0.0,
        longitude=0.0, device_id="dev", scan_time="2026-01-01T00:00:00Z",
    )


def test_log_api_metric_disabled_by_default():
    """log_api_metric should be a no-op when ENABLE_MLFLOW is false."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = False
    mlflow_tracking.log_api_metric(endpoint="/api/scan", status_code=201)


def test_log_scan_calls_mlflow_when_enabled():
    """log_scan should call mlflow.start_run and log params/metrics when enabled."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = True

    mock_mlflow = MagicMock()
    mock_run_context = MagicMock()
    mock_mlflow.start_run.return_value.__enter__ = MagicMock(return_value=mock_run_context)
    mock_mlflow.start_run.return_value.__exit__ = MagicMock(return_value=False)

    with patch.object(mlflow_tracking, "_get_mlflow", return_value=mock_mlflow):
        mlflow_tracking.log_scan(
            scan_id=42,
            qr_content="https://example.com",
            latitude=37.77,
            longitude=-122.42,
            device_id="TestDevice",
            scan_time="2026-02-06T14:30:00Z",
        )

    mock_mlflow.start_run.assert_called_once_with(run_name="scan-42")
    mock_mlflow.log_param.assert_any_call("qr_content", "https://example.com")
    mock_mlflow.log_param.assert_any_call("device_id", "TestDevice")
    mock_mlflow.log_param.assert_any_call("scan_time", "2026-02-06T14:30:00Z")
    mock_mlflow.log_metric.assert_any_call("latitude", 37.77)
    mock_mlflow.log_metric.assert_any_call("longitude", -122.42)
    mock_mlflow.log_metric.assert_any_call("scan_id", 42)


def test_log_api_metric_calls_mlflow_when_enabled():
    """log_api_metric should call mlflow when enabled."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = True

    mock_mlflow = MagicMock()
    mock_mlflow.start_run.return_value.__enter__ = MagicMock()
    mock_mlflow.start_run.return_value.__exit__ = MagicMock(return_value=False)

    with patch.object(mlflow_tracking, "_get_mlflow", return_value=mock_mlflow):
        mlflow_tracking.log_api_metric(endpoint="/api/scan", status_code=201)

    mock_mlflow.start_run.assert_called_once_with(run_name="api-/api/scan")
    mock_mlflow.log_param.assert_any_call("endpoint", "/api/scan")
    mock_mlflow.log_metric.assert_any_call("status_code", 201)


def test_log_scan_handles_mlflow_exception_gracefully():
    """log_scan should not raise even when mlflow raises an exception."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = True

    with patch.object(mlflow_tracking, "_get_mlflow", side_effect=RuntimeError("connection refused")):
        # Should not raise
        mlflow_tracking.log_scan(
            scan_id=1, qr_content="test", latitude=0.0,
            longitude=0.0, device_id="dev", scan_time="2026-01-01T00:00:00Z",
        )


def test_log_scan_truncates_long_qr_content():
    """log_scan should truncate qr_content to 250 chars for MLflow param limits."""
    import mlflow_tracking
    mlflow_tracking.ENABLE_MLFLOW = True

    mock_mlflow = MagicMock()
    mock_mlflow.start_run.return_value.__enter__ = MagicMock()
    mock_mlflow.start_run.return_value.__exit__ = MagicMock(return_value=False)

    long_content = "x" * 500

    with patch.object(mlflow_tracking, "_get_mlflow", return_value=mock_mlflow):
        mlflow_tracking.log_scan(
            scan_id=1, qr_content=long_content, latitude=0.0,
            longitude=0.0, device_id="dev", scan_time="2026-01-01T00:00:00Z",
        )

    # qr_content param should be truncated to 250 chars
    mock_mlflow.log_param.assert_any_call("qr_content", "x" * 250)


# ── Integration: server calls log_scan on POST /api/scan ─────


def test_server_calls_log_scan_on_post(setup_and_client):
    """POST /api/scan should invoke log_scan."""
    client = setup_and_client
    payload = {
        "qr_content": "https://mlflow-test.example.com",
        "latitude": 51.50,
        "longitude": -0.12,
        "scan_time": "2026-03-01T12:00:00Z",
        "device_id": "MLflowTestDevice",
    }

    with patch("server.log_scan") as mock_log:
        resp = client.post("/api/scan", json=payload)
        assert resp.status_code == 201
        mock_log.assert_called_once()
        call_kwargs = mock_log.call_args
        assert call_kwargs[1]["qr_content"] == "https://mlflow-test.example.com"
        assert call_kwargs[1]["scan_id"] >= 1


@pytest.fixture()
def setup_and_client():
    from server import app, init_db
    # Use a dedicated temp DB for the integration test to avoid cross-test
    # interference with test_server.py which shares the module-level DB_PATH.
    import server
    fd, path = tempfile.mkstemp(suffix=".db")
    original_db = server.DB_PATH
    server.DB_PATH = path
    init_db()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c
    server.DB_PATH = original_db
    os.close(fd)
    os.unlink(path)
