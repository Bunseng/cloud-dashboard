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
