FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY templates/ templates/

# Store database in a volume-friendly location
ENV DB_PATH=/app/data/qr_scans.db
ENV PORT=5000

RUN mkdir -p /app/data

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "server:app"]
