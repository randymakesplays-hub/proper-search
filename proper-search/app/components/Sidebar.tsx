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
      "rounded-full border px-3 py-1 text-xs font-medium",
      on ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50",
    ].join(" ");

  return (
    <div className="p-4">
      <div className="text-xs font-semibold text-zinc-500">QUICK FILTERS</div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button className={chipClass(!!safeFlags.absentee)} onClick={() => setFlag("absentee")} type="button">
          Absentee
        </button>
        <button className={chipClass(!!safeFlags.highEquity)} onClick={() => setFlag("highEquity")} type="button">
          High Equity
        </button>
        <button className={chipClass(!!safeFlags.vacant)} onClick={() => setFlag("vacant")} type="button">
          Vacant
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="text-[11px] font-medium text-zinc-600">City</div>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"
            value={(filters as any)?.city ?? ""}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Houston"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[11px] font-medium text-zinc-600">Min beds</div>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"
              value={(filters as any)?.minBeds ?? ""}
              onChange={(e) => setField("minBeds", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="3"
            />
          </div>

          <div>
            <div className="text-[11px] font-medium text-zinc-600">Max price</div>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"
              value={(filters as any)?.maxPrice ?? ""}
              onChange={(e) => setField("maxPrice", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="300000"
            />
          </div>
        </div>

        <button
          onClick={onApply}
          className="mt-2 w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          type="button"
        >
          Apply
        </button>

        <div className="pt-2 text-[11px] text-zinc-500">
          Tip: leave Min beds / Max price blank to show all filter properties.
        </div>
      </div>
    </div>
  );
}
