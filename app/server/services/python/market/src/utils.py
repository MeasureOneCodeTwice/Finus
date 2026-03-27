import math
from datetime import datetime, timezone


def is_number(value) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


def to_float(value) -> float | None:
    if is_number(value):
        return round(float(value), 6)
    return None


def to_timestamp(value) -> int | None:
    if value is None:
        return None

    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()

    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return int(value.timestamp())

    return None


def format_change(
    current: float | None, previous: float | None
) -> tuple[float | None, float | None]:
    if current is None or previous is None:
        return None, None

    change = round(current - previous, 6)
    if previous == 0:
        return change, None

    change_percent = round((change / previous) * 100, 4)
    return change, change_percent


def normalize_query(value: str) -> str:
    return "".join(char.lower() for char in value if char.isalnum())

