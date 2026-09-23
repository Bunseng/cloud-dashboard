import { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ *
 * VPS instance dialogs — rename + reinstall OS. Resizing CPU/RAM/
 * Storage is a plan change, not a settings edit, so it goes through the
 * Subscribe flow's "Change Plan" step instead of living here.
 * ------------------------------------------------------------------ */

export const VPS_OS_OPTIONS = [
  "Ubuntu 24.04 LTS",
  "Ubuntu 22.04 LTS",
  "Debian 12",
  "AlmaLinux 9",
  "Windows Server 2022",
] as const;

export function EditVpsDialog({
  open,
  onOpenChange,
  hostname,
  os,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostname: string;
  os: string;
  onSave: (next: { hostname: string; os: string; reinstalled: boolean }) => void;
}) {
  const [nextHostname, setNextHostname] = useState(hostname);
  const [nextOs, setNextOs] = useState(os);

  useEffect(() => {
    if (open) {
      setNextHostname(hostname);
      setNextOs(os);
    }
  }, [open, hostname, os]);

  const reinstalling = nextOs !== os;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit VPS</DialogTitle>
          <DialogDescription>
            Rename this server or reinstall its operating system. Reinstalling erases the disk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-vps-hostname" className="text-zinc-900 dark:text-zinc-100">
              Hostname
            </Label>
            <Input
              id="edit-vps-hostname"
              value={nextHostname}
              onChange={(e) => setNextHostname(e.target.value)}
              className="mt-2 font-mono text-[13px]"
            />
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Operating System</Label>
            <Select value={nextOs} onValueChange={setNextOs}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VPS_OS_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reinstalling && (
              <p className="mt-2 text-[12.5px] text-red-600 dark:text-red-400">
                Changing the OS reinstalls the server and erases all data on disk.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={reinstalling ? "destructive" : "brand"}
            onClick={() => {
              onSave({
                hostname: nextHostname.trim() || hostname,
                os: nextOs,
                reinstalled: reinstalling,
              });
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            {reinstalling ? "Save & Reinstall" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * Create Snapshot — picks which instance to image and names the
 * snapshot (defaulting to a timestamp-ish placeholder); the resulting
 * size/date are made up by the caller since there's no real disk to
 * image here.
 * ------------------------------------------------------------------ */

export function CreateSnapshotDialog({
  open,
  onOpenChange,
  instances,
  defaultInstance,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instances: string[];
  defaultInstance?: string;
  onCreate: (data: { name: string; instanceName: string }) => void;
}) {
  const [instanceName, setInstanceName] = useState(defaultInstance ?? instances[0] ?? "");
  const [name, setName] = useState(`${instanceName}-snapshot`);

  useEffect(() => {
    if (open) {
      const initialInstance = defaultInstance ?? instances[0] ?? "";
      setInstanceName(initialInstance);
      setName(`${initialInstance}-snapshot`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create Snapshot</DialogTitle>
          <DialogDescription>
            Captures a full image of a server's disk right now. You can restore a new VPS from it
            later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {instances.length > 1 && (
            <div>
              <Label className="text-zinc-900 dark:text-zinc-100">Instance</Label>
              <Select value={instanceName} onValueChange={setInstanceName}>
                <SelectTrigger className="mt-2 h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="snapshot-name" className="text-zinc-900 dark:text-zinc-100">
              Snapshot Name
            </Label>
            <Input
              id="snapshot-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
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
            disabled={!name.trim() || !instanceName}
            onClick={() => {
              onCreate({ name: name.trim(), instanceName });
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            Create Snapshot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * SSH Key Management — paste a public key (name + the key text) to
 * authorize it for root login on this server.
 * ------------------------------------------------------------------ */

export function AddSshKeyDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: { name: string; publicKey: string }) => void;
}) {
  const [name, setName] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setPublicKey("");
    }
  }, [open]);

  const valid = name.trim().length > 0 && publicKey.trim().startsWith("ssh-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add SSH Key</DialogTitle>
          <DialogDescription>
            Paste a public key to authorize it for root login on this server — never share the
            matching private key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ssh-key-name" className="text-zinc-900 dark:text-zinc-100">
              Key Name
            </Label>
            <Input
              id="ssh-key-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-laptop"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="ssh-key-value" className="text-zinc-900 dark:text-zinc-100">
              Public Key
            </Label>
            <Textarea
              id="ssh-key-value"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... you@laptop"
              rows={4}
              className="mt-2 font-mono text-[12.5px]"
            />
            {publicKey.trim().length > 0 && !publicKey.trim().startsWith("ssh-") && (
              <p className="mt-1.5 text-xs text-red-500">
                Public keys start with "ssh-" (e.g. ssh-ed25519, ssh-rsa).
              </p>
            )}
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
            disabled={!valid}
            onClick={() => {
              onAdd({ name: name.trim(), publicKey: publicKey.trim() });
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            Add Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
