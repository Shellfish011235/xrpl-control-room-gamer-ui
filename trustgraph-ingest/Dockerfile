FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir httpx websockets

COPY ingest_worker.py .
CMD ["python", "ingest_worker.py"]
