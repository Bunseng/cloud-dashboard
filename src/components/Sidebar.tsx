import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Check } from "@/components/animate-ui/icons/check";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Ellipsis } from "@/components/animate-ui/icons/ellipsis";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Power } from "@/components/animate-ui/icons/power";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { FEATURES, MAIN_NAV, MANAGE_NAV } from "../data/nav";
import { useProject } from "../context/ProjectContext";
import type { Project } from "../data/projects";
import { CreateProjectDialog, ProjectSettingsDialog } from "../pages/ProjectDialogs";
import { DEFAULT_ACCOUNT } from "../pages/ProfilePage";
import { SidebarIllustration } from "./SidebarIllustration";
import logoIcon from "@/assets/sidebar/logo-icon.svg";

// A Notion/Cloudflare-style initial-letter avatar chip, colored
// deterministically by position so the list stays visually distinct
// without needing per-project color data.
const PROJECT_AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

function ProjectAvatar({ name, index }: { name: string; index: number }) {
  return (
    <span
      className={
        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-medium text-white " +
        PROJECT_AVATAR_COLORS[index % PROJECT_AVATAR_COLORS.length]
      }
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Sidebar
 * ------------------------------------------------------------------ */

export function Sidebar({
  collapsed,
  page,
  pathname,
  onNavigateMain,
  onSelectDetailPage,
  onSelectSecondary,
  onSelectAllPlans,
  onLogOut,
}: {
  collapsed?: boolean;
  page?: string;
  pathname?: string;
  onNavigateMain: (id: string) => void;
  onSelectDetailPage: (id: string) => void;
  onSelectSecondary?: (path: string) => void;
  onSelectAllPlans: () => void;
  onLogOut: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [logOutConfirmOpen, setLogOutConfirmOpen] = useState(false);

  // Which Project is "active" — shown at the top of the sidebar and read
  // by each Feature's resource list to filter down to that project's
  // rows. Lives in ProjectContext (above the Router) so Sidebar and the
  // Feature pages share one source of truth.
  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    addProject,
    removeProject,
    renameProjectById,
  } = useProject();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.trim().toLowerCase())
  );

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
      const matchedSecondary = detailFeature.secondaryNav?.find(
        (n) => pathname && pathname.startsWith(n.path)
      );
      setActiveChild(matchedSecondary ? matchedSecondary.label : detailFeature.resourceListLabel);
    } else {
      setOpenGroup(null);
      setActiveChild(null);
    }
  }, [page, pathname]);

  // Clicking a Feature's own row opens that feature's page, and marks
  // both the group and its resource child active — so the whole path
  // you're on reads as selected.
  function selectFeature(item: any) {
    setOpenGroup(item.id);
    setActiveChild(item.resourceListLabel);
    onSelectDetailPage(item.id);
  }

  // Clicking one of a Feature's secondary rows (e.g. VPS's "Snapshots")
  // navigates straight to that row's own top-level route.
  function selectSecondary(item: any, nav: { label: string; path: string }) {
    setOpenGroup(item.id);
    setActiveChild(nav.label);
    onSelectSecondary?.(nav.path);
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
        {/* Project label — a plain static header, same as Feature/Manage. */}
        <div
          className={
            "flex h-8 w-full items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          <span>{collapsed ? "···" : "Project"}</span>
        </div>

        {/* Project switcher — a context marker only, like Cloudflare's
            account switcher; doesn't filter Feature below it. */}
        <DropdownMenu
          open={projectMenuOpen}
          onOpenChange={(open) => {
            setProjectMenuOpen(open);
            if (!open) setProjectSearch("");
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={collapsed ? (activeProject?.name ?? "Select Project") : undefined}
              className={
                menuButtonBase +
                " mb-2 " +
                (collapsed ? "justify-center p-0 " : "") +
                menuButtonInactive
              }
            >
              {activeProject ? (
                <ProjectAvatar name={activeProject.name} index={projects.indexOf(activeProject)} />
              ) : (
                <span className="h-5 w-5 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />
              )}
              {!collapsed && (
                <span className="flex-1 truncate text-left font-medium">
                  {activeProject?.name ?? "Select Project"}
                </span>
              )}
              {!collapsed && (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] overflow-hidden rounded-xl p-0">
            <p className="truncate px-3 pt-2.5 text-[12px] text-zinc-400 dark:text-zinc-500">
              {DEFAULT_ACCOUNT.email}
            </p>

            <div className="flex items-center gap-2 px-3 py-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <Input
                autoFocus
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search projects..."
                className="h-5 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <DropdownMenuSeparator className="my-0" />

            <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Projects
            </p>
            <div className="max-h-64 overflow-y-auto p-1.5 pt-1">
              {filteredProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <DropdownMenuItem
                    key={project.id}
                    onSelect={(e) => {
                      if ((e.target as HTMLElement).closest("[data-project-settings-trigger]")) {
                        e.preventDefault();
                        return;
                      }
                      setActiveProjectId(project.id);
                    }}
                    className={
                      "flex items-center gap-2 rounded-md py-1.5 focus:bg-[#EFF6FF] dark:focus:bg-zinc-800 " +
                      (isActive ? "bg-[#EFF6FF] dark:bg-zinc-800" : "")
                    }
                  >
                    <ProjectAvatar name={project.name} index={projects.indexOf(project)} />
                    <span className={"flex-1 truncate " + (isActive ? "font-medium text-[#1C75BC] dark:text-[#6FA8D8]" : "")}>
                      {project.name}
                    </span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-[#1C75BC] dark:text-[#6FA8D8]" />}
                    <button
                      type="button"
                      data-project-settings-trigger
                      aria-label={`${project.name} settings`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsProject(project);
                        setProjectMenuOpen(false);
                      }}
                      className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    >
                      <Ellipsis className="h-3.5 w-3.5" animateOnHover animateOnTap />
                    </button>
                  </DropdownMenuItem>
                );
              })}
              {filteredProjects.length === 0 && (
                <p className="px-2 py-3 text-center text-sm text-zinc-400">No projects found.</p>
              )}
            </div>

            <DropdownMenuSeparator className="my-0" />
            <div className="p-1.5">
              <DropdownMenuItem
                onSelect={() => setCreateProjectOpen(true)}
                className="gap-2 rounded-md py-1.5 text-[#1C75BC] focus:bg-[#EFF6FF] focus:text-[#1C75BC] dark:text-[#6FA8D8] dark:focus:bg-zinc-800 dark:focus:text-[#6FA8D8]"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Create Project
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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

        {/* Feature group label — a plain static header, not an action. */}
        <div
          className={
            "mt-5 flex h-8 w-full items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          <span>{collapsed ? "···" : "Feature"}</span>
        </div>

        <ul className="space-y-0.5">
          {FEATURES.map((item) => {
            const isOpen = openGroup === item.id && !collapsed;
            const children = [
              { label: item.resourceListLabel, onSelect: () => selectFeature(item) },
              ...(item.secondaryNav ?? []).map((nav) => ({
                label: nav.label,
                onSelect: () => selectSecondary(item, nav),
              })),
            ];
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
                          item.id === openGroup && child.label === activeChild;
                        return (
                          <li key={child.label}>
                            <button
                              type="button"
                              onClick={child.onSelect}
                              aria-current={isChildActive ? "page" : undefined}
                              className={
                                "w-full rounded-md px-2 py-1.5 text-left text-[13px] " +
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                                (isChildActive
                                  ? "font-medium text-[#1C75BC] dark:text-[#6FA8D8]"
                                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")
                              }
                            >
                              {child.label}
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

        {/* Manage group label — a plain static header, not an action. */}
        <div
          className={
            "mt-5 flex h-8 w-full items-center text-xs text-zinc-900/70 dark:text-zinc-50/70 " +
            (collapsed ? "justify-center px-0" : "px-2")
          }
        >
          <span>{collapsed ? "···" : "Manage"}</span>
        </div>

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

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreate={addProject}
      />

      <ProjectSettingsDialog
        project={settingsProject}
        open={settingsProject !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsProject(null);
        }}
        onRename={renameProjectById}
        onDelete={(id) => {
          setSettingsProject(null);
          setDeleteProjectTarget(projects.find((p) => p.id === id) ?? null);
        }}
      />

      <ConfirmDialog
        open={deleteProjectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectTarget(null);
        }}
        title={`Delete "${deleteProjectTarget?.name ?? ""}"?`}
        description="This removes the project and can't be undone."
        confirmLabel="Delete Project"
        variant="destructive"
        onConfirm={() => {
          if (deleteProjectTarget) removeProject(deleteProjectTarget.id);
          setDeleteProjectTarget(null);
        }}
      />
    </aside>
  );
}
