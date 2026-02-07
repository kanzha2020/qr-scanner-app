# QR Scanner App

A multi-platform QR code scanner with a cloud backend. The Android app captures QR codes along with GPS location and timestamps, and uploads them to a Python Flask server. A built-in web dashboard lets you view, search, and export all scanned data.

## Prerequisites

- **Python 3.10+** (for running the server locally)
- **pip** (Python package manager)
- **Docker & Docker Compose** (optional, for containerised deployment)
- **Android Studio** (optional, for building the Android app)

## How to Set Up Environment

1. **Install Miniforge** — Download and install [Miniforge](https://github.com/conda-forge/miniforge) for your operating system.

2. **Create a virtual environment** with Python 3.12:

   ```bash
   conda create -n qr-scanner python=3.12 -y
   ```

3. **Activate the environment:**

   ```bash
   conda activate qr-scanner
   ```

4. **Install project dependencies:**

   ```bash
   cd server
   pip install -r requirements.txt
   ```

## Launching the Server

### Option 1 — Run locally

```bash
cd server
pip install -r requirements.txt
python server.py
```

The server starts on **http://localhost:5000**.

### Option 2 — Run with Docker Compose

```bash
docker-compose up
```

This builds the server image and starts it on **http://localhost:5000**. Scan data is persisted in a Docker volume.

### Option 3 — Production with Gunicorn

```bash
cd server
pip install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

You can customise the port and database path with environment variables:

```bash
DB_PATH=/var/data/qr_scans.db gunicorn -w 4 -b 0.0.0.0:8080 server:app
```

## Launching the Front-End Webpage

The web dashboard is served directly by the Flask server. Once the server is running (see above), open your browser and navigate to:

```
http://localhost:5000
```

No separate build step is required — the dashboard is a single-page HTML template rendered by the server.

## Android App

See [`android/README.md`](android/README.md) for setup instructions. In short:

1. Open the `android/` folder in **Android Studio**.
2. Update the server URL in `app/src/main/java/com/qrscanner/app/ApiService.kt` to point to your server.
3. Sync Gradle and run the app on your device.

## API Reference

| Method | Endpoint | Description |
|--------|-------------------|--------------------------|
| POST | `/api/scan` | Upload a new scan |
| GET | `/api/scans` | List scans (paginated) |
| GET | `/api/scan/<id>` | Get a scan by ID |
| GET | `/api/export/csv` | Download all scans as CSV |
| GET | `/api/health` | Health check |

## Project Structure

```
qr-scanner-app/
├── server/          # Python Flask server & web dashboard
│   ├── server.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── templates/
│       └── index.html
├── android/         # Android app (Kotlin)
├── docker-compose.yml
└── README.md
```