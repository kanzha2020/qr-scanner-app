"""
MLflow Experiment Tracking for QR Scanner Server
==================================================
Provides helpers to log scan metrics and parameters to MLflow.

Configuration (environment variables):
    MLFLOW_TRACKING_URI  – MLflow tracking server URL (default: mlruns local directory)
    MLFLOW_EXPERIMENT    – Experiment name (default: "qr-scanner")
    ENABLE_MLFLOW        – Set to "true" to enable tracking (default: "false")
"""

import logging
import os

logger = logging.getLogger(__name__)

ENABLE_MLFLOW = os.environ.get("ENABLE_MLFLOW", "false").lower() == "true"

_mlflow = None
_experiment_name = os.environ.get("MLFLOW_EXPERIMENT", "qr-scanner")


def _get_mlflow():
    """Lazy-import mlflow so the server can start even if mlflow is not installed."""
    global _mlflow
    if _mlflow is None:
        try:
            import mlflow

            tracking_uri = os.environ.get("MLFLOW_TRACKING_URI", "mlruns")
            mlflow.set_tracking_uri(tracking_uri)
            mlflow.set_experiment(_experiment_name)
            _mlflow = mlflow
            logger.info(
                "MLflow tracking enabled (uri=%s, experiment=%s)",
                tracking_uri,
                _experiment_name,
            )
        except ImportError:
            logger.warning("mlflow package not installed; tracking disabled")
            raise
    return _mlflow


def log_scan(scan_id: int, qr_content: str, latitude: float, longitude: float,
             device_id: str, scan_time: str) -> None:
    """Log a successful scan event as an MLflow run."""
    if not ENABLE_MLFLOW:
        return
    try:
        mlflow = _get_mlflow()
        with mlflow.start_run(run_name=f"scan-{scan_id}"):
            mlflow.log_param("qr_content", qr_content[:250])
            mlflow.log_param("device_id", device_id)
            mlflow.log_param("scan_time", scan_time)
            mlflow.log_metric("latitude", latitude)
            mlflow.log_metric("longitude", longitude)
            mlflow.log_metric("scan_id", scan_id)
    except Exception:
        logger.exception("Failed to log scan to MLflow")


def log_api_metric(endpoint: str, status_code: int) -> None:
    """Log an API call metric to MLflow."""
    if not ENABLE_MLFLOW:
        return
    try:
        mlflow = _get_mlflow()
        with mlflow.start_run(run_name=f"api-{endpoint}"):
            mlflow.log_param("endpoint", endpoint)
            mlflow.log_metric("status_code", status_code)
    except Exception:
        logger.exception("Failed to log API metric to MLflow")
