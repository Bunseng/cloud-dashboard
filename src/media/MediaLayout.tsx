import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Topbar } from "../components/Topbar";
import { MediaSidebar, type MediaPageKey } from "./MediaSidebar";

/* ------------------------------------------------------------------ *
 * Media's own app shell — a separate Sidebar from the main dashboard's
 * Layout (MediaSidebar, scoped to Live Stream), paired with the same
 * Topbar every other screen uses — this app's own equivalent of
 * media-cloudplus's SiteHeader (breadcrumb, notifications, account
 * menu) — so Media reads as the same app, just with its own rail.
 * Sits outside the main Layout entirely, same as /logout and /pricing.
 * ------------------------------------------------------------------ */

const PAGE_LABELS: Record<MediaPageKey, string> = {
  rooms: "Rooms",
  analytics: "Analytics",
  plans: "Plans",
};

export function MediaLayout({
  dark,
  onToggleTheme,
}: {
  dark?: boolean;
  onToggleTheme?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const page = (["rooms", "analytics", "plans"] as const).find((id) =>
    location.pathname.startsWith(`/media/${id}`)
  ) ?? "rooms";

  const breadcrumb =
    location.pathname.startsWith("/media/rooms/") && location.pathname !== "/media/rooms"
      ? ["Home", "Media", "Live Stream", "Room List", "Room Detail"]
      : ["Home", "Media", "Live Stream", PAGE_LABELS[page]];

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <MediaSidebar
        collapsed={collapsed}
        page={page}
        onSelect={(next) => navigate(`/media/${next}`)}
        onBackToDashboard={() => navigate("/")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          breadcrumb={breadcrumb}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenBilling={() => navigate("/billing")}
          onOpenPayment={() => navigate("/payment")}
          onOpenProfile={() => navigate("/profile")}
          onOpenMedia={() => navigate("/media")}
          onLogOut={() => navigate("/logout")}
        />

        <main className="flex-1 overflow-y-auto px-7 py-7">
          <div
            key={location.pathname}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
