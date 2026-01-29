"use client";

import Image from "next/image";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function TopBar({ query, onQueryChange, onSearch, onClear }: Props) {
  return (
    <header className="w-full border-b bg-white">
      <div className="h-14 px-4 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-[240px]">
          <div className="relative h-7 w-7">
            <Image src="/logo.png" alt="Proper Search" fill className="object-contain" priority />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-zinc-900">Proper Search</div>
            <div className="text-xs text-zinc-500">AI property search</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Try: "absentee", "equity 40", "price < 300000", "Houston"`}
            className="w-full h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSearch}
            className="h-9 px-3 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Run Search
          </button>
          <button
            onClick={onClear}
            className="h-9 px-3 rounded-md border text-sm font-medium hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>
      </div>
    </header>
  );
}
