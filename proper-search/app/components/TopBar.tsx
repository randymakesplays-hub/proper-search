"use client";

type Props = {
  query: string;
  onQueryChange: (next: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function TopBar({ query, onQueryChange, onSearch, onClear }: Props) {
  return (
    <div className="w-full bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="font-semibold text-zinc-900 leading-tight">Proper Search</div>
          <div className="text-xs text-zinc-500 -mt-1">AI property search</div>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder='Try: "Miami", "Brickell", "zip 33131"'
            className="w-full h-10 rounded-lg border border-zinc-200 px-4 text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-200"
          />

          <button
            onClick={onSearch}
            className="h-10 px-4 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 active:scale-[0.99]"
            type="button"
          >
            Run Search
          </button>

          <button
            onClick={onClear}
            className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 active:scale-[0.99]"
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
