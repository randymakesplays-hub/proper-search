"use client";

export default function FooterBar() {
  const year = new Date().getFullYear();

  return (
    <footer className="h-12 w-full border-t bg-white px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-zinc-600">
        <span className="font-semibold text-zinc-800">Proper Search</span>
        <span className="text-zinc-400">© {year}</span>
      </div>

      <div className="flex items-center gap-4 text-zinc-500">
        <button className="hover:text-zinc-800">Privacy</button>
        <button className="hover:text-zinc-800">Terms</button>
        <button className="hover:text-zinc-800">Support</button>
      </div>

      <div className="text-zinc-400">v0.1</div>
    </footer>
  );
}
