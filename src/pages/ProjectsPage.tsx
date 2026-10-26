import { useState } from "react";
import type { ReactNode } from "react";

import { ResourceListView } from "../components/ResourceListView";
import { StatusBadge } from "../components/atoms";
import { useProject } from "../context/ProjectContext";
import type { Project } from "../data/projects";
import { CreateProjectDialog } from "./ProjectDialogs";

const PROJECT_COLUMNS: Array<{
  key: string;
  header: string;
  className?: string;
  render?: (row: Project) => ReactNode;
}> = [
  {
    key: "name",
    header: "Project Name",
    className: "w-[260px] font-medium text-zinc-900 dark:text-zinc-100",
  },
  {
    key: "status",
    header: "Status",
    className: "w-[160px]",
    render: (row) => <StatusBadge label={row.status.label} tone={row.status.tone} />,
  },
  {
    key: "serviceCount",
    header: "Services",
    render: (row) => `${row.serviceCount} service${row.serviceCount === 1 ? "" : "s"}`,
  },
  { key: "createdOn", header: "Created On", className: "whitespace-nowrap" },
];

/* Global, top-level Project list — not nested inside any one Run App
   subscription. Conceptually the same thing a Run App Stack already
   is; "Create Project" is Cloudflare's simplest flow, name only. */
export default function ProjectsPage({
  onViewProject,
}: {
  onViewProject: (projectName: string) => void;
}) {
  const { projects, addProject, removeProject } = useProject();
  const [createOpen, setCreateOpen] = useState(false);

  function handleDelete(row: Project) {
    removeProject(row.id);
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Projects
      </h1>

      <div className="mt-5">
        <ResourceListView
          columns={PROJECT_COLUMNS}
          rows={projects}
          createLabel="Create Project"
          emptyTitle="No projects yet"
          emptyDescription="Create your first project and it will show up here."
          onViewDetail={onViewProject}
          onCreate={() => setCreateOpen(true)}
          onDelete={handleDelete}
        />
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={addProject} />
    </div>
  );
}
