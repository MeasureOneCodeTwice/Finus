import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type MarketSearchBarProps = {
  searchTerm: string;
  onChange: (value: string) => void;
};

export default function MarketSearchBar({
  searchTerm,
  onChange,
}: MarketSearchBarProps) {
  return (
    <div className="w-full max-w-xl">
      <label
        className="mb-2 block text-sm font-medium tracking-wide text-emerald-50/80"
        htmlFor="market-search"
      >
        Search markets
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/45" />
        <Input
          id="market-search"
          value={searchTerm}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Try AAPL, NVDA, EUR/USD, or USDJPY"
          className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-emerald-100/35"
        />
      </div>
    </div>
  );
}
