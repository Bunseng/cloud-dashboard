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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ *
 * Database instance dialogs — follows DigitalOcean's cluster Settings
 * flow (resize, trusted sources, danger zone), trimmed to the fields
 * our instance model already has. Creating a whole new database is
 * still a new subscription (Planning page) — unchanged, per the
 * existing multi-subscription model; these dialogs manage one that
 * already exists.
 * ------------------------------------------------------------------ */

export const DATABASE_RESOURCE_PRESETS = [
  { label: "2 Core / 4 GB / 60 GB", cpu: "2 Core", memory: "4 GB", storage: "60 GB" },
  { label: "4 Core / 8 GB / 120 GB", cpu: "4 Core", memory: "8 GB", storage: "120 GB" },
  { label: "8 Core / 16 GB / 240 GB", cpu: "8 Core", memory: "16 GB", storage: "240 GB" },
];

export function EditDatabaseDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: {
    engine: { language: string; version: string };
    resource: { cpu: string; memory: string; storage: string };
    cluster: string;
  };
  onSave: (next: {
    engine: { language: string; version: string };
    resource: { cpu: string; memory: string; storage: string };
    cluster: string;
  }) => void;
}) {
  const [version, setVersion] = useState(value.engine.version);
  const [presetLabel, setPresetLabel] = useState(
    DATABASE_RESOURCE_PRESETS.find(
      (p) =>
        p.cpu === value.resource.cpu &&
        p.memory === value.resource.memory &&
        p.storage === value.resource.storage
    )?.label ?? DATABASE_RESOURCE_PRESETS[0].label
  );
  const [cluster, setCluster] = useState(value.cluster);

  // Re-seed from the current value each time the dialog opens.
  useEffect(() => {
    if (open) {
      setVersion(value.engine.version);
      setCluster(value.cluster);
      setPresetLabel(
        DATABASE_RESOURCE_PRESETS.find(
          (p) =>
            p.cpu === value.resource.cpu &&
            p.memory === value.resource.memory &&
            p.storage === value.resource.storage
        )?.label ?? DATABASE_RESOURCE_PRESETS[0].label
      );
    }
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Database</DialogTitle>
          <DialogDescription>
            Resize this instance or update its cluster. Larger sizes take effect after a brief restart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-db-version" className="text-zinc-900 dark:text-zinc-100">
              {value.engine.language} Version
            </Label>
            <Input
              id="edit-db-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Resource Size</Label>
            <Select value={presetLabel} onValueChange={setPresetLabel}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_RESOURCE_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-db-cluster" className="text-zinc-900 dark:text-zinc-100">
              Cluster Nodes
            </Label>
            <Select value={cluster} onValueChange={setCluster}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="brand"
            onClick={() => {
              const preset =
                DATABASE_RESOURCE_PRESETS.find((p) => p.label === presetLabel) ??
                DATABASE_RESOURCE_PRESETS[0];
              onSave({
                engine: { language: value.engine.language, version: version.trim() || value.engine.version },
                resource: { cpu: preset.cpu, memory: preset.memory, storage: preset.storage },
                cluster,
              });
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Trusted Sources — the IP/CIDR allow-list gating external connections,
   same idea DO uses on its cluster's Settings tab. */
export function AddIpWhitelistDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return;
    onAdd(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add Trusted Source</DialogTitle>
          <DialogDescription>
            Allow an IP address or CIDR range to reach this database from outside Cloud+.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="new-ip" className="text-zinc-900 dark:text-zinc-100">
              IP Address / CIDR<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="new-ip"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="203.0.113.4/32"
              className="mt-2 font-mono text-[13px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={!trimmed} className="h-9 text-sm">
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
