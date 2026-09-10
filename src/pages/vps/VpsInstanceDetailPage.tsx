import { useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Gauge } from "@/components/animate-ui/icons/gauge";
import { Camera } from "@/components/animate-ui/icons/camera";
import { Key } from "@/components/animate-ui/icons/key";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Play } from "@/components/animate-ui/icons/play";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Square } from "@/components/animate-ui/icons/square";
import { Terminal } from "@/components/animate-ui/icons/terminal";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  ConnectionRow,
  RadialGauge,
  StatTile,
  StatusBadge,
  UsageBar,
} from "../../components/atoms";
import { PLACEHOLDER_SUBSCRIPTION_COUNT } from "../../data/billing";
import { AddSshKeyDialog, CreateSnapshotDialog, EditVpsDialog } from "./VpsDialogs";

/* ------------------------------------------------------------------ *
 * VPS instance detail — one full root-access server per subscription,
 * same three-column shape as the Database instance page (Overview,
 * Usage, Connection) plus what's unique to a server: power controls
 * (start/stop/restart), Snapshots, SSH Keys, and a Network card
 * instead of a connection string. Resizing CPU/RAM/Storage is a plan
 * change — handled by the Subscribe flow's "Change Plan" step via the
 * Subscription card's "Upgrade Plan" button — not by anything on this
 * page. The terminal is a real SSH session, so "Open Terminal" opens
 * one in a new tab rather than faking a shell inline; "Monitoring"
 * drills into its own page for the live metrics.
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

interface Snapshot {
  name: string;
  createdOn: string;
  size: string;
}

interface SshKey {
  name: string;
  publicKey: string;
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

const SAMPLE_KEY_FINGERPRINT =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGx3z2s9c1r3f0a1v2b3n4m5q6w7e8r9t0y1u2i3o4p";

export function VpsInstanceDetailPage({
  instanceName,
  onBack,
  onUpgrade,
  onMonitoring,
  overrides,
}: {
  instanceName: string;
  onBack: () => void;
  onUpgrade?: () => void;
  onMonitoring?: () => void;
  // Freshly provisioned via CreateVpsPage — its hostname/OS/region win
  // over the sample template so the just-filled-in form actually shows
  // up on the instance it created.
  overrides?: { hostname?: string; os?: string; region?: string };
}) {
  const base = {
    ...(VPS_INSTANCES[instanceName] ?? { ...makeTemplate(1), name: instanceName }),
    ...(overrides?.hostname ? { hostname: overrides.hostname } : {}),
    ...(overrides?.os ? { os: overrides.os } : {}),
    ...(overrides?.region ? { region: overrides.region } : {}),
  };
  const [d, setD] = useState(base);
  const [running, setRunning] = useState(d.status.label === "Running");
  const [editOpen, setEditOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [sshKeys, setSshKeys] = useState<SshKey[]>([
    { name: "admin-laptop", publicKey: SAMPLE_KEY_FINGERPRINT },
  ]);
  const status = running ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "red" };

  function openTerminal() {
    // Mock web console — a real backend would issue a short-lived session
    // URL for this instance; here it's just the instance's own address so
    // "Open Terminal" still opens something instance-specific in a new tab.
    window.open(
      `https://console.cloudplus.test/vps/${encodeURIComponent(instanceName)}/terminal`,
      "_blank",
      "noopener,noreferrer"
    );
  }

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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={running}
            onClick={() => setRunning(true)}
            className="h-9 gap-1.5 text-sm"
          >
            <Play className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Start
          </Button>
          <Button variant="outline" onClick={onMonitoring} className="h-9 gap-1.5 text-sm">
            <Gauge className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Monitoring
          </Button>
          <Button variant="outline" onClick={openTerminal} className="h-9 gap-1.5 text-sm">
            <Terminal className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Open Terminal
          </Button>
          <Button
            variant="brand"
            onClick={() => setEditOpen(true)}
            className="h-9 gap-1.5 px-8 text-sm"
          >
            <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Edit
          </Button>
        </div>
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

          {/* SSH Key management — keys authorized for root login; adding
              one here is a sample of what a real backend would push into
              ~/.ssh/authorized_keys on next boot. */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>SSH Keys</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Public keys authorized for root login on this server.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setAddKeyOpen(true)}
                className="h-9 shrink-0 gap-1.5 text-sm"
              >
                <Key className="h-4 w-4" animateOnHover animateOnTap />
                Add Key
              </Button>
            </div>
            {sshKeys.length > 0 ? (
              <div className="mt-4 space-y-2">
                {sshKeys.map((key, i) => (
                  <div
                    key={`${key.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {key.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {key.publicKey}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${key.name}`}
                      onClick={() => setSshKeys((prev) => prev.filter((_, idx) => idx !== i))}
                      className="h-8 w-8 shrink-0 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-3 py-4 dark:border-zinc-800">
                <Key className="h-4 w-4 shrink-0 text-zinc-400" animateOnView />
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  No SSH keys added yet — password login only until you add one.
                </p>
              </div>
            )}
          </Card>

          {/* Snapshots — full-disk image, created on demand; restoring a
              new VPS from one isn't wired here, just the capture step. */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Snapshots</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Full-disk images of this server, ready to restore from later.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSnapshotOpen(true)}
                className="h-9 shrink-0 gap-1.5 text-sm"
              >
                <Camera className="h-4 w-4" animateOnHover animateOnTap />
                Create Snapshot
              </Button>
            </div>
            {snapshots.length > 0 ? (
              <div className="mt-4 space-y-2">
                {snapshots.map((snap, i) => (
                  <div
                    key={`${snap.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {snap.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {snap.createdOn} · {snap.size}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${snap.name}`}
                      onClick={() => setSnapshots((prev) => prev.filter((_, idx) => idx !== i))}
                      className="h-8 w-8 shrink-0 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-3 py-4 dark:border-zinc-800">
                <Camera className="h-4 w-4 shrink-0 text-zinc-400" animateOnView />
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  No snapshots yet — create one to capture this server's current state.
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

          <div className="grid grid-cols-2 gap-4">
            <RadialGauge label="vCPU" value={0.8} max={2} unit="CORE" />
            <RadialGauge label="RAM" value={1.8} max={4} unit="GB" />
            <RadialGauge label="Storage" value={24} max={80} unit="GB" />
          </div>
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

      <CreateSnapshotDialog
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
        instanceName={instanceName}
        onCreate={(name) =>
          setSnapshots((prev) => [
            {
              name,
              createdOn: new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              size: `${d.resource.storage}`,
            },
            ...prev,
          ])
        }
      />

      <AddSshKeyDialog
        open={addKeyOpen}
        onOpenChange={setAddKeyOpen}
        onAdd={(key) => setSshKeys((prev) => [...prev, key])}
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
