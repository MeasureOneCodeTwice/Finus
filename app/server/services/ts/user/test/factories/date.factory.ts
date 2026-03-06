export interface DateRangeTestCase {
  name: string;
  start: Date;
  end: Date;
  period: "w" | "m" | "y";
  expected: string[];
}

export function createDailyDateRangeCases(): DateRangeTestCase[] {
  //const baseDate = new Date('2024-03-15T00:00:00Z');

  return [
    {
      name: "weekly range - 7 days",
      start: new Date("2024-03-09T00:00:00Z"),
      end: new Date("2024-03-15T00:00:00Z"),
      period: "w",
      expected: [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ],
    },
    {
      name: "monthly range - 30 days",
      start: new Date("2024-02-15T00:00:00Z"),
      end: new Date("2024-03-15T00:00:00Z"),
      period: "m",
      expected: Array.from({ length: 30 }, (_, i) => {
        const date = new Date("2024-02-15");
        date.setDate(date.getDate() + i);
        return date.toISOString().slice(0, 10);
      }),
    },
    {
      name: "range crossing month boundary",
      start: new Date("2024-01-30T00:00:00Z"),
      end: new Date("2024-02-05T00:00:00Z"),
      period: "w",
      expected: [
        "2024-01-30",
        "2024-01-31",
        "2024-02-01",
        "2024-02-02",
        "2024-02-03",
        "2024-02-04",
        "2024-02-05",
      ],
    },
    {
      name: "range crossing year boundary",
      start: new Date("2023-12-30T00:00:00Z"),
      end: new Date("2024-01-05T00:00:00Z"),
      period: "w",
      expected: [
        "2023-12-30",
        "2023-12-31",
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
      ],
    },
  ];
}

export function createMonthlyDateRangeCases(): DateRangeTestCase[] {
  return [
    {
      name: "yearly range - 12 months",
      start: new Date("2023-04-01T00:00:00Z"),
      end: new Date("2024-03-01T00:00:00Z"),
      period: "y",
      expected: [
        "2023-04",
        "2023-05",
        "2023-06",
        "2023-07",
        "2023-08",
        "2023-09",
        "2023-10",
        "2023-11",
        "2023-12",
        "2024-01",
        "2024-02",
        "2024-03",
      ],
    },
    {
      name: "yearly range - partial year",
      start: new Date("2024-01-01T00:00:00Z"),
      end: new Date("2024-06-01T00:00:00Z"),
      period: "y",
      expected: [
        "2024-01",
        "2024-02",
        "2024-03",
        "2024-04",
        "2024-05",
        "2024-06",
      ],
    },
    {
      name: "single month range",
      start: new Date("2024-03-01T00:00:00Z"),
      end: new Date("2024-03-01T00:00:00Z"),
      period: "y",
      expected: ["2024-03"],
    },
  ];
}

export function createEdgeDateCases(): DateRangeTestCase[] {
  return [
    {
      name: "leap year February",
      start: new Date("2024-02-28T00:00:00Z"),
      end: new Date("2024-03-02T00:00:00Z"),
      period: "w",
      expected: ["2024-02-28", "2024-02-29", "2024-03-01", "2024-03-02"],
    },
    {
      name: "non-leap year February",
      start: new Date("2023-02-27T00:00:00Z"),
      end: new Date("2023-03-02T00:00:00Z"),
      period: "w",
      expected: ["2023-02-27", "2023-02-28", "2023-03-01", "2023-03-02"],
    },
    {
      name: "DST transition (should not affect dates)",
      start: new Date("2024-03-09T00:00:00Z"),
      end: new Date("2024-03-16T00:00:00Z"),
      period: "w",
      expected: [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
        "2024-03-16",
      ],
    },
    {
      name: "same day range",
      start: new Date("2024-03-15T10:30:00Z"),
      end: new Date("2024-03-15T15:45:00Z"),
      period: "w",
      expected: ["2024-03-15"],
    },
  ];
}
