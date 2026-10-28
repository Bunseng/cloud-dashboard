import { useState, type FormEvent } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DEFAULT_PERMISSIONS,
  PERMISSION_LEVELS,
  PERMISSION_RESOURCES,
  type GroupPermissions,
  type PermissionLevel,
} from "../../data/groups";
import { PROJECTS } from "../../data/projects";

const BILLING_RESOURCE = PERMISSION_RESOURCES.find((r) => r.key === "billing")!;
const PROJECT_RESOURCES = PERMISSION_RESOURCES.filter((r) => r.key !== "billing");

/* Creating a Group asks for a name plus its starting access — pick a
   project and grant the services it actually has, same shape as the
   Group's own Permission tab, so you don't have to immediately reopen
   the group just to set what it was for in the first place. Members
   are still invited afterwards, from the Group's own detail page. */
export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    name: string,
    permissions: GroupPermissions,
    projectPermissions: Record<string, GroupPermissions>
  ) => void;
}) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(PROJECTS[0]?.id ?? "");
  const [billing, setBilling] = useState<PermissionLevel>("No Access");
  const [projectPerms, setProjectPerms] = useState<GroupPermissions>({ ...DEFAULT_PERMISSIONS });
  const trimmed = name.trim();
  const project = PROJECTS.find((p) => p.id === projectId);
  const availableResources = PROJECT_RESOURCES.filter((r) => project?.services.includes(r.key));

  function reset() {
    setName("");
    setProjectId(PROJECTS[0]?.id ?? "");
    setBilling("No Access");
    setProjectPerms({ ...DEFAULT_PERMISSIONS });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return;
    onCreate(
      trimmed,
      { ...DEFAULT_PERMISSIONS, billing },
      projectId ? { [projectId]: { ...projectPerms } } : {}
    );
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Name it, then grant it access to a project's services — you can
            change this or add more projects later from the group's own
            Permission tab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="new-group-name" className="text-zinc-900 dark:text-zinc-100">
              Group Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="new-group-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DevOps Team"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Project</Label>
            <Select
              value={projectId}
              onValueChange={(v) => {
                setProjectId(v);
                setProjectPerms({ ...DEFAULT_PERMISSIONS });
              }}
            >
              <SelectTrigger className="mt-2 h-9 w-full text-[13px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {PROJECTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableResources.length > 0 && (
            <div className="rounded-lg border border-zinc-200 px-3 dark:border-zinc-800">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {availableResources.map((resource) => (
                  <div key={resource.key} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {resource.label}
                    </p>
                    <Select
                      value={projectPerms[resource.key]}
                      onValueChange={(v) =>
                        setProjectPerms((prev) => ({ ...prev, [resource.key]: v as PermissionLevel }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px] shrink-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {BILLING_RESOURCE.label}
              </p>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Account-level, not tied to a project.</p>
            </div>
            <Select value={billing} onValueChange={(v) => setBilling(v as PermissionLevel)}>
              <SelectTrigger className="h-8 w-[140px] shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={!trimmed} className="h-9 text-sm">
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
