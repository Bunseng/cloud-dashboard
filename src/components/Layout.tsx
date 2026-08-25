import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { GROUPS } from "../data/groups";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/* ------------------------------------------------------------------ *
 * Routing shell — every page and drill-down below is a real URL rather
 * than sibling `open*` state, so back/forward, refresh, and sharing a
 * link all just work. `Layout` renders the persistent Sidebar/Topbar
 * frame around whatever route matched into its <Outlet/>; the small
 * *Route wrapper components below it translate between useParams/
 * useNavigate and the existing page components' plain props, so none of
 * those components needed to know routing exists.
 * ------------------------------------------------------------------ */

export function Layout({
  dark,
  onToggleTheme,
}: {
  dark?: boolean;
  onToggleTheme?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const page = pathname === "/"
    ? "home"
    : pathname.startsWith("/dashboard")
    ? "dashboard"
    : pathname.startsWith("/planning") || pathname.startsWith("/subscribe")
    ? "planning"
    : pathname.startsWith("/payment") || pathname.startsWith("/topup")
    ? "payment"
    : pathname.startsWith("/billing")
    ? "billing"
    : pathname.startsWith("/groups")
    ? "groups"
    : pathname.startsWith("/storage")
    ? "storage"
    : pathname.startsWith("/runapp")
    ? "runapp"
    : pathname.startsWith("/database")
    ? "database"
    : pathname.startsWith("/vps")
    ? "vps"
    : "home";

  // Decoding the raw path segments (rather than reaching for useParams)
  // works the same regardless of how deep the matched route is nested,
  // and is all the breadcrumb ever needed anyway.
  const segs = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  let breadcrumb: string[];
  if (page === "storage" && segs[1]) {
    breadcrumb = ["Home", "Storage", segs[1]];
  } else if (page === "storage") {
    breadcrumb = ["Home", "Storage"];
  } else if (page === "runapp" && segs[3]) {
    breadcrumb = ["Home", "Run App", `Subscription ${segs[1]}`, segs[2], segs[3]];
  } else if (page === "runapp" && segs[2]) {
    breadcrumb = ["Home", "Run App", `Subscription ${segs[1]}`, segs[2]];
  } else if (page === "runapp" && segs[1]) {
    breadcrumb = ["Home", "Run App", `Subscription ${segs[1]}`];
  } else if (page === "runapp") {
    breadcrumb = ["Home", "Run App"];
  } else if (page === "database" && segs[1]) {
    breadcrumb = ["Home", "Databases", segs[1]];
  } else if (page === "database") {
    breadcrumb = ["Home", "Databases"];
  } else if (page === "vps" && segs[1]) {
    breadcrumb = ["Home", "VPS", segs[1]];
  } else if (page === "vps") {
    breadcrumb = ["Home", "VPS"];
  } else if (page === "planning" && pathname.startsWith("/subscribe")) {
    breadcrumb = ["Home", "Planning", "Subscribe"];
  } else if (page === "planning") {
    breadcrumb = ["Home", "Planning"];
  } else if (page === "payment" && pathname.startsWith("/topup")) {
    breadcrumb = ["Home", "Payment", "Top Up"];
  } else if (page === "payment") {
    breadcrumb = ["Home", "Payment"];
  } else if (page === "billing") {
    breadcrumb = ["Home", "Billing Subscription"];
  } else if (page === "groups" && segs[1]) {
    const group = GROUPS.find((g) => g.id === segs[1]);
    breadcrumb = ["Home", "Group Members", group?.name ?? segs[1]];
  } else if (page === "groups") {
    breadcrumb = ["Home", "Group Members"];
  } else {
    breadcrumb = [page === "home" ? "Home" : "Dashboard"];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <Sidebar
        collapsed={collapsed}
        page={page}
        onNavigateMain={(id) => navigate(id === "home" ? "/" : `/${id}`)}
        onSelectDetailPage={(id) => navigate(`/${id}`)}
        onSelectAllPlans={() => navigate("/planning")}
        onLogOut={() => navigate("/logout")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          breadcrumb={breadcrumb}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />

        <main className="flex-1 overflow-y-auto px-7 py-7">
          {/* key={pathname} forces a remount per route so the enter
              animation replays on every navigation, not just first load. */}
          <div
            key={pathname}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
