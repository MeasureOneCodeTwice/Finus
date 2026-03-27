import os
import time
from datetime import datetime, timezone

from src import utils


class FakeTimestamp:
    def __init__(self, value: datetime):
        self.value = value

    def to_pydatetime(self) -> datetime:
        return self.value


class TrackingTimestamp:
    def __init__(self, value: datetime):
        self.value = value
        self.calls = 0

    def to_pydatetime(self) -> datetime:
        self.calls += 1
        return self.value


class BadTimestamp:
    def __init__(self, value):
        self.value = value

    def to_pydatetime(self):
        return self.value


def test_is_number_and_to_float_helpers():
    assert utils.is_number(3.14) is True
    assert utils.is_number("3.14") is False
    assert utils.is_number(float("nan")) is False
    assert utils.to_float(12.3456789) == 12.345679
    assert utils.to_float("12") is None


def test_to_timestamp_handles_datetime_like_objects():
    timestamp = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    naive_timestamp = datetime(2024, 1, 1, 12, 0)
    assert utils.to_timestamp(timestamp) == int(timestamp.timestamp())
    assert utils.to_timestamp(naive_timestamp) == int(
        naive_timestamp.replace(tzinfo=timezone.utc).timestamp()
    )
    assert utils.to_timestamp(FakeTimestamp(timestamp)) == int(timestamp.timestamp())
    assert utils.to_timestamp(None) is None
    assert utils.to_timestamp("bad-value") is None


def test_to_timestamp_calls_to_pydatetime_once_and_normalizes_naive_values():
    naive_timestamp = datetime(2024, 1, 1, 12, 0)
    wrapped = TrackingTimestamp(naive_timestamp)

    assert utils.to_timestamp(wrapped) == int(
        naive_timestamp.replace(tzinfo=timezone.utc).timestamp()
    )
    assert wrapped.calls == 1


def test_to_timestamp_returns_none_when_to_pydatetime_is_not_a_datetime():
    assert utils.to_timestamp(BadTimestamp("not-a-datetime")) is None


def test_to_timestamp_preserves_timezone_aware_offsets():
    offset_timestamp = datetime.fromisoformat("2024-01-01T12:00:00+02:00")

    assert utils.to_timestamp(offset_timestamp) == int(offset_timestamp.timestamp())


def test_to_timestamp_treats_naive_datetimes_as_utc_even_when_local_tz_differs():
    original_tz = os.environ.get("TZ")
    try:
        os.environ["TZ"] = "America/Winnipeg"
        time.tzset()
        naive_timestamp = datetime(2024, 1, 1, 12, 0)

        assert utils.to_timestamp(naive_timestamp) == int(
            naive_timestamp.replace(tzinfo=timezone.utc).timestamp()
        )
    finally:
        if original_tz is None:
            os.environ.pop("TZ", None)
        else:
            os.environ["TZ"] = original_tz
        time.tzset()


def test_format_change_and_normalize_query():
    assert utils.format_change(11.0, 10.0) == (1.0, 10.0)
    assert utils.format_change(11.0, 0.0) == (11.0, None)
    assert utils.format_change(None, 10.0) == (None, None)
    assert utils.normalize_query("EUR/USD Inc.") == "eurusdinc"


def test_is_number_rejects_infinity_values():
    assert utils.is_number(float("inf")) is False
    assert utils.is_number(float("-inf")) is False


def test_format_change_returns_none_when_previous_missing():
    assert utils.format_change(11.0, None) == (None, None)


def test_format_change_handles_negative_moves():
    assert utils.format_change(9.0, 10.0) == (-1.0, -10.0)


def test_normalize_query_preserves_digits_while_removing_symbols():
    assert utils.normalize_query("BTC-USD 2024!") == "btcusd2024"


def test_format_change_applies_rounding_precision():
    assert utils.format_change(10.1234567, 9.7654321) == (0.358025, 3.6662)
