/* ------------------------------------------------------------------ *
 * Projects — a global, account-level list (reached from the sidebar's
 * top-level nav, not nested inside any one Run App subscription).
 * Conceptually the same thing a Run App Stack already is — a named app
 * made of one or more services — just surfaced as its own flat list
 * across every subscription instead of drilled into one at a time.
 * No real backend — PROJECTS is a module-level mutable array (same
 * "no backend" convention as paymentMethods.ts/groups.ts).
 * ------------------------------------------------------------------ */

export interface Project {
  id: string;
  name: string;
  status: { label: string; tone: string };
  serviceCount: number;
  createdOn: string;
}

let nextProjectId = 1;
function makeProjectId() {
  return `proj-${Date.now()}-${nextProjectId++}`;
}

/* A few already set up, so the list isn't empty on first load. */
export const PROJECTS: Project[] = [
  {
    id: "proj-web",
    name: "web-frontend",
    status: { label: "Running", tone: "green" },
    serviceCount: 3,
    createdOn: "Aug 2, 2026",
  },
  {
    id: "proj-api",
    name: "api-gateway",
    status: { label: "Deploying", tone: "blue" },
    serviceCount: 2,
    createdOn: "Jul 20, 2026",
  },
  {
    id: "proj-worker",
    name: "worker-queue",
    status: { label: "Stopped", tone: "zinc" },
    serviceCount: 1,
    createdOn: "Jun 14, 2026",
  },
];

// Mirrors Cloudflare's own simplest "Create" flow — name only, nothing
// else to configure up front; services are added once it exists.
export function createProject(name: string): Project {
  const project: Project = {
    id: makeProjectId(),
    name,
    status: { label: "Deploying", tone: "blue" },
    serviceCount: 0,
    createdOn: new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
  PROJECTS.push(project);
  return project;
}

export function deleteProject(id: string) {
  const i = PROJECTS.findIndex((p) => p.id === id);
  if (i !== -1) PROJECTS.splice(i, 1);
}

export function renameProject(id: string, name: string) {
  const project = PROJECTS.find((p) => p.id === id);
  if (project) project.name = name;
}
