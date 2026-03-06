FROM python:3.11-slim

#cache pip packages
RUN --mount=type=cache,target=/root/.cache

WORKDIR /app/server/services/python/analytics

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
pip install -r requirements.txt

COPY . .
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0"]
