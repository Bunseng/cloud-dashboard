import { useMemo, useState } from "react";
import { Globe, Lock } from "lucide-react";

import { Plus } from "@/components/animate-ui/icons/plus";
import { Server } from "@/components/animate-ui/icons/server";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CopyIconButton } from "../../components/atoms";
import { VPS_INSTANCES } from "./VpsInstanceDetailPage";

/* ------------------------------------------------------------------ *
 * VPS → IP Address — the account's addresses, one level up from any
 * single server, the same way SSH Keys and Snapshots sit beside
 * Instances rather than inside one.
 *
 * An address here is only useful in relation to a server, so every
 * view is framed that way: each row says which instance holds it (and
 * links straight to it), an unassigned address is called out as idle
 * rather than shown as a blank cell, and adding one offers to attach
 * it on the spot.
 * ------------------------------------------------------------------ */

export type IpKind = "public" | "private";

export interface VpsIpAddress {
  id: string;
  address: string;
  kind: IpKind;
  /** Instance name, or undefined when the address is held but idle. */
  assignedTo?: string;
  /** The address the server was provisioned with — it can't be detached. */
  primary?: boolean;
  label?: string;
  addedOn: string;
}

const INSTANCE_NAMES = Object.keys(VPS_INSTANCES);

/* Seeded from the instances themselves, so what this page lists is
   exactly what each server's Network & Access card already shows —
   the two can't drift apart. */
export const VPS_IP_ADDRESSES: VpsIpAddress[] = INSTANCE_NAMES.flatMap((name, i) => {
  const inst = VPS_INSTANCES[name];
  return [
    {
      id: `ip-public-${i + 1}`,
      address: inst.network.publicIp,
      kind: "public" as const,
      assignedTo: name,
      primary: true,
      label: `${name} primary`,
      addedOn: "Nov 2, 2026",
    },
    {
      id: `ip-private-${i + 1}`,
      address: inst.network.privateIp,
      kind: "private" as const,
      assignedTo: name,
      primary: true,
      label: `${name} private`,
      addedOn: "Nov 2, 2026",
    },
  ];
});

let ipSeq = VPS_IP_ADDRESSES.length;

export function addVpsIpAddress(ip: Omit<VpsIpAddress, "id" | "addedOn">): VpsIpAddress {
  ipSeq += 1;
  const created: VpsIpAddress = { ...ip, id: `ip-${ipSeq}`, addedOn: "Today" };
  VPS_IP_ADDRESSES.push(created);
  return created;
}

export function removeVpsIpAddress(id: string) {
  const i = VPS_IP_ADDRESSES.findIndex((ip) => ip.id === id);
  if (i >= 0) VPS_IP_ADDRESSES.splice(i, 1);
}

export function assignVpsIpAddress(id: string, instance?: string) {
  const ip = VPS_IP_ADDRESSES.find((x) => x.id === id);
  if (ip) ip.assignedTo = instance;
}

/* Four dotted octets, each 0–255 — enough to catch a typo without
   pretending to be a full validator. */
function isIpv4(value: string): boolean {
  const parts = value.trim().split(".");
  return (
    parts.length === 4 &&
    parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
  );
}

// 10/8, 172.16/12 and 192.168/16 — the ranges that can't be routed on
// the public internet, so they belong to a private network, not a
// public address.
function isPrivateRange(value: string): boolean {
  const [a, b] = value.split(".").map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function KindBadge({ kind }: { kind: IpKind }) {
  const isPublic = kind === "public";
  const Icon = isPublic ? Globe : Lock;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium " +
        (isPublic
          ? "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")
      }
    >
      <Icon className="h-3 w-3" />
      {isPublic ? "Public IPv4" : "Private"}
    </span>
  );
}

function AddIpDialog({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: VpsIpAddress[];
  onAdd: (ip: Omit<VpsIpAddress, "id" | "addedOn">) => void;
}) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("none");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAddress("");
    setLabel("");
    setAssignedTo("none");
    setError(null);
  }

  function submit() {
    const value = address.trim();
    if (!isIpv4(value)) {
      setError("That doesn't look like an IPv4 address — four numbers, like 203.0.113.24.");
      return;
    }
    if (existing.some((ip) => ip.address === value)) {
      setError("That address is already on your account.");
      return;
    }
    onAdd({
      address: value,
      kind: isPrivateRange(value) ? "private" : "public",
      label: label.trim() || undefined,
      assignedTo: assignedTo === "none" ? undefined : assignedTo,
    });
    reset();
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
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add IP Address</DialogTitle>
          <DialogDescription>
            Bring an address you already own. Attach it to one of your servers now, or leave it
            unassigned and attach it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ip-address">IP address</Label>
            <Input
              id="ip-address"
              autoFocus
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="203.0.113.24"
              className="mt-2 font-mono"
            />
            {error ? (
              <p className="mt-1.5 text-xs text-red-500">{error}</p>
            ) : (
              <p className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                Addresses in 10.x, 172.16–31.x and 192.168.x are added as private — everything else
                is treated as public.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="ip-label">Label (optional)</Label>
            <Input
              id="ip-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Office gateway"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Attach to a server</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Leave unassigned</SelectItem>
                {INSTANCE_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
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
            disabled={address.trim().length === 0}
            onClick={submit}
            className="h-9 text-sm"
          >
            Add IP Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VpsIpAddressesPage({
  onOpenInstance,
}: {
  onOpenInstance: (instanceName: string) => void;
}) {
  const [ips, setIps] = useState<VpsIpAddress[]>(() => [...VPS_IP_ADDRESSES]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VpsIpAddress | null>(null);

  const counts = useMemo(
    () => ({
      total: ips.length,
      assigned: ips.filter((ip) => ip.assignedTo).length,
      idle: ips.filter((ip) => !ip.assignedTo).length,
    }),
    [ips]
  );

  function setAssignment(id: string, instance?: string) {
    assignVpsIpAddress(id, instance);
    setIps((prev) => prev.map((ip) => (ip.id === id ? { ...ip, assignedTo: instance } : ip)));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            IP Address
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Every address on your account and which server holds it. Add your own address here, then
            attach it to any of your VPS instances.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => setAddOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Plus className="h-4 w-4" animateOnHover animateOnTap />
          Add IP Address
        </Button>
      </div>

      {/* The three numbers worth knowing before scanning the table —
          most of all whether anything is sitting idle. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Addresses", value: `${counts.total}`, hint: "on this account" },
          { label: "Attached", value: `${counts.assigned}`, hint: "in use by a server" },
          {
            label: "Unassigned",
            value: `${counts.idle}`,
            hint: counts.idle > 0 ? "not reaching anything yet" : "nothing idle",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#e5e7eb] p-4 dark:border-zinc-800"
          >
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className="mt-1 text-[22px] font-bold leading-none text-zinc-900 dark:text-zinc-50">
              {s.value}
            </p>
            <p className="mt-1.5 text-[12px] text-zinc-400 dark:text-zinc-500">{s.hint}</p>
          </div>
        ))}
      </div>

      <Card className={ips.length > 0 ? "mt-5 p-0" : "mt-5"}>
        {ips.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Attached to</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ips.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                        {ip.address}
                      </span>
                      {ip.primary && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Primary
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={ip.kind} />
                  </TableCell>
                  <TableCell>
                    {ip.assignedTo ? (
                      <button
                        type="button"
                        onClick={() => onOpenInstance(ip.assignedTo!)}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                      >
                        <Server className="h-3.5 w-3.5" animateOnHover />
                        {ip.assignedTo}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[13px] text-amber-600 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-500 dark:text-zinc-400">
                    {ip.label ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {ip.addedOn}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* A provisioned server's own address can't be moved
                          or removed — only the ones you added. */}
                      {!ip.primary && (
                        <Select
                          value={ip.assignedTo ?? "none"}
                          onValueChange={(v) => setAssignment(ip.id, v === "none" ? undefined : v)}
                        >
                          <SelectTrigger
                            aria-label={`Attach ${ip.address}`}
                            className="h-8 w-[168px] text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {INSTANCE_NAMES.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <CopyIconButton value={ip.address} label={ip.address} />
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={ip.primary}
                        aria-label={`Remove ${ip.address}`}
                        onClick={() => setDeleteTarget(ip)}
                        className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Globe className="h-5 w-5 text-zinc-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                No IP addresses yet
              </p>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                Add one to point it at a server.
              </p>
            </div>
            <Button variant="brand" onClick={() => setAddOpen(true)} className="mt-1 h-9 text-sm">
              Add IP Address
            </Button>
          </div>
        )}
      </Card>

      <AddIpDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existing={ips}
        onAdd={(ip) => setIps((prev) => [...prev, addVpsIpAddress(ip)])}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Remove ${deleteTarget.address}?` : "Remove IP address?"}
        description="Anything pointing at this address stops reaching your server once it's removed."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            removeVpsIpAddress(deleteTarget.id);
            setIps((prev) => prev.filter((ip) => ip.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
