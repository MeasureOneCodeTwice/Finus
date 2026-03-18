// period selector component for the historical chart, allowing users to select different time ranges for viewing stock price data.
import React from "react";
import { PERIOD_RANGES } from "../enum/PeriodRange";

export type PeriodRange = (typeof PERIOD_RANGES)[number];

interface PeriodRangeSelectorProps {
  selected: PeriodRange;
  onChange: (range: PeriodRange) => void;
}
//function that renders a set of buttons for each predefined period range.
export function PeriodRangeSelector({
  selected,
  onChange,
}: PeriodRangeSelectorProps) {
  return (
    <div className="flex gap-3 mb-4">
      {PERIOD_RANGES.map((range) => (
        <button
          key={range.label}
          onClick={() => onChange(range)}
          className={`px-3 py-1 rounded transition-colors ${
            selected.label === range.label
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
export { PERIOD_RANGES };
