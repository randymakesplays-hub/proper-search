"use client";

import type { Filters } from "../types";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  onApply: () => void;
};

export default function Sidebar({ filters, onChange, onApply }: Props) {
  const safeFlags =
    (filters as any)?.flags ?? { absentee: false, highEquity: false, vacant: false };

  const setFlag = (key: "absentee" | "highEquity" | "vacant") => {
    onChange({
      ...(filters as any),
      flags: { ...safeFlags, [key]: !safeFlags[key] },
    } as Filters);
  };

  const setField = (key: "city" | "minBeds" | "maxPrice", value: any) => {
    onChange({ ...(filters as any), [key]: value, flags: safeFlags } as Filters);
  };

  const chipClass = (on: boolean) =>
    [
      "rounded-full border px-3 py-1 text-xs font-semibold",
      on
        ? "bg-zinc-900 text-white border-zinc-900"
        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50",
    ].join(" ");

  return (
    <div className="h-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
      <div className="text-xs font-semibold text-zinc-400 mb-2">QUICK FILTERS</div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={chipClass(!!safeFlags.absentee)} onClick={() => setFlag("absentee")}>
          Absentee
        </button>
        <button type="button" className={chipClass(!!safeFlags.highEquity)} onClick={() => setFlag("highEquity")}>
          High Equity
        </button>
        <button type="button" className={chipClass(!!safeFlags.vacant)} onClick={() => setFlag("vacant")}>
          Vacant
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-zinc-400 mb-1">City</div>
          <input
            value={(filters as any)?.city ?? ""}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Miami"
            className="w-full h-10 rounded-lg bg-white text-zinc-900 px-3 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Min beds</div>
            <input
              value={(filters as any)?.minBeds ?? ""}
              onChange={(e) => setField("minBeds", e.target.value)}
              placeholder="3"
              className="w-full h-10 rounded-lg bg-white text-zinc-900 px-3 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div>
            <div className="text-xs text-zinc-400 mb-1">Max price</div>
            <input
              value={(filters as any)?.maxPrice ?? ""}
              onChange={(e) => setField("maxPrice", e.target.value)}
              placeholder="300000"
              className="w-full h-10 rounded-lg bg-white text-zinc-900 px-3 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </div>

        <button
          onClick={onApply}
          type="button"
          className="w-full h-11 rounded-lg bg-zinc-800 text-white font-semibold hover:bg-zinc-700 active:scale-[0.99]"
        >
          Apply
        </button>

        <div className="text-xs text-zinc-500">
          Tip: leave Min beds / Max price blank to show all filtered properties.
        </div>
      </div>
    </div>
  );
}
