from unittest.mock import patch

from fastapi import HTTPException

from src import service


def test_fetch_quote_snapshot_uses_market_price_and_previous_close():
    chart_result = {
        "meta": {
            "regularMarketPrice": 151.23,
            "chartPreviousClose": 149.0,
        }
    }
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 151.23,
        "change": 2.23,
        "changePercent": 1.4966,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_handles_missing_meta_key():
    chart_result = {}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 150.5,
        "change": 1.5,
        "changePercent": 1.0067,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_requests_the_expected_chart_defaults():
    chart_result = {"meta": {"regularMarketPrice": 151.23, "chartPreviousClose": 149.0}}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result) as chart_mock, patch(
        "src.service.extract_chart_points", return_value=points
    ) as extract_mock:
        service.fetch_quote_snapshot("AAPL")

    chart_mock.assert_called_once_with("AAPL", "1mo", "1d")
    extract_mock.assert_called_once_with(chart_result)


def test_fetch_quote_snapshot_handles_missing_meta_key():
    chart_result = {}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 150.5,
        "change": 1.5,
        "changePercent": 1.0067,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_falls_back_to_chart_points_when_meta_missing():
    chart_result = {"meta": {}}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 150.5,
        "change": 1.5,
        "changePercent": 1.0067,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_falls_back_to_previous_close_meta():
    chart_result = {"meta": {"regularMarketPrice": 151.23, "previousClose": 150.0}}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 151.23,
        "change": 1.23,
        "changePercent": 0.82,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_falls_back_to_previous_point_without_meta_closes():
    chart_result = {"meta": {}}
    points = [
        {"timestamp": 1700000000, "price": 100.0},
        {"timestamp": 1700003600, "price": 110.0},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 110.0,
        "change": 10.0,
        "changePercent": 10.0,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_returns_none_change_with_single_point():
    chart_result = {"meta": {}}
    points = [{"timestamp": 1700003600, "price": 150.5}]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 150.5,
        "change": None,
        "changePercent": None,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_prefers_chart_previous_close_over_previous_close():
    chart_result = {
        "meta": {
            "regularMarketPrice": 151.23,
            "chartPreviousClose": 149.0,
            "previousClose": 140.0,
        }
    }
    points = [
        {"timestamp": 1700000000, "price": 140.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot["change"] == 2.23
    assert snapshot["changePercent"] == 1.4966


def test_fetch_quote_snapshot_falls_back_when_meta_values_are_not_numeric():
    chart_result = {
        "meta": {
            "regularMarketPrice": "bad",
            "chartPreviousClose": "bad",
            "previousClose": "bad",
        }
    }
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 150.5,
        "change": 1.5,
        "changePercent": 1.0067,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_preserves_zero_market_price_and_previous_close():
    chart_result = {
        "meta": {
            "regularMarketPrice": 0.0,
            "chartPreviousClose": 0.0,
        }
    }
    points = [
        {"timestamp": 1700000000, "price": 10.0},
        {"timestamp": 1700003600, "price": 12.0},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 0.0,
        "change": 0.0,
        "changePercent": None,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_uses_last_point_timestamp_and_price_fallback():
    chart_result = {"meta": {}}
    points = [
        {"timestamp": 1700000000, "price": 100.0},
        {"timestamp": 1700003600, "price": 110.0},
        {"timestamp": 1700007200, "price": 120.0},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot["price"] == 120.0
    assert snapshot["timestamp"] == 1700007200
    assert snapshot["change"] == 10.0
    assert snapshot["changePercent"] == 9.0909


def test_build_history_returns_points_and_source():
    chart_result = {"meta": {"symbol": "AAPL"}}
    points = [{"timestamp": 1700000000, "price": 123.45}]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result) as chart_mock, patch(
        "src.service.extract_chart_points", return_value=points
    ) as extract_mock:
        assert service.build_history("AAPL", "1mo", "1d") == (points, "yahoo")
    chart_mock.assert_called_once_with("AAPL", "1mo", "1d")
    extract_mock.assert_called_once_with(chart_result)


def test_enrich_search_results_skips_items_that_raise_http_exceptions():
    with patch(
        "src.service.fetch_quote_snapshot",
        side_effect=[
            {
                "symbol": "AAPL",
                "price": 100.0,
                "change": 1.0,
                "changePercent": 1.0,
                "timestamp": 1700000000,
                "source": "yahoo",
            },
            HTTPException(status_code=404, detail="missing"),
        ],
    ):
        enriched = service.enrich_search_results(
            [
                {"symbol": "AAPL", "name": "Apple"},
                {"symbol": "MISS", "name": "Missing"},
            ]
        )

    assert enriched == [
        {
            "symbol": "AAPL",
            "name": "Apple",
            "price": 100.0,
            "change": 1.0,
            "changePercent": 1.0,
            "timestamp": 1700000000,
            "source": "yahoo",
        }
    ]


def test_enrich_search_results_preserves_existing_fields():
    with patch(
        "src.service.fetch_quote_snapshot",
        return_value={
            "symbol": "AAPL",
            "price": 100.0,
            "change": 1.0,
            "changePercent": 1.0,
            "timestamp": 1700000000,
            "source": "yahoo",
        },
    ):
        enriched = service.enrich_search_results(
            [
                {
                    "symbol": "AAPL",
                    "name": "Apple",
                    "type": "stock",
                    "currency": "USD",
                }
            ]
        )

    assert enriched == [
        {
            "symbol": "AAPL",
            "name": "Apple",
            "type": "stock",
            "currency": "USD",
            "price": 100.0,
            "change": 1.0,
            "changePercent": 1.0,
            "timestamp": 1700000000,
            "source": "yahoo",
        }
    ]


def test_enrich_search_results_returns_empty_for_empty_input():
    with patch("src.service.fetch_quote_snapshot") as snapshot_mock:
        enriched = service.enrich_search_results([])

    assert enriched == []
    snapshot_mock.assert_not_called()


def test_enrich_search_results_propagates_non_http_exceptions():
    with patch(
        "src.service.fetch_quote_snapshot",
        side_effect=RuntimeError("boom"),
    ):
        try:
            service.enrich_search_results([{"symbol": "AAPL"}])
        except RuntimeError as exc:
            assert str(exc) == "boom"
        else:
            raise AssertionError("Expected RuntimeError to propagate")


def test_enrich_search_results_calls_snapshot_for_each_symbol_in_order():
    with patch(
        "src.service.fetch_quote_snapshot",
        side_effect=[
            {
                "symbol": "AAPL",
                "price": 1.0,
                "change": 0.1,
                "changePercent": 10.0,
                "timestamp": 1,
                "source": "yahoo",
            },
            {
                "symbol": "MSFT",
                "price": 2.0,
                "change": 0.2,
                "changePercent": 11.0,
                "timestamp": 2,
                "source": "yahoo",
            },
        ],
    ) as snapshot_mock:
        enriched = service.enrich_search_results(
            [
                {"symbol": "AAPL", "name": "Apple"},
                {"symbol": "MSFT", "name": "Microsoft"},
            ]
        )

    assert [item["symbol"] for item in enriched] == ["AAPL", "MSFT"]
    assert [call.args[0] for call in snapshot_mock.call_args_list] == ["AAPL", "MSFT"]


def test_enrich_search_results_skips_failed_item_and_continues_afterward():
    with patch(
        "src.service.fetch_quote_snapshot",
        side_effect=[
            HTTPException(status_code=404, detail="missing"),
            {
                "symbol": "MSFT",
                "price": 2.0,
                "change": 0.2,
                "changePercent": 11.0,
                "timestamp": 2,
                "source": "yahoo",
            },
        ],
    ):
        enriched = service.enrich_search_results(
            [
                {"symbol": "MISS", "name": "Missing"},
                {"symbol": "MSFT", "name": "Microsoft"},
            ]
        )

    assert enriched == [
        {
            "symbol": "MSFT",
            "name": "Microsoft",
            "price": 2.0,
            "change": 0.2,
            "changePercent": 11.0,
            "timestamp": 2,
            "source": "yahoo",
        }
    ]
