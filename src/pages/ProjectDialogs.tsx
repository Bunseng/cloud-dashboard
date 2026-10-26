import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Project } from "../data/projects";

/* Creating a Project asks for nothing but its name — services are added
   afterwards from the Project's own detail page, same as Cloudflare's
   own simplest "Create" flow (name, then configure). */
export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return;
    onCreate(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Give your project a name. You can add services after it's created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="new-project-name" className="text-zinc-900 dark:text-zinc-100">
              Project Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="new-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. web-frontend"
              className="mt-2"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={!trimmed} className="h-9 text-sm">
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* Reached from the sidebar switcher's own "⋯" per-row action — just
   renaming today, same single-field shape as Create, rather than a
   bigger settings surface this app doesn't have anything else to put
   on yet. */
export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange,
  onRename,
  onDelete,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  useEffect(() => {
    if (open && project) setName(project.name);
  }, [open, project]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!project || !trimmed) return;
    onRename(project.id, trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Rename this project, or remove it entirely.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="project-settings-name" className="text-zinc-900 dark:text-zinc-100">
              Project Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="project-settings-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter className="items-center gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => project && onDelete(project.id)}
              className="h-9 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Delete Project
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-9 text-sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="brand"
                disabled={!trimmed || trimmed === project?.name}
                className="h-9 text-sm"
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
