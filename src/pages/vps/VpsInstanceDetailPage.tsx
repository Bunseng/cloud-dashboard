import { useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Play } from "@/components/animate-ui/icons/play";
import { Plus } from "@/components/animate-ui/icons/plus";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Square } from "@/components/animate-ui/icons/square";
import { Terminal } from "@/components/animate-ui/icons/terminal";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  ConnectionRow,
  StatTile,
  StatusBadge,
  UsageBar,
} from "../../components/atoms";
import { PLACEHOLDER_SUBSCRIPTION_COUNT } from "../../data/billing";
import { AddRunCommandDialog, EditVpsDialog } from "./VpsDialogs";

/* ------------------------------------------------------------------ *
 * VPS instance detail — one full root-access server per subscription,
 * same three-column shape as the Database instance page (Overview,
 * Usage, Connection) plus what's unique to a server: power controls
 * (start/stop/restart) and a Network card instead of a connection
 * string. Resizing CPU/RAM/Storage is a plan change — handled by the
 * Subscribe flow's "Change Plan" step via the Subscription card's
 * "Upgrade Plan" button — not by anything on this page.
 * ------------------------------------------------------------------ */

interface VpsInstance {
  name: string;
  status: { label: string; tone: string };
  hostname: string;
  os: string;
  region: string;
  resource: { cpu: string; memory: string; storage: string; bandwidth: string };
  network: { publicIp: string; privateIp: string; sshCommand: string };
}

function makeTemplate(index: number): Omit<VpsInstance, "name"> {
  return {
    status: { label: "Running", tone: "green" },
    hostname: `vps-${String(index).padStart(2, "0")}.cloudplus.test`,
    os: "Ubuntu 24.04 LTS",
    region: "Phnom Penh, KH",
    resource: { cpu: "2 Core", memory: "4 GB", storage: "80 GB", bandwidth: "4 TB" },
    network: {
      publicIp: `103.56.${index}.${10 + index}`,
      privateIp: `10.10.${index}.${10 + index}`,
      sshCommand: `ssh root@103.56.${index}.${10 + index}`,
    },
  };
}

/* One instance per subscription (same multi-subscription model as
   Database) — keyed by name so each "VPS Instance N" gets its own
   editable record instead of all of them sharing one object. */
export const VPS_INSTANCES: Record<string, VpsInstance> = Object.fromEntries(
  Array.from({ length: PLACEHOLDER_SUBSCRIPTION_COUNT }, (_, i) => {
    const name = `VPS Instance ${i + 1}`;
    return [name, { ...makeTemplate(i + 1), name }];
  })
);

export function VpsInstanceDetailPage({
  instanceName,
  onBack,
  onUpgrade,
}: {
  instanceName: string;
  onBack: () => void;
  onUpgrade?: () => void;
}) {
  const base = VPS_INSTANCES[instanceName] ?? { ...makeTemplate(1), name: instanceName };
  const [d, setD] = useState(base);
  const [running, setRunning] = useState(d.status.label === "Running");
  const [editOpen, setEditOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [addCommandOpen, setAddCommandOpen] = useState(false);
  const [commands, setCommands] = useState<string[]>([]);
  const status = running ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "red" };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to Subscriptions
      </button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {instanceName}
          </h1>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <Button
          variant="brand"
          onClick={() => setEditOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-8 text-sm"
        >
          <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
          Edit
        </Button>
      </div>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1 space-y-5">
          <Card>
            <CardTitle>Overview</CardTitle>
            <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-4">
              <StatTile label="Hostname">{d.hostname}</StatTile>
              <StatTile label="Operating System">{d.os}</StatTile>
              <StatTile label="Region">{d.region}</StatTile>
              <StatTile label="vCPU">{d.resource.cpu}</StatTile>
              <StatTile label="Memory">{d.resource.memory}</StatTile>
              <StatTile label="Storage">{d.resource.storage}</StatTile>
            </div>
          </Card>

          {/* Usage */}
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>Usage</CardTitle>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">02 JUL - 02 AUG</p>
            </div>
            <div className="mt-4 space-y-4">
              <UsageBar label="Storage" used={22} total={80} unit="GB" />
              <UsageBar label="Memory" used={1.8} total={4} unit="GB" />
              <UsageBar label="Bandwidth" used={0.6} total={4} unit="TB" />
            </div>
          </Card>

          {/* Network & access */}
          <Card>
            <CardTitle>Network & Access</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Connect over SSH using the public IP below.
            </p>
            <div className="mt-4 space-y-2">
              <ConnectionRow label="Public IP" value={d.network.publicIp} />
              <ConnectionRow label="Private IP" value={d.network.privateIp} />
              <ConnectionRow label="SSH Command" value={d.network.sshCommand} />
            </div>
          </Card>

          {/* Run commands — quick-start snippets, sample OS-matched
              command supplied by AddRunCommandDialog. */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Run Commands</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Sample terminal commands for {d.os}, ready to run over SSH.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setAddCommandOpen(true)}
                className="h-9 shrink-0 gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" animateOnHover animateOnTap />
                Add
              </Button>
            </div>
            {commands.length > 0 ? (
              <div className="mt-4 space-y-2">
                {commands.map((cmd, i) => (
                  <ConnectionRow key={`${cmd}-${i}`} label={`Command ${i + 1}`} value={cmd} />
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-3 py-4 dark:border-zinc-800">
                <Terminal className="h-4 w-4 shrink-0 text-zinc-400" animateOnView />
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  No commands added yet — click Add for an OS-matched sample.
                </p>
              </div>
            )}
          </Card>

          {/* Power controls */}
          <Card className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Power Controls</CardTitle>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                Start, stop, or restart this server.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                disabled={running}
                onClick={() => setRunning(true)}
                className="h-9 gap-1.5 text-sm"
              >
                <Play className="h-3.5 w-3.5" animateOnHover animateOnTap />
                Start
              </Button>
              <Button
                variant="destructive"
                disabled={!running}
                onClick={() => setRunning(false)}
                className="h-9 gap-1.5 text-sm"
              >
                <Square className="h-3.5 w-3.5" animateOnHover animateOnTap />
                Stop
              </Button>
              <Button
                variant="outline"
                disabled={!running}
                onClick={() => setRunning(true)}
                className="h-9 gap-1.5 text-sm"
              >
                <RotateCw className="h-3.5 w-3.5" animateOnHover animateOnTap />
                Restart
              </Button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200 dark:border-red-900/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Destroying this server is permanent and erases its disk. This can't be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDestroyOpen(true)}
                className="h-9 shrink-0 text-sm"
              >
                Destroy VPS
              </Button>
            </div>
          </Card>
        </div>

        {/* Right rail: this instance's subscription */}
        <div className="w-[320px] shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
            <BillingDashboardButton compact />
          </div>

          <ServicePlanCard
            planName="Standard"
            stats={VPS_PLAN_STATS}
            showFooter={false}
            onUpgrade={onUpgrade}
          />
        </div>
      </div>

      <EditVpsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        hostname={d.hostname}
        os={d.os}
        onSave={(next) =>
          setD((prev) => ({ ...prev, hostname: next.hostname, os: next.os }))
        }
      />

      <AddRunCommandDialog
        open={addCommandOpen}
        onOpenChange={setAddCommandOpen}
        os={d.os}
        onAdd={(command) => setCommands((prev) => [...prev, command])}
      />

      <ConfirmDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        title={`Destroy ${instanceName}?`}
        description="This permanently destroys the server and all data on its disk. This can't be undone."
        confirmLabel="Destroy VPS"
        variant="destructive"
        onConfirm={onBack}
      />
    </div>
  );
}

export const VPS_PLAN_STATS = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Pricing", "80,000 KHR/mo"],
  ["Bandwidth", "4 TB"],
  ["Region", "Phnom Penh, KH"],
];

/* Shown on the subscription list, one level up from a specific
   instance — leads with capacity (vCPU/RAM/Storage) rather than
   billing detail, which only matters once you're inside one. */
export const VPS_SUBSCRIPTION_STATS = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Pricing", "80,000 KHR/mo"],
  ["vCPU", "2 Core"],
  ["RAM", "4 GB"],
  ["Storage", "80 GB"],
];
