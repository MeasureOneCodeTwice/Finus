YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_SYMBOL_SAFE_CHARS = "=^.-"
SUPPORTED_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"}
SUPPORTED_INTERVALS = {"5m", "15m", "1d", "1wk", "1mo"}
DEFAULT_SEARCH_LIMIT = 8
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    )
}

FEATURED_STOCKS = [
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
    {
        "symbol": "NVDA",
        "displaySymbol": "NVDA",
        "name": "NVIDIA Corporation",
        "type": "stock",
        "currency": "USD",
        "exchange": "NMS",
    },
    {
        "symbol": "AMZN",
        "displaySymbol": "AMZN",
        "name": "Amazon.com, Inc.",
        "type": "stock",
        "currency": "USD",
        "exchange": "NMS",
    },
    {
        "symbol": "GOOGL",
        "displaySymbol": "GOOGL",
        "name": "Alphabet Inc.",
        "type": "stock",
        "currency": "USD",
        "exchange": "NMS",
    },
    {
        "symbol": "TSLA",
        "displaySymbol": "TSLA",
        "name": "Tesla, Inc.",
        "type": "stock",
        "currency": "USD",
        "exchange": "NMS",
    },
]

FOREX_CATALOG = [
    {
        "symbol": "EURUSD=X",
        "displaySymbol": "EUR/USD",
        "name": "Euro to US Dollar",
        "type": "forex",
        "currency": "USD",
    },
    {
        "symbol": "GBPUSD=X",
        "displaySymbol": "GBP/USD",
        "name": "British Pound to US Dollar",
        "type": "forex",
        "currency": "USD",
    },
    {
        "symbol": "USDJPY=X",
        "displaySymbol": "USD/JPY",
        "name": "US Dollar to Japanese Yen",
        "type": "forex",
        "currency": "JPY",
    },
    {
        "symbol": "USDCAD=X",
        "displaySymbol": "USD/CAD",
        "name": "US Dollar to Canadian Dollar",
        "type": "forex",
        "currency": "CAD",
    },
    {
        "symbol": "AUDUSD=X",
        "displaySymbol": "AUD/USD",
        "name": "Australian Dollar to US Dollar",
        "type": "forex",
        "currency": "USD",
    },
    {
        "symbol": "NZDUSD=X",
        "displaySymbol": "NZD/USD",
        "name": "New Zealand Dollar to US Dollar",
        "type": "forex",
        "currency": "USD",
    },
    {
        "symbol": "USDCHF=X",
        "displaySymbol": "USD/CHF",
        "name": "US Dollar to Swiss Franc",
        "type": "forex",
        "currency": "CHF",
    },
    {
        "symbol": "EURGBP=X",
        "displaySymbol": "EUR/GBP",
        "name": "Euro to British Pound",
        "type": "forex",
        "currency": "GBP",
    },
]

