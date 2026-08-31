import { useEffect, useState } from "react";

import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Power } from "@/components/animate-ui/icons/power";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { FEATURES, MAIN_NAV, MANAGE_NAV } from "../data/nav";
import { SidebarIllustration } from "./SidebarIllustration";
import logoIcon from "@/assets/sidebar/logo-icon.svg";

/* ------------------------------------------------------------------ *
 * Sidebar
 * ------------------------------------------------------------------ */

export function Sidebar({
  collapsed,
  page,
  onNavigateMain,
  onSelectDetailPage,
  onSelectAllPlans,
  onLogOut,
}: {
  collapsed?: boolean;
  page?: string;
  onNavigateMain: (id: string) => void;
  onSelectDetailPage: (id: string) => void;
  onSelectAllPlans: () => void;
  onLogOut: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [logOutConfirmOpen, setLogOutConfirmOpen] = useState(false);

  // Only a Feature's own detail page (reached via "View List"/a resource
  // child, e.g. Storage's "Buckets") forces the sidebar open — expand that
  // group and highlight its resource child. Any other route (Home,
  // Wallet, Billing Subscription, Dashboard, Planning, …) clears it, so
  // exactly one sidebar row — the one matching the current route — ever
  // reads as active at a time, instead of a stale Feature group staying
  // lit after you've navigated away from it.
  useEffect(() => {
    const detailFeature = FEATURES.find((f) => f.id === page);
    if (detailFeature) {
      setOpenGroup(detailFeature.id);
      setActiveChild(detailFeature.resourceListLabel);
    } else {
      setOpenGroup(null);
      setActiveChild(null);
    }
  }, [page]);

  // Clicking a Feature's own row opens that feature's page, and marks
  // both the group and its resource child active — so the whole path
  // you're on reads as selected.
  function selectFeature(item: any) {
    setOpenGroup(item.id);
    setActiveChild(item.resourceListLabel);
    onSelectDetailPage(item.id);
  }

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
      {/* Brand — icon badge + wordmark, per Figma's Sidebar component
          (node 286:732), rather than the text-only Logo atom used on
          marketing/log-out screens whose own Figma exports are plain text. */}
      <div
        className={
          "flex h-16 items-center gap-2 " +
          (collapsed ? "justify-center" : "px-4")
        }
      >
        <img src={logoIcon} alt="" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <span className="text-sm text-zinc-950 dark:text-zinc-50">Cloud+</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        {/* Primary */}
        <ul className="space-y-0.5">
          {MAIN_NAV.map((item) => {
            const isActive = page === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigateMain(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={
                    menuButtonBase +
                    " " +
                    (collapsed ? "justify-center p-0 " : "") +
                    (isActive ? menuButtonActive : menuButtonInactive)
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Feature group */}
        <p
          className={
            "mt-5 flex h-8 items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          {collapsed ? "···" : "Feature"}
        </p>

        <ul className="space-y-0.5">
          {FEATURES.map((item) => {
            const isOpen = openGroup === item.id && !collapsed;
            const children = [item.resourceListLabel];
            // The group reads as selected whenever you're somewhere inside
            // it — which is exactly when a child is marked active.
            const isFeatureActive = openGroup === item.id && Boolean(activeChild);
            return (
              <li key={item.id}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={(o) => setOpenGroup(o ? item.id : null)}
                >
                  <CollapsibleTrigger
                    title={collapsed ? item.navLabel : undefined}
                    onClick={() => selectFeature(item)}
                    className={
                      menuButtonBase +
                      " " +
                      (collapsed ? "justify-center p-0 " : "") +
                      (isFeatureActive ? menuButtonActive : menuButtonInactive)
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.navLabel}</span>
                        <ChevronRight
                          className={
                            "h-4 w-4 shrink-0 text-zinc-400 motion-safe:transition-transform " +
                            (isOpen ? "rotate-90" : "")
                          }
                          animateOnHover
                          animateOnTap
                        />
                      </>
                    )}
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden">
                    <ul className="mt-0.5 ml-[30px] space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                      {children.map((child) => {
                        const isChildActive =
                          item.id === openGroup && child === activeChild;
                        return (
                          <li key={child}>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenGroup(item.id);
                                setActiveChild(child);
                                onSelectDetailPage(item.id);
                              }}
                              aria-current={isChildActive ? "page" : undefined}
                              className={
                                "w-full rounded-md px-2 py-1.5 text-left text-[13px] " +
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                                (isChildActive
                                  ? "font-medium text-[#1C75BC] dark:text-[#6FA8D8]"
                                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")
                              }
                            >
                              {child}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </ul>

        {/* Manage group — Billing and Log out, still part of the Feature
            section's flow (no separate footer, sits right under it) but
            labeled just like "Feature" above so it reads as its own group. */}
        <p
          className={
            "mt-5 flex h-8 items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          {collapsed ? "···" : "Manage"}
        </p>

        <ul className="space-y-0.5">
          {MANAGE_NAV.map((item) => {
            const isActive = page === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigateMain(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={
                    menuButtonBase +
                    " " +
                    (collapsed ? "justify-center p-0 " : "") +
                    (isActive ? menuButtonActive : menuButtonInactive)
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setLogOutConfirmOpen(true)}
              title={collapsed ? "Log out" : undefined}
              className={menuButtonBase + " " + (collapsed ? "justify-center p-0 " : "") + menuButtonInactive}
            >
              <Power className="h-4 w-4 shrink-0" animateOnHover animateOnTap />
              {!collapsed && <span>Log out</span>}
            </button>
          </li>
        </ul>

        {/* Upsell card */}
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
                  onClick={onSelectAllPlans}
                  className="h-9 px-4 text-sm shadow-sm"
                >
                  Subscribe Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <ConfirmDialog
        open={logOutConfirmOpen}
        onOpenChange={setLogOutConfirmOpen}
        title="Log out?"
        description="You'll need to sign back in to access your dashboard."
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={onLogOut}
      />
    </aside>
  );
}
