import { useEffect, useState, type ReactNode } from "react";

import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { CopyIconButton, StatusBadge } from "../../components/atoms";
import type { Snapshot } from "./VpsSnapshotContext";

/* ------------------------------------------------------------------ *
 * VPS instance dialogs — rename + reinstall OS. Resizing CPU/RAM/
 * Storage is a plan change, not a settings edit, so it goes through the
 * Subscribe flow's "Change Plan" step instead of living here.
 * ------------------------------------------------------------------ */

// Grouped by family so Create VPS can offer a version per OS instead of
// one flat list; EditVpsDialog still just needs the flattened strings.
export const VPS_OS_FAMILIES: { family: string; versions: string[] }[] = [
  { family: "Ubuntu", versions: ["24.04 LTS", "22.04 LTS", "20.04 LTS"] },
  { family: "Debian", versions: ["12", "11"] },
  { family: "AlmaLinux", versions: ["9", "8"] },
  { family: "Windows Server", versions: ["2022", "2019"] },
];

/* SSH Keys — account-level, not per-instance, so a key added on one
   server shows up as a reusable option the next time you create or
   edit another one. Module-level mutable array, same "no backend"
   convention as data/paymentMethods.ts's SAVED_CARDS. */
export interface VpsSshKey {
  id: string;
  name: string;
  publicKey: string;
}

let nextSshKeyId = 1;
function makeSshKeyId() {
  return `sshkey-${Date.now()}-${nextSshKeyId++}`;
}

export const VPS_SSH_KEYS: VpsSshKey[] = [
  {
    id: "sshkey-seed",
    name: "admin-laptop",
    publicKey:
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGx3z2s9c1r3f0a1v2b3n4m5q6w7e8r9t0y1u2i3o4p",
  },
];

export function addVpsSshKey(key: { name: string; publicKey: string }): VpsSshKey {
  const saved: VpsSshKey = { ...key, id: makeSshKeyId() };
  VPS_SSH_KEYS.push(saved);
  return saved;
}

export function updateVpsSshKey(id: string, patch: { name: string; publicKey: string }) {
  const key = VPS_SSH_KEYS.find((k) => k.id === id);
  if (key) {
    key.name = patch.name;
    key.publicKey = patch.publicKey;
  }
}

export function deleteVpsSshKey(id: string) {
  const i = VPS_SSH_KEYS.findIndex((k) => k.id === id);
  if (i !== -1) VPS_SSH_KEYS.splice(i, 1);
}

export const VPS_OS_OPTIONS = VPS_OS_FAMILIES.flatMap((f) =>
  f.versions.map((v) => `${f.family} ${v}`)
);

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
 * Create Snapshot — unlike Database's Backup (fully automatic on
 * subscribe), a Snapshot is a deliberate capture the user asks for:
 * subscribing to a Snapshot plan just unlocks the ability to take one,
 * it doesn't take one for you. Names it (defaulting to a sensible
 * placeholder); the instance picker only shows up when there's more
 * than one to choose from (the per-instance Snapshot List page passes
 * a single-item list, so it's implied and hidden there; the global
 * sidebar page passes every *subscribed* instance, since only those
 * can actually take a snapshot).
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
            Captures a full image of a server's disk right now. You can restore this server from
            it later.
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

/* File Name / Date and Time / Size — the same summary of exactly which
   snapshot is in question, shown both in Snapshot History and in the
   Restore confirmation, so either dialog answers "which one is this?"
   without needing to close it and go check the table row. */
export function SnapshotInfoSummary({
  snapshot,
}: {
  snapshot: { name: string; createdOn: string; size: string };
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-zinc-200 p-3 text-[13px] dark:border-zinc-800">
      <div className="col-span-2">
        <dt className="text-zinc-500 dark:text-zinc-400">File Name</dt>
        <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{snapshot.name}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Date and Time</dt>
        <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{snapshot.createdOn}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Size</dt>
        <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{snapshot.size}</dd>
      </div>
    </dl>
  );
}

/* Snapshot history — every action ever taken against this snapshot (the
   automated Snapshot that produced it, any later Restore), each with
   its own Action Type/Status/timing — read-only, since these are a
   record of what already happened. */
export function SnapshotHistoryDialog({
  open,
  onOpenChange,
  snapshot,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: Snapshot | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Snapshot History</DialogTitle>
        </DialogHeader>

        {snapshot && <SnapshotInfoSummary snapshot={snapshot} />}

        {snapshot && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                    <TableHead>Action Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Initialized At</TableHead>
                    <TableHead>Finished At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                        {entry.actionType}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={entry.status}
                          tone={entry.status === "Success" ? "green" : "red"}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                        {entry.initializedAt}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                        {entry.finishedAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * SSH Key Management — paste a public key (name + the key text) to
 * authorize it for root login on this server.
 * ------------------------------------------------------------------ */

function SshKeyStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
        Step {number}: {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SshCommandBox({ command }: { command: string }) {
  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[12.5px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <span className="truncate">{command}</span>
      <CopyIconButton value={command} label="command" iconClassName="h-3.5 w-3.5" />
    </div>
  );
}

function CopyPublicKeyStep() {
  return (
    <ol className="list-decimal space-y-1.5 pl-4 text-zinc-600 dark:text-zinc-400">
      <li>
        Run this command to copy your public key to clipboard:
        <SshCommandBox command="pbcopy < ~/.ssh/id_ed25519.pub" />
        <p className="mt-1.5 text-[12px] text-zinc-400 dark:text-zinc-500">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Note:</span> If you used
          a custom filename or location in Step 1, replace id_ed25519.pub with your filename.
        </p>
      </li>
    </ol>
  );
}

function UsePublicKeyStep() {
  return (
    <ol className="list-decimal space-y-1.5 pl-4 text-zinc-600 dark:text-zinc-400">
      <li>
        Paste the key into the Public Key field above using{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Cmd+V</span> or
        right-click → Paste.
      </li>
      <li>The key is now ready to use! 🎉</li>
    </ol>
  );
}

/* Collapsed by default — a help panel, not something every visit needs
   open; two tabs since "I already have a key" and "I need to make one"
   are different journeys that happen to end the same way (paste it into
   the Public Key field above). */
function SshKeyHelpInstructions() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "existing">("existing");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]">
        How do I get my SSH key?
        <ChevronDown
          className={"h-3.5 w-3.5 transition-transform " + (open ? "rotate-180" : "")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "new" | "existing")} className="mt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Add a new key</TabsTrigger>
            <TabsTrigger value="existing">Copy an existing key</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-3 space-y-4 text-sm">
            <SshKeyStep number={1} title="Generate an SSH Key">
              <ol className="list-decimal space-y-2 pl-4 text-zinc-600 dark:text-zinc-400">
                <li>
                  Open your <span className="font-medium text-zinc-700 dark:text-zinc-300">Terminal</span>
                </li>
                <li>
                  Run this command
                  <SshCommandBox command="ssh-keygen" />
                </li>
                <li>
                  Follow the prompts
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-zinc-500 dark:text-zinc-400">
                    <li>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Enter file in which to save the key:
                      </span>{" "}
                      Press Enter to use the default filename and location
                    </li>
                    <li>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Passphrase:
                      </span>{" "}
                      Enter a strong password (highly recommended for security)
                    </li>
                  </ul>
                </li>
              </ol>
            </SshKeyStep>
            <SshKeyStep number={2} title="Copy Your Public Key">
              <CopyPublicKeyStep />
            </SshKeyStep>
            <SshKeyStep number={3} title="Use Your Public Key">
              <UsePublicKeyStep />
            </SshKeyStep>
          </TabsContent>

          <TabsContent value="existing" className="mt-3 space-y-4 text-sm">
            <SshKeyStep number={1} title="Copy Your Public Key">
              <CopyPublicKeyStep />
            </SshKeyStep>
            <SshKeyStep number={2} title="Use Your Public Key">
              <UsePublicKeyStep />
            </SshKeyStep>
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}

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

          <SshKeyHelpInstructions />
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

/* Create VPS's own "Add" for the SSH Keys list (same shape as Database's
   "Add Trusted Source" for IP Whitelist) — but an SSH key, unlike an IP,
   is an account-level thing you've probably already saved, so this one
   dialog covers three things: pick any key not already on the server
   from a dropdown, create a brand new one, or edit/delete a saved key's
   actual name and public key, all without leaving the flow. Picking a
   key here only attaches it to this server ("Add to Server") — clearing
   it from a server's own list (the "X" on Create VPS's SSH Keys card)
   just detaches it there, it doesn't touch the saved key itself; editing
   or deleting the saved key is done right here, from the dropdown. */
export function SelectSshKeyDialog({
  open,
  onOpenChange,
  availableKeys,
  onSelectExisting,
  onCreateNew,
  onUpdateExisting,
  onDeleteExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableKeys: VpsSshKey[];
  onSelectExisting: (id: string) => void;
  onCreateNew: (key: { name: string; publicKey: string }) => void;
  onUpdateExisting: (id: string, key: { name: string; publicKey: string }) => void;
  onDeleteExisting: (id: string) => void;
}) {
  const [mode, setMode] = useState<"browse" | "create" | "edit">("browse");
  const [selectedId, setSelectedId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    if (open) {
      setMode(availableKeys.length > 0 ? "browse" : "create");
      setSelectedId(availableKeys[0]?.id ?? "");
      setEditingId(null);
      setName("");
      setPublicKey("");
    }
    // Only reset when the dialog opens, not on every availableKeys change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedKey = availableKeys.find((k) => k.id === selectedId);
  const newKeyValid = name.trim().length > 0 && publicKey.trim().startsWith("ssh-");

  function startEdit(key: VpsSshKey) {
    setEditingId(key.id);
    setName(key.name);
    setPublicKey(key.publicKey);
    setMode("edit");
  }

  function startCreate() {
    setName("");
    setPublicKey("");
    setMode("create");
  }

  function backToBrowse() {
    setMode("browse");
    setEditingId(null);
  }

  function deleteKey(id: string) {
    onDeleteExisting(id);
    if (selectedId === id) setSelectedId("");
  }

  function submit() {
    if (mode === "create") {
      if (!newKeyValid) return;
      onCreateNew({ name: name.trim(), publicKey: publicKey.trim() });
      onOpenChange(false);
    } else if (mode === "edit") {
      if (!newKeyValid || !editingId) return;
      onUpdateExisting(editingId, { name: name.trim(), publicKey: publicKey.trim() });
      backToBrowse();
    } else {
      if (!selectedKey) return;
      onSelectExisting(selectedKey.id);
      onOpenChange(false);
    }
  }

  const valid = mode === "browse" ? Boolean(selectedKey) : newKeyValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit SSH Key" : mode === "create" ? "Create SSH Key" : "Add SSH Key"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update this saved key's name or public key."
              : "Authorize a saved key for root login, edit or delete one, or create a new one."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "browse" && (
            <div>
              <Label className="text-zinc-900 dark:text-zinc-100">SSH Key</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mt-2 flex h-9 w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span className="truncate text-left">
                      {selectedKey ? selectedKey.name : "Select a saved key"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  {availableKeys.map((k) => (
                    <DropdownMenuItem
                      key={k.id}
                      onSelect={(e) => {
                        if ((e.target as HTMLElement).closest("[data-ssh-key-action]")) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedId(k.id);
                      }}
                      className={
                        "flex items-center gap-2 rounded-md py-1.5 " +
                        (k.id === selectedId ? "bg-[#EFF6FF] dark:bg-zinc-800" : "")
                      }
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-zinc-900 dark:text-zinc-100">
                          {k.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                          {k.publicKey}
                        </span>
                      </span>
                      <button
                        type="button"
                        data-ssh-key-action
                        aria-label={`Edit ${k.name}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(k);
                        }}
                        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </button>
                      <button
                        type="button"
                        data-ssh-key-action
                        aria-label={`Delete ${k.name}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteKey(k.id);
                        }}
                        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  {availableKeys.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={startCreate}
                    className="gap-2 text-[#1C75BC] focus:bg-[#EFF6FF] focus:text-[#1C75BC] dark:text-[#6FA8D8] dark:focus:bg-zinc-800 dark:focus:text-[#6FA8D8]"
                  >
                    + Create New SSH Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {availableKeys.length === 0 && (
                <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  No saved keys available — create one below.
                </p>
              )}
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <>
              <div>
                <Label htmlFor="ssh-key-dialog-name" className="text-zinc-900 dark:text-zinc-100">
                  Key Name
                </Label>
                <Input
                  id="ssh-key-dialog-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-laptop"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="ssh-key-dialog-value" className="text-zinc-900 dark:text-zinc-100">
                  Public Key
                </Label>
                <Textarea
                  id="ssh-key-dialog-value"
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

              <SshKeyHelpInstructions />
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === "edit" || (mode === "create" && availableKeys.length > 0) ? (
            <Button type="button" variant="outline" onClick={backToBrowse} className="h-9 text-sm">
              Cancel
            </Button>
          ) : (
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
          )}
          <Button type="button" variant="brand" disabled={!valid} onClick={submit} className="h-9 text-sm">
            {mode === "edit" ? "Save Changes" : mode === "create" ? "Add Key" : "Add to Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
