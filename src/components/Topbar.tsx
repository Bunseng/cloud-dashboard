import { BellRing, ChevronRight, PanelLeft, Sun } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ *
 * Top bar
 * ------------------------------------------------------------------ */

export function Topbar({
  onToggleSidebar,
  dark,
  onToggleTheme,
  breadcrumb,
}: {
  onToggleSidebar?: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  breadcrumb: string[];
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white pl-4 pr-9 dark:border-zinc-800 dark:bg-zinc-950">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="h-8 w-8 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <Separator
        orientation="vertical"
        className="h-5 bg-zinc-200 dark:bg-zinc-800"
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "text-zinc-600 dark:text-zinc-300"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* No Payment shortcut here — that's what the Sidebar's own
            "Payment" row (under Manage) is for; this bar isn't the
            place for a second way to reach it. */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            className="h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Sun className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications, 1 unread"
            className="relative h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <BellRing className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-zinc-950" />
          </Button>
        </div>

        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="" />
          <AvatarFallback className="bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            CP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
