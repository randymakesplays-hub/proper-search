"use client";

import { Separator } from "@/components/ui/separator";

export default function FooterBar() {
  const year = new Date().getFullYear();

  return (
    <footer className="h-10 w-full border-t bg-card px-4 flex items-center justify-between text-xs shrink-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="font-medium text-foreground">Proper Search</span>
        <Separator orientation="vertical" className="h-4" />
        <span>© {year}</span>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <button className="hover:text-foreground transition-colors">Privacy</button>
        <button className="hover:text-foreground transition-colors">Terms</button>
        <button className="hover:text-foreground transition-colors">Support</button>
      </div>

      <span className="text-muted-foreground">v0.1</span>
    </footer>
  );
}
