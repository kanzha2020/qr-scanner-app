# QR Scanner Server

A lightweight Python Flask server that receives and stores QR scan data from the Android app.

## Quick Start

```bash
pip install -r requirements.txt
python server.py
```

Server starts on `http://0.0.0.0:5000`

## Production Deployment

For production, use Gunicorn behind Nginx with HTTPS:

```bash
# Run with Gunicorn (4 workers)
gunicorn -w 4 -b 0.0.0.0:5000 server:app

# Or use environment variables
PORT=8080 DB_PATH=/var/data/scans.db gunicorn -w 4 server:app
```

### Nginx Example Config

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## API Reference

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/scan         | Upload a new scan        |
| GET    | /api/scans        | List scans (paginated)   |
| GET    | /api/scan/<id>    | Get scan by ID           |
| GET    | /api/export/csv   | Download all scans as CSV|
| GET    | /api/health       | Health check             |

## Database

SQLite database is stored at `qr_scans.db` (configurable via `DB_PATH` env var).
For high-traffic production use, consider migrating to PostgreSQL.
