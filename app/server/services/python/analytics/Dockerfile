FROM python:3.11-slim

WORKDIR /app/server/services/python/analytics

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
pip install -r requirements.txt

COPY . .
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0"]
