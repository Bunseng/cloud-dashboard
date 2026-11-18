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
 * One public IPv4 comes with every server and can't be detached — so
 * the list has exactly one included row per instance, and this page is
 * where you buy any address beyond that. An address is only useful in
 * relation to a server, so each row says which instance holds it (and
 * links straight to it), and an idle one is called out rather than
 * left as a blank cell.
 * ------------------------------------------------------------------ */

/** Included with the server, or bought on top of it. */
export type IpKind = "included" | "extra";

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

/** What one extra address costs per month, on top of the included one. */
export const EXTRA_IP_PRICE_KHR = 8_000;

/* Seeded from the instances themselves, so what this page lists is
   exactly what each server's Network & Access card already shows —
   the two can't drift apart. One row per server: its own IPv4. */
export const VPS_IP_ADDRESSES: VpsIpAddress[] = INSTANCE_NAMES.map((name, i) => ({
  id: `ip-included-${i + 1}`,
  address: VPS_INSTANCES[name].network.publicIp,
  kind: "included" as const,
  assignedTo: name,
  primary: true,
  label: `${name} primary`,
  addedOn: "Nov 2, 2026",
}));

let ipSeq = VPS_IP_ADDRESSES.length;

/* Addresses aren't typed in — they're allocated out of the pool when
   you buy one, the same way a server's own address is. */
function nextPoolAddress(): string {
  let n = 40 + ipSeq;
  while (VPS_IP_ADDRESSES.some((ip) => ip.address === `203.0.113.${n}`)) n += 1;
  return `203.0.113.${n}`;
}

export function buyVpsIpAddress(
  details: Pick<VpsIpAddress, "assignedTo" | "label">
): VpsIpAddress {
  ipSeq += 1;
  const created: VpsIpAddress = {
    ...details,
    id: `ip-${ipSeq}`,
    address: nextPoolAddress(),
    kind: "extra",
    addedOn: "Today",
  };
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

function KindBadge({ kind }: { kind: IpKind }) {
  const included = kind === "included";
  const Icon = included ? Lock : Globe;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium " +
        (included
          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          : "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]")
      }
    >
      <Icon className="h-3 w-3" />
      {included ? "Included" : "Extra"}
    </span>
  );
}

function BuyIpDialog({
  open,
  onOpenChange,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (details: Pick<VpsIpAddress, "assignedTo" | "label">) => void;
}) {
  const [label, setLabel] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("none");

  function reset() {
    setLabel("");
    setAssignedTo("none");
  }

  function submit() {
    onBuy({
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
          <DialogTitle>Buy an IP address</DialogTitle>
          <DialogDescription>
            Every server already comes with one IPv4. Buy another when a server needs a second
            address — for a separate site, or an SSL certificate of its own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nothing to type: the address is allocated on purchase, the
              same way a server's own address is. */}
          <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#1C75BC] dark:text-[#6FA8D8]" />
            <p className="text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              The address is picked from our pool and shown here as soon as it&apos;s ready — you
              don&apos;t need to supply one.
            </p>
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
            <p className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
              You can move it to a different server at any time.
            </p>
          </div>

          <div>
            <Label htmlFor="ip-label">Label (optional)</Label>
            <Input
              id="ip-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="shop.example.com"
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#1C75BC]/30 bg-[#EFF6FF]/60 px-3 py-2.5 dark:border-[#6FA8D8]/30 dark:bg-zinc-900">
            <span className="text-[13px] text-zinc-600 dark:text-zinc-300">
              One extra IPv4 address
            </span>
            <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
              {EXTRA_IP_PRICE_KHR.toLocaleString()} KHR / month
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="brand" onClick={submit} className="h-9 text-sm">
            Buy for {EXTRA_IP_PRICE_KHR.toLocaleString()} KHR
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
  const [buyOpen, setBuyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VpsIpAddress | null>(null);

  const counts = useMemo(() => {
    const extra = ips.filter((ip) => ip.kind === "extra");
    return {
      total: ips.length,
      included: ips.length - extra.length,
      extra: extra.length,
      idle: ips.filter((ip) => !ip.assignedTo).length,
    };
  }, [ips]);

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
            Every address on your account and which server holds it. Each VPS comes with one IPv4 —
            buy another here when a server needs more.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => setBuyOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Plus className="h-4 w-4" animateOnHover animateOnTap />
          Buy IP Address
        </Button>
      </div>

      {/* The three numbers worth knowing before scanning the table —
          what comes with the servers, what's being paid for on top, and
          whether any of it is sitting idle. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Addresses", value: `${counts.total}`, hint: "on this account" },
          {
            label: "Included",
            value: `${counts.included}`,
            hint: "one per server, free",
          },
          {
            label: "Extra",
            value: `${counts.extra}`,
            hint:
              counts.idle > 0
                ? `${counts.idle} not attached to a server`
                : `${EXTRA_IP_PRICE_KHR.toLocaleString()} KHR each / month`,
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
                      {ip.primary ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Primary
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-[11.5px] text-zinc-400 dark:text-zinc-500">
                          {EXTRA_IP_PRICE_KHR.toLocaleString()} KHR / mo
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
                Create a server and its IPv4 shows up here, or buy one on its own.
              </p>
            </div>
            <Button variant="brand" onClick={() => setBuyOpen(true)} className="mt-1 h-9 text-sm">
              Buy IP Address
            </Button>
          </div>
        )}
      </Card>

      <BuyIpDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        onBuy={(details) => setIps((prev) => [...prev, buyVpsIpAddress(details)])}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Remove ${deleteTarget.address}?` : "Remove IP address?"}
        description="Anything pointing at this address stops reaching your server once it's removed, and you stop being charged for it."
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
