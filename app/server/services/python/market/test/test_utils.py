from datetime import datetime, timezone

from src import utils


class FakeTimestamp:
    def __init__(self, value: datetime):
        self.value = value

    def to_pydatetime(self) -> datetime:
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


def test_format_change_and_normalize_query():
    assert utils.format_change(11.0, 10.0) == (1.0, 10.0)
    assert utils.format_change(11.0, 0.0) == (11.0, None)
    assert utils.format_change(None, 10.0) == (None, None)
    assert utils.normalize_query("EUR/USD Inc.") == "eurusdinc"
