import { createContext, useContext, useState, type ReactNode } from "react";

import { createProject, deleteProject, PROJECTS, renameProject, type Project } from "../data/projects";

/* Which Project is "active" — read by the Sidebar's switcher and by
   each Feature's resource list (Buckets, Stacks, …) to filter down to
   just that project's rows. Global (above the Router) so both can
   share one source of truth, the same reason every other cross-page
   bit of state here (PlanSchedule, AccountBalance, …) is a context. */
interface ProjectContextValue {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  addProject: (name: string) => Project;
  removeProject: (id: string) => void;
  renameProjectById: (id: string, name: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState(() => [...PROJECTS]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );

  function addProject(name: string) {
    const project = createProject(name);
    setProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
    return project;
  }

  function removeProject(id: string) {
    deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) setActiveProjectId(remaining[0]?.id ?? null);
  }

  function renameProjectById(id: string, name: string) {
    renameProject(id, name);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        setActiveProjectId,
        addProject,
        removeProject,
        renameProjectById,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a ProjectProvider");
  return ctx;
}
