import { useState } from "react";

import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Clapperboard } from "@/components/animate-ui/icons/clapperboard";
import { Gauge } from "@/components/animate-ui/icons/gauge";
import { House } from "@/components/animate-ui/icons/house";
import { ImagePlay as Video } from "@/components/animate-ui/icons/image-play";
import { Rocket } from "@/components/animate-ui/icons/rocket";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { SidebarIllustration } from "../components/SidebarIllustration";
import logoIcon from "@/assets/sidebar/logo-icon.svg";

/* ------------------------------------------------------------------ *
 * Media's own sidebar — a separate rail from the main app's Sidebar,
 * mirroring media-cloudplus's own AppSidebar: the same brand mark, a
 * primary row above the "Feature" group, one collapsible Feature entry
 * per group (here just Live Stream, since Media only ports that one
 * feature), and the same "Grab Plan Now" upsell footer.
 * ------------------------------------------------------------------ */

const LIVE_STREAM_CHILDREN = [
  { id: "rooms", label: "Rooms" },
  { id: "analytics", label: "Analytics" },
  { id: "plans", label: "Plans" },
] as const;

export type MediaPageKey = (typeof LIVE_STREAM_CHILDREN)[number]["id"];

export function MediaSidebar({
  collapsed,
  page,
  onSelect,
  onBackToDashboard,
}: {
  collapsed?: boolean;
  page: MediaPageKey;
  onSelect: (page: MediaPageKey) => void;
  onBackToDashboard: () => void;
}) {
  const [open, setOpen] = useState(true);

  const menuButtonBase =
    "flex h-8 w-full items-center gap-2 rounded-lg p-2 text-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
    "motion-safe:transition-colors";
  const menuButtonInactive =
    "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900";
  const menuButtonActive =
    "bg-[#EFF6FF] font-medium text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]";

  return (
    <aside
      className={
        "flex shrink-0 flex-col border-r border-zinc-200 bg-[#fafafa] " +
        "dark:border-zinc-800 dark:bg-zinc-950 " +
        "motion-safe:transition-[width] motion-safe:duration-200 " +
        (collapsed ? "w-[72px]" : "w-[254px]")
      }
    >
      {/* Brand — same wordmark as the main Sidebar, so Media reads as part
          of the same app rather than a different product. */}
      <button
        type="button"
        onClick={onBackToDashboard}
        className={
          "flex h-16 items-center gap-2 outline-hidden focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
          (collapsed ? "justify-center" : "px-4")
        }
      >
        <img src={logoIcon} alt="" className="h-8 w-8 shrink-0" />
        {!collapsed && <span className="text-sm text-zinc-950 dark:text-zinc-50">Cloud+</span>}
      </button>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        {/* Primary — the same role media-cloudplus's "Dashboard" row
            plays above its Feature group: one click back to the app's
            own home. */}
        <ul>
          <li>
            <button
              type="button"
              onClick={onBackToDashboard}
              title={collapsed ? "Home" : undefined}
              className={menuButtonBase + " " + (collapsed ? "justify-center p-0 " : "") + menuButtonInactive}
            >
              <House className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
              {!collapsed && <span>Home</span>}
            </button>
          </li>
        </ul>

        <p
          className={
            "mt-5 flex h-8 items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          {collapsed ? "···" : "Feature"}
        </p>

        <ul>
          <li>
            <Collapsible open={open && !collapsed} onOpenChange={setOpen}>
              <CollapsibleTrigger
                title={collapsed ? "Live Stream" : undefined}
                className={
                  menuButtonBase + " " + (collapsed ? "justify-center p-0 " : "") + menuButtonActive
                }
              >
                <Clapperboard className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Live Stream</span>
                    <ChevronRight
                      className={
                        "h-4 w-4 shrink-0 text-[#1C75BC]/60 motion-safe:transition-transform " +
                        (open ? "rotate-90" : "")
                      }
                      animateOnHover
                      animateOnTap
                    />
                  </>
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden">
                <ul className="mt-0.5 ml-[30px] space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                  {LIVE_STREAM_CHILDREN.map((child) => {
                    const isActive = page === child.id;
                    const Icon = child.id === "rooms" ? Video : child.id === "analytics" ? Gauge : Rocket;
                    return (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(child.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] " +
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                            (isActive
                              ? "font-medium text-[#1C75BC] dark:text-[#6FA8D8]"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")
                          }
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          {child.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>

        {/* Upsell card — identical footer to the main Sidebar's, just
            pointed at Media's own Plans page. */}
        <div className="flex flex-1 flex-col justify-end">
          {!collapsed && (
            <div className="mt-3 flex flex-col items-center gap-3 rounded-lg bg-blue-500/10 px-4 py-6 text-center dark:bg-zinc-900">
              <SidebarIllustration />
              <div className="flex flex-col items-center gap-4">
                <div>
                  <p className="text-base font-bold leading-6 text-zinc-900 dark:text-zinc-50">
                    Grab Plan Now
                  </p>
                  <p className="mx-auto mt-1 max-w-[139px] text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                    Access our service subscribes now
                  </p>
                </div>
                <Button
                  variant="brand"
                  onClick={() => onSelect("plans")}
                  className="h-9 px-4 text-sm shadow-sm"
                >
                  Subscribe Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
