FROM python:3.11-slim

#cache pip packages
RUN --mount=type=cache,target=/root/.cache

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0"]
