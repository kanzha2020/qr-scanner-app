"""
QR Scanner Cloud Server
========================
Receives scan data (QR content, geolocation, timestamp) from the Android app
and stores it in a SQLite database.

Usage:
    pip install -r requirements.txt
    python server.py

API Endpoints:
    POST /api/scan        - Upload a new scan
    GET  /api/scans       - List all scans (with optional filters)
    GET  /api/scan/<id>   - Get a specific scan
    GET  /api/health      - Health check
    GET  /api/export/csv  - Export all scans as CSV
"""

import csv
import io
import sqlite3
import os
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# ─── Database Setup ───────────────────────────────────────────

DB_PATH = os.environ.get("DB_PATH", "qr_scans.db")


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_content TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            scan_time TEXT NOT NULL,
            device_id TEXT,
            received_at TEXT NOT NULL,
            ip_address TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_scan_time ON scans(scan_time)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_device_id ON scans(device_id)
    """)
    conn.commit()
    conn.close()
    print(f"[✓] Database initialized at {DB_PATH}")


# ─── API Endpoints ────────────────────────────────────────────

@app.route("/api/scan", methods=["POST"])
def upload_scan():
    """
    Receive a QR scan from the Android app.

    Expected JSON body:
    {
        "qr_content": "https://example.com",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "scan_time": "2026-02-06T14:30:00Z",
        "device_id": "XCover7Pro_abc123"
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"status": "error", "message": "No JSON body provided"}), 400

    # Validate required fields
    required = ["qr_content", "latitude", "longitude", "scan_time"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({
            "status": "error",
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400

    # Store in database
    conn = get_db()
    cursor = conn.execute(
        """
        INSERT INTO scans (qr_content, latitude, longitude, scan_time, device_id, received_at, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["qr_content"],
            float(data["latitude"]),
            float(data["longitude"]),
            data["scan_time"],
            data.get("device_id", "unknown"),
            datetime.utcnow().isoformat() + "Z",
            request.remote_addr,
        ),
    )
    conn.commit()
    scan_id = cursor.lastrowid
    conn.close()

    print(f"[+] Scan #{scan_id}: {data['qr_content']} @ ({data['latitude']}, {data['longitude']})")

    return jsonify({
        "status": "success",
        "message": "Scan recorded",
        "id": scan_id,
    }), 201


@app.route("/api/scans", methods=["GET"])
def list_scans():
    """
    List all scans with optional query parameters:
    - device_id: Filter by device
    - limit: Max results (default 100)
    - offset: Pagination offset
    """
    device_id = request.args.get("device_id")
    limit = request.args.get("limit", 100, type=int)
    offset = request.args.get("offset", 0, type=int)

    conn = get_db()

    if device_id:
        rows = conn.execute(
            "SELECT * FROM scans WHERE device_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
            (device_id, limit, offset),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM scans ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()

    conn.close()

    scans = [dict(row) for row in rows]
    return jsonify({"status": "success", "count": len(scans), "scans": scans})


@app.route("/api/scan/<int:scan_id>", methods=["GET"])
def get_scan(scan_id):
    """Get a specific scan by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    conn.close()

    if row is None:
        return jsonify({"status": "error", "message": "Scan not found"}), 404

    return jsonify({"status": "success", "scan": dict(row)})


@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    """Export all scans as a CSV file."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM scans ORDER BY id DESC").fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "qr_content", "latitude", "longitude", "scan_time", "device_id", "received_at", "ip_address"])
    for row in rows:
        writer.writerow([row["id"], row["qr_content"], row["latitude"], row["longitude"],
                         row["scan_time"], row["device_id"], row["received_at"], row["ip_address"]])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=qr_scans.csv"},
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
    conn.close()
    return jsonify({"status": "ok", "total_scans": count, "timestamp": datetime.utcnow().isoformat() + "Z"})


@app.route("/", methods=["GET"])
def index():
    """Simple landing page."""
    return """
    <html>
    <head><title>QR Scanner Server</title></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto;">
        <h1>📱 QR Scanner Server</h1>
        <p>Server is running. API endpoints:</p>
        <ul>
            <li><code>POST /api/scan</code> – Upload scan data</li>
            <li><code>GET /api/scans</code> – List all scans</li>
            <li><code>GET /api/scan/&lt;id&gt;</code> – Get specific scan</li>
            <li><code>GET /api/export/csv</code> – Export as CSV</li>
            <li><code>GET /api/health</code> – Health check</li>
        </ul>
    </body>
    </html>
    """


# ─── Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"[✓] QR Scanner server starting on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
