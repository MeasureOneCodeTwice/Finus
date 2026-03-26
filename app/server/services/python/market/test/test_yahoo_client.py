from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src import yahoo_client


def build_response(payload):
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    return response


def test_fetch_yahoo_chart_returns_first_result():
    payload = {"chart": {"result": [{"meta": {"symbol": "AAPL"}}], "error": None}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        result = yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert result == {"meta": {"symbol": "AAPL"}}
    mock_get.assert_called_once_with(
        yahoo_client.YAHOO_CHART_URL.format(symbol="AAPL"),
        params={
            "range": "1mo",
            "interval": "1d",
            "includePrePost": "false",
            "events": "div,splits",
        },
        headers=yahoo_client.REQUEST_HEADERS,
        timeout=8,
    )


def test_fetch_yahoo_chart_handles_request_and_json_errors():
    with patch("src.yahoo_client.requests.get", side_effect=ValueError("bad json")):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Unable to reach Yahoo market data."

    with patch(
        "src.yahoo_client.requests.get",
        side_effect=yahoo_client.requests.RequestException("network"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Unable to reach Yahoo market data."


def test_fetch_yahoo_chart_handles_raise_for_status_errors():
    response = MagicMock()
    response.raise_for_status.side_effect = yahoo_client.requests.RequestException("bad status")

    with patch("src.yahoo_client.requests.get", return_value=response):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Unable to reach Yahoo market data."


def test_fetch_yahoo_chart_prefers_first_result_when_multiple_exist():
    payload = {
        "chart": {
            "result": [{"meta": {"symbol": "FIRST"}}, {"meta": {"symbol": "SECOND"}}],
            "error": None,
        }
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        result = yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert result == {"meta": {"symbol": "FIRST"}}


def test_fetch_yahoo_chart_quotes_symbols_with_reserved_characters():
    payload = {"chart": {"result": [{"meta": {"symbol": "EUR/USD"}}], "error": None}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        yahoo_client.fetch_yahoo_chart("EUR/USD", "1mo", "1d")

    assert mock_get.call_args.args[0].endswith("/EUR%2FUSD")

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        yahoo_client.fetch_yahoo_chart("EURUSD=X", "1mo", "1d")

    assert mock_get.call_args.args[0].endswith("/EURUSD=X")

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        yahoo_client.fetch_yahoo_chart("^GSPC.-", "1mo", "1d")

    assert mock_get.call_args.args[0].endswith("/^GSPC.-")


def test_fetch_yahoo_chart_handles_yahoo_error_payload():
    payload = {"chart": {"result": None, "error": {"description": "missing"}}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "missing"


def test_fetch_yahoo_chart_uses_default_message_when_description_missing():
    payload = {"chart": {"result": None, "error": {"description": None}}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Yahoo market data not found for symbol."


def test_fetch_yahoo_chart_handles_missing_results():
    payload = {"chart": {"result": [], "error": None}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Yahoo market data not found for symbol."


def test_fetch_yahoo_chart_handles_missing_chart_payload():
    with patch("src.yahoo_client.requests.get", return_value=build_response({})):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Yahoo market data not found for symbol."


def test_fetch_yahoo_chart_handles_chart_none_payload():
    with patch("src.yahoo_client.requests.get", return_value=build_response({"chart": None})):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Yahoo market data not found for symbol."


def test_extract_chart_points_success_and_failures():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1700000000, 1700003600],
            "indicators": {"quote": [{"close": [123.45, 124.0]}]},
        }
    )
    assert result == [
        {"timestamp": 1700000000, "price": 123.45},
        {"timestamp": 1700003600, "price": 124.0},
    ]

    with pytest.raises(HTTPException):
        yahoo_client.extract_chart_points({"indicators": {}})

    with pytest.raises(HTTPException):
        yahoo_client.extract_chart_points(
            {"timestamp": [1], "indicators": {"quote": [{"close": [None]}]}}
        )

    with pytest.raises(HTTPException):
        yahoo_client.extract_chart_points(
            {"timestamp": [1], "indicators": {"quote": [{"open": [10.0]}]}}
        )


def test_extract_chart_points_uses_only_the_first_quote_entry():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points(
            {
                "timestamp": [1],
                "indicators": {
                    "quote": [
                        {"close": [None]},
                        {"close": [123.45]},
                    ]
                },
            }
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_extract_chart_points_handles_first_quote_none():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points(
            {
                "timestamp": [1],
                "indicators": {"quote": [None]},
            }
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_extract_chart_points_preserves_zero_price_points():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1, 2],
            "indicators": {"quote": [{"close": [0.0, 1.5]}]},
        }
    )

    assert result == [
        {"timestamp": 1, "price": 0.0},
        {"timestamp": 2, "price": 1.5},
    ]


def test_extract_chart_points_skips_non_numeric_values():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1, 2, 3],
            "indicators": {"quote": [{"close": [10.0, "bad", 12.0]}]},
        }
    )

    assert result == [
        {"timestamp": 1, "price": 10.0},
        {"timestamp": 3, "price": 12.0},
    ]


def test_extract_chart_points_skips_invalid_prices_but_keeps_valid_points():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1700000000, 1700003600, 1700007200],
            "indicators": {"quote": [{"close": [123.45, None, 124.0]}]},
        }
    )

    assert result == [
        {"timestamp": 1700000000, "price": 123.45},
        {"timestamp": 1700007200, "price": 124.0},
    ]


def test_extract_chart_points_casts_timestamps_to_ints():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": ["1700000000"],
            "indicators": {"quote": [{"close": [123.45]}]},
        }
    )

    assert result == [{"timestamp": 1700000000, "price": 123.45}]


def test_extract_chart_points_handles_missing_timestamps():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points(
            {"indicators": {"quote": [{"close": [123.45]}]}}
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_extract_chart_points_handles_missing_indicators():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points({"timestamp": [1]})

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_extract_chart_points_truncates_to_shortest_series():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1, 2, 3],
            "indicators": {"quote": [{"close": [10.0, 11.0]}]},
        }
    )

    assert result == [
        {"timestamp": 1, "price": 10.0},
        {"timestamp": 2, "price": 11.0},
    ]


def test_extract_chart_points_raises_when_quote_list_is_empty():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points(
            {"timestamp": [1], "indicators": {"quote": []}}
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_extract_chart_points_raises_when_all_numeric_points_are_filtered_out():
    with pytest.raises(HTTPException) as exc_info:
        yahoo_client.extract_chart_points(
            {
                "timestamp": [1, 2],
                "indicators": {"quote": [{"close": ["bad", None]}]},
            }
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Historical data not found for symbol."


def test_search_catalog_helpers_cover_empty_and_filtered_paths():
    assert len(yahoo_client.search_forex_catalog("", 2)) == 2
    assert yahoo_client.search_forex_catalog("euro", 5)[0]["symbol"] == "EURUSD=X"
    assert len(yahoo_client.search_stock_catalog("", 2)) == 2
    assert yahoo_client.search_stock_catalog("tesla", 5)[0]["symbol"] == "TSLA"


def test_search_catalog_helpers_honor_limit_for_matching_results():
    assert yahoo_client.search_forex_catalog("usd", 1) == [yahoo_client.FOREX_CATALOG[0]]
    assert yahoo_client.search_stock_catalog("inc", 2) == [
        yahoo_client.FEATURED_STOCKS[0],
        yahoo_client.FEATURED_STOCKS[3],
    ]


def test_search_catalog_helpers_return_empty_for_unknown_queries():
    assert yahoo_client.search_forex_catalog("zzzz", 5) == []
    assert yahoo_client.search_stock_catalog("zzzz", 5) == []


def test_yahoo_search_filters_deduplicates_and_falls_back_on_error():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Duplicate",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
            {
                "quoteType": "MUTUALFUND",
                "symbol": "SKIP",
            },
            {
                "quoteType": "EQUITY",
                "symbol": None,
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        },
        {
            "symbol": "EURUSD=X",
            "displaySymbol": "EURUSD",
            "name": "Euro FX",
            "type": "forex",
            "currency": "USD",
            "exchange": "CCY",
        },
    ]

    with patch("src.yahoo_client.requests.get", side_effect=RuntimeError("boom")):
        with pytest.raises(RuntimeError):
            yahoo_client.yahoo_search("apple", 10)

    with patch(
        "src.yahoo_client.requests.get",
        side_effect=yahoo_client.requests.RequestException("network"),
    ):
        assert yahoo_client.yahoo_search("apple", 10) == []

    with patch("src.yahoo_client.requests.get", side_effect=ValueError("bad json")):
        assert yahoo_client.yahoo_search("apple", 10) == []


def test_yahoo_search_skips_quotes_without_symbols_or_supported_types():
    payload = {
        "quotes": [
            {"quoteType": "EQUITY", "symbol": None},
            {"quoteType": "MUTUALFUND", "symbol": "SKIP"},
            {"quoteType": None, "symbol": "ALSO_SKIP"},
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == []


def test_yahoo_search_continues_after_missing_symbol_and_unsupported_type():
    payload = {
        "quotes": [
            {"quoteType": "EQUITY", "symbol": None},
            {"quoteType": "MUTUALFUND", "symbol": "SKIP"},
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("mixed", 10)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        },
        {
            "symbol": "EURUSD=X",
            "displaySymbol": "EURUSD",
            "name": "Euro FX",
            "type": "forex",
            "currency": "USD",
            "exchange": "CCY",
        },
    ]


def test_yahoo_search_returns_empty_when_quotes_key_is_missing():
    with patch("src.yahoo_client.requests.get", return_value=build_response({})):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == []


def test_yahoo_search_returns_empty_when_quotes_is_none():
    with patch(
        "src.yahoo_client.requests.get",
        return_value=build_response({"quotes": None}),
    ):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == []


def test_yahoo_search_uses_expected_request_shape():
    payload = {"quotes": []}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        results = yahoo_client.yahoo_search("apple", 3)

    assert results == []
    mock_get.assert_called_once_with(
        yahoo_client.YAHOO_SEARCH_URL,
        params={"q": "apple", "quotesCount": 6, "newsCount": 0},
        headers=yahoo_client.REQUEST_HEADERS,
        timeout=6,
    )


def test_yahoo_search_uses_shortname_when_longname_missing():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "shortname": "Apple Short",
                "currency": "USD",
                "exchange": "NMS",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Short",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        }
    ]


def test_yahoo_search_skips_empty_string_symbol():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "",
                "longname": "Empty",
                "currency": "USD",
                "exchange": "NMS",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("empty", 10)

    assert results == []


def test_yahoo_search_uses_symbol_when_names_are_missing_for_forex():
    payload = {
        "quotes": [
            {
                "quoteType": "CURRENCY",
                "symbol": "USDJPY=X",
                "currency": "JPY",
                "exchange": "CCY",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("yen", 10)

    assert results == [
        {
            "symbol": "USDJPY=X",
            "displaySymbol": "USDJPY",
            "name": "USDJPY=X",
            "type": "forex",
            "currency": "JPY",
            "exchange": "CCY",
        }
    ]


def test_yahoo_search_formats_forex_display_symbol_and_preserves_exchange_none():
    payload = {
        "quotes": [
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "",
                "exchange": None,
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("eur", 10)

    assert results == [
        {
            "symbol": "EURUSD=X",
            "displaySymbol": "EURUSD",
            "name": "Euro FX",
            "type": "forex",
            "currency": "USD",
            "exchange": None,
        }
    ]


def test_yahoo_search_prefers_longname_over_shortname():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Long",
                "shortname": "Apple Short",
                "currency": "USD",
                "exchange": "NMS",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results[0]["name"] == "Apple Long"


def test_yahoo_search_keeps_equity_display_symbol_even_when_symbol_ends_with_x():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "ABC=X",
                "longname": "Equity With X",
                "currency": "USD",
                "exchange": "NMS",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("abc", 10)

    assert results == [
        {
            "symbol": "ABC=X",
            "displaySymbol": "ABC=X",
            "name": "Equity With X",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        }
    ]


def test_yahoo_search_deduplicates_before_applying_limit():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Duplicate",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "EQUITY",
                "symbol": "MSFT",
                "longname": "Microsoft Corporation",
                "currency": "USD",
                "exchange": "NMS",
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("tech", 2)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        },
        {
            "symbol": "MSFT",
            "displaySymbol": "MSFT",
            "name": "Microsoft Corporation",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        },
    ]


def test_yahoo_search_preserves_result_order_across_supported_types():
    payload = {
        "quotes": [
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("mixed", 10)

    assert [item["symbol"] for item in results] == ["EURUSD=X", "AAPL"]


def test_yahoo_search_stops_when_limit_is_reached():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("a", 1)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        }
    ]


def test_yahoo_search_falls_back_to_symbol_name_and_usd_currency():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "BRK-B",
                "exchange": "NYQ",
            }
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("berkshire", 10)

    assert results == [
        {
            "symbol": "BRK-B",
            "displaySymbol": "BRK-B",
            "name": "BRK-B",
            "type": "stock",
            "currency": "USD",
            "exchange": "NYQ",
        }
    ]
