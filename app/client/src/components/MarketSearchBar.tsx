import React, { useEffect, useState } from "react";
// This component provides a search bar for stocks and forex markets. It fetches results from the backend as the user types, with debouncing to reduce API calls.
export interface MarketSearchResult {
  symbol: string;
  displaySymbol: string;
  name: string;
  type: "stock" | "forex";
}

interface SearchBarProps {
  onSelect: (item: MarketSearchResult) => void;
}
//states for query, debounced query, search results, loading state, and highlighted index for keyboard navigation.
export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<MarketSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  // we used debouncing to avoid making an API call on every keystroke. The search will only trigger 3s after the user stops typing.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // fetches search results from the backend whenever the debounced query changes.
  useEffect(() => {
    if (!debounced) {
      setResults([]); // sets to empty
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        const res = await fetch(`/api/markets/search?q=${debounced}`); // calls the backend API to search for markets matching the query. The results are expected to be an array of MarketSearchResult objects.
        const data = await res.json();
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // allows the user to navigate the search results using the arrow keys and select an item with the Enter key.
    if (e.key === "ArrowDown") {
      setHighlighted((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      onSelect(results[highlighted]);
    }
  };

  return (
    //component renders input field and dropdown list of search results.
    <div className="relative w-full max-w-md">
      <input
        className="w-full border px-3 py-2 rounded-md"
        placeholder="Search stocks or forex..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {loading && (
        <div className="absolute mt-1 w-full bg-white border rounded-md p-2 text-sm text-gray-500">
          Loading...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md border z-50">
          {results.map((item, index) => (
            <div
              key={item.symbol}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => onSelect(item)}
              className={`px-3 py-2 cursor-pointer ${
                highlighted === index ? "bg-gray-100" : ""
              }`}
            >
              <div className="font-medium">{item.displaySymbol}</div>
              <div className="text-sm text-gray-600">
                {item.name} • {item.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
