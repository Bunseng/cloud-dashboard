import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BellRing } from "@/components/animate-ui/icons/bell-ring";
import { Camera } from "@/components/animate-ui/icons/camera";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Cpu } from "@/components/animate-ui/icons/cpu";
import { Gauge } from "@/components/animate-ui/icons/gauge";
import { HardDrive } from "@/components/animate-ui/icons/hard-drive";
import { History as HistoryIcon } from "@/components/animate-ui/icons/history";
import { Key } from "@/components/animate-ui/icons/key";
import { MemoryStick } from "@/components/animate-ui/icons/memory-stick";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Play } from "@/components/animate-ui/icons/play";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Server } from "@/components/animate-ui/icons/server";
import { Square } from "@/components/animate-ui/icons/square";
import { Terminal } from "@/components/animate-ui/icons/terminal";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CambodiaMap } from "../../components/CambodiaMap";
import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  ConnectionRow,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  StatTile,
  StatusBadge,
} from "../../components/atoms";
import type { ScheduledPlanChange } from "../../context/PlanScheduleContext";
import { PLACEHOLDER_SUBSCRIPTION_COUNT } from "../../data/billing";
import { SERVICE_PRICING } from "../../data/pricing";
import { findVpsRegion, VPS_REGIONS } from "../../data/regions";
import { EmptyState } from "../../firstusersrc/EmptyState";
import {
  AddSshKeyDialog,
  addVpsSshKey,
  CreateSnapshotDialog,
  EditVpsDialog,
  SnapshotHistoryDialog,
  SnapshotInfoSummary,
  VPS_SSH_KEYS,
} from "./VpsDialogs";
import {
  formatHistoryTimestamp,
  RESTORE_DISABLED_STATUSES,
  snapshotLimitFor,
  snapshotStatusTone,
  useVpsSnapshot,
  type Snapshot,
} from "./VpsSnapshotContext";

/* ------------------------------------------------------------------ *
 * VPS instance detail — one full root-access server per subscription,
 * same three-column shape as the Database instance page (Overview,
 * Connection) plus what's unique to a server: power controls
 * (start/stop/restart), SSH Keys, and a Network card instead of a
 * connection string. Resizing CPU/RAM/Storage is a plan change —
 * handled by the Subscribe flow's "Change Plan" step via the
 * Subscription card's "Upgrade Plan" button — not by anything on this
 * page. Snapshots — same shape as Database's Backups — get their own
 * per-instance page one level down; this card is just the entry point.
 * The web console is a real SSH session, so "Web Console" opens one in
 * a new tab rather than faking a shell inline; "Monitoring" drills into
 * its own page for the live metrics.
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

// Same provisioning trail every instance actually went through (see
// CreateVpsPage), shown newest-first — a lightweight stand-in for a
// real activity log, same spirit as Hetzner Console's own Activities
// panel on its server Overview.
const INSTANCE_ACTIVITY: { label: string; time: string }[] = [
  { label: "Server started", time: "1 day ago" },
  { label: "Server created", time: "1 day ago" },
  { label: "Primary IP created", time: "1 day ago" },
  { label: "Primary IP created", time: "1 day ago" },
  { label: "Server is being created", time: "1 day ago" },
];

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
  onMonitoring,
  overrides,
  scheduledUpgrade,
  onCancelSchedule,
}: {
  instanceName: string;
  onBack: () => void;
  onUpgrade?: () => void;
  onMonitoring?: () => void;
  scheduledUpgrade?: ScheduledPlanChange | null;
  onCancelSchedule?: () => void;
  // Freshly provisioned via CreateVpsPage — its hostname/OS/region/tier
  // win over the sample template so the just-filled-in form actually
  // shows up on the instance it created.
  overrides?: { hostname?: string; os?: string; region?: string; tierId?: string };
}) {
  const navigate = useNavigate();
  const { isSubscribed, getTierId, snapshots, addSnapshot, setSnapshotStatus, addHistoryEntry } =
    useVpsSnapshot();
  const snapshotSubscribed = isSubscribed(instanceName);
  const instanceSnapshots = snapshots.filter((s) => s.instanceName === instanceName);
  const instanceSnapshotCount = instanceSnapshots.length;
  const snapshotTierId = getTierId(instanceName);
  const snapshotPlan = SERVICE_PRICING.vpsSnapshot.find((t) => t.id === snapshotTierId);
  const snapshotLimit = snapshotLimitFor(snapshotPlan);
  const atSnapshotLimit = snapshotLimit != null && instanceSnapshotCount >= snapshotLimit;
  const snapshotReturnTo = `/vps/${encodeURIComponent(instanceName)}`;
  const vpsTier = SERVICE_PRICING.vps.find((t) => t.id === overrides?.tierId);
  const base = {
    ...(VPS_INSTANCES[instanceName] ?? { ...makeTemplate(1), name: instanceName }),
    ...(overrides?.hostname ? { hostname: overrides.hostname } : {}),
    ...(overrides?.os ? { os: overrides.os } : {}),
    ...(overrides?.region ? { region: overrides.region } : {}),
    ...(vpsTier
      ? {
          resource: {
            cpu: vpsTier.specs.find(([label]) => label === "vCPU")?.[1] ?? "2 Core",
            memory: vpsTier.specs.find(([label]) => label === "RAM")?.[1] ?? "4 GB",
            storage: vpsTier.specs.find(([label]) => label === "SSD Storage")?.[1] ?? "80 GB",
            bandwidth: vpsTier.specs.find(([label]) => label === "Bandwidth")?.[1] ?? "4 TB",
          },
        }
      : {}),
  };
  const [d, setD] = useState(base);
  const [running, setRunning] = useState(d.status.label === "Running");
  const [editOpen, setEditOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  // Seeded from the shared, account-level key list — same keys a Create
  // VPS flow (or another instance's own "Add Key") already added show
  // up here too, and anything added here is reusable everywhere else.
  const [sshKeys, setSshKeys] = useState(() => [...VPS_SSH_KEYS]);
  const [createSnapshotOpen, setCreateSnapshotOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Snapshot | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Snapshot | null>(null);
  const status = running ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "red" };
  const region = findVpsRegion(d.region) ?? VPS_REGIONS[0];

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
        <Button
          variant="brand"
          onClick={() => setEditOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-8 text-sm"
        >
          <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
          Edit
        </Button>
      </div>

      {/* VPS Controls — same shape as Run App's own Stack Controls card:
          power/console actions grouped in their own card right under the
          header instead of crowding the title row. */}
      <Card className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>VPS Controls</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Start, stop, or restart this server, or jump into its console and monitoring.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${running ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {running ? "Server is running" : "Server is stopped"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
            <Button variant="outline" onClick={onMonitoring} className="h-9 gap-1.5 text-sm">
              <Gauge className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Monitoring
            </Button>
            <Button variant="outline" onClick={openTerminal} className="h-9 gap-1.5 text-sm">
              <Terminal className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Web Console
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1 space-y-5">
          {/* Same section split as Hetzner Console's own server detail
              page (Overview / Network / SSH Keys / Snapshots tabs) rather
              than one long scroll of cards — each concern gets its own
              tab, Overview keeps the resource summary plus an Activities
              panel of what's happened to this server so far. */}
          <Tabs defaultValue="overview">
            <TabsList className={PILL_TABS_LIST_CLASS}>
              <TabsTrigger value="overview" className={PILL_TAB_TRIGGER_CLASS}>
                Overview
              </TabsTrigger>
              <TabsTrigger value="network" className={PILL_TAB_TRIGGER_CLASS}>
                Network & Access
              </TabsTrigger>
              <TabsTrigger value="ssh-keys" className={PILL_TAB_TRIGGER_CLASS}>
                SSH Keys
              </TabsTrigger>
              <TabsTrigger value="snapshots" className={PILL_TAB_TRIGGER_CLASS}>
                Snapshots
              </TabsTrigger>
              <TabsTrigger value="settings" className={PILL_TAB_TRIGGER_CLASS}>
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-5">
              <Card>
                <CardTitle>Overview</CardTitle>
                <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-4">
                  <StatTile
                    label={
                      <span className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-zinc-400" />
                        Hostname
                      </span>
                    }
                  >
                    {d.hostname}
                  </StatTile>
                  <StatTile
                    label={
                      <span className="flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                        Operating System
                      </span>
                    }
                  >
                    {d.os}
                  </StatTile>
                  <StatTile
                    label={
                      <span className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                        vCPU
                      </span>
                    }
                  >
                    {d.resource.cpu}
                  </StatTile>
                  <StatTile
                    label={
                      <span className="flex items-center gap-1.5">
                        <MemoryStick className="h-3.5 w-3.5 text-zinc-400" />
                        Memory
                      </span>
                    }
                  >
                    {d.resource.memory}
                  </StatTile>
                  <StatTile
                    label={
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                        Storage
                      </span>
                    }
                  >
                    {d.resource.storage}
                  </StatTile>
                </div>
              </Card>

              {/* Region & Location — datacenter/city/country/network zone
                  plus a map so "where is this server" reads visually,
                  same spirit as the provider consoles this app mirrors. */}
              <Card>
                <CardTitle>Region & Location</CardTitle>
                <div className="mt-4 grid grid-cols-[1fr_200px] gap-6">
                  <div className="space-y-2">
                    <ConnectionRow label="Datacenter" value={region.datacenter} copyable={false} />
                    <ConnectionRow label="City" value={region.city} copyable={false} />
                    <ConnectionRow label="Country" value={`${region.country} (${region.countryCode})`} copyable={false} />
                    <ConnectionRow label="Network Zone" value={region.networkZone} copyable={false} />
                  </div>
                  <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <CambodiaMap regions={VPS_REGIONS} selectedId={region.id} className="h-full w-full" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-zinc-400" animateOnView />
                  <CardTitle>Activities</CardTitle>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {INSTANCE_ACTIVITY.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {activity.label}
                      </span>
                      <span className="shrink-0 text-[13px] text-zinc-400 dark:text-zinc-500">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="mt-4">
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
            </TabsContent>

            {/* SSH Key management — keys authorized for root login; adding
                one here is a sample of what a real backend would push into
                ~/.ssh/authorized_keys on next boot. */}
            <TabsContent value="ssh-keys" className="mt-4">
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
            </TabsContent>

            {/* Snapshots — plan summary first, then the full list with
                restore right here in the tab (previously its own page,
                same shape as Database's dedicated Backup List). Not
                subscribed yet: the button sends straight into the
                Subscribe flow instead of picking a plan inline here. */}
            <TabsContent value="snapshots" className="mt-4 space-y-5">
              {!snapshotSubscribed ? (
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Snapshots</CardTitle>
                      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                        Not enabled yet — subscribe to a Snapshot plan to get started.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/subscribe/vpsSnapshot/basic?return=${encodeURIComponent(
                            snapshotReturnTo
                          )}&instance=${encodeURIComponent(instanceName)}`
                        )
                      }
                      className="h-9 shrink-0 gap-1.5 text-sm"
                    >
                      Enable Snapshot
                      <ChevronRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Snapshot Plan</CardTitle>
                        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                          {snapshotPlan?.name ?? "Basic"} plan
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/subscribe/vpsSnapshot/${snapshotTierId ?? "basic"}?upgrade=1&return=${encodeURIComponent(
                              snapshotReturnTo
                            )}&instance=${encodeURIComponent(instanceName)}`
                          )
                        }
                        className="h-9 shrink-0 text-sm"
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-x-6 gap-y-4">
                      <StatTile label="Frequency">{snapshotPlan?.specs[0][1] ?? "—"}</StatTile>
                      <StatTile label="Retention">{snapshotPlan?.specs[1][1] ?? "—"}</StatTile>
                      <StatTile label="Max Snapshots">
                        {snapshotLimit != null
                          ? `${instanceSnapshotCount} / ${snapshotLimit}`
                          : `${instanceSnapshotCount} (Unlimited)`}
                      </StatTile>
                      <StatTile label="Pricing">
                        {snapshotPlan
                          ? snapshotPlan.priceKHR === 0
                            ? "FREE"
                            : `${snapshotPlan.priceKHR.toLocaleString()} KHR/mo`
                          : "—"}
                      </StatTile>
                    </div>
                    {atSnapshotLimit && (
                      <p className="mt-3 text-[13px] text-amber-600 dark:text-amber-400">
                        Snapshot limit reached ({instanceSnapshotCount}/{snapshotLimit}) — restore
                        or wait for one to expire, or upgrade your plan for more.
                      </p>
                    )}
                  </Card>

                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>Snapshots</CardTitle>
                      <Button
                        variant="brand"
                        disabled={atSnapshotLimit}
                        onClick={() => setCreateSnapshotOpen(true)}
                        className="h-9 shrink-0 gap-1.5 text-sm"
                      >
                        <Camera className="h-4 w-4" animateOnHover animateOnTap />
                        Create Snapshot
                      </Button>
                    </div>

                    {instanceSnapshots.length === 0 ? (
                      <div className="mt-4">
                        <EmptyState
                          icon={HistoryIcon}
                          title="No snapshots yet"
                          description="Create a snapshot to capture this server's current state so you can restore it later."
                          actionLabel="Create Snapshot"
                          onAction={() => setCreateSnapshotOpen(true)}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                                <TableHead>File Name</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>History</TableHead>
                                <TableHead className="w-px text-right">
                                  <span className="sr-only sm:not-sr-only">Action</span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {instanceSnapshots.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                                    {s.name}
                                  </TableCell>
                                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                                    {s.createdOn}
                                  </TableCell>
                                  <TableCell className="text-zinc-600 dark:text-zinc-300">
                                    {s.size}
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge label={s.status} tone={snapshotStatusTone(s.status)} />
                                  </TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      onClick={() => setHistoryTarget(s)}
                                      className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                                    >
                                      History
                                    </button>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={RESTORE_DISABLED_STATUSES.includes(s.status)}
                                      onClick={() => setRestoreTarget(s)}
                                      className="h-7 px-3 text-xs"
                                    >
                                      Restore
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Settings — destructive/account-level controls for this
                instance get their own tab, same as Danger Zone sitting at
                the bottom of a dedicated Settings page elsewhere. */}
            <TabsContent value="settings" className="mt-4">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail: this instance's subscription */}
        <div className="w-[320px] shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
            <BillingDashboardButton compact />
          </div>

          <ServicePlanCard
            planName={vpsTier?.name ?? "Standard"}
            stats={
              vpsTier
                ? [
                    ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
                    ["Renews On", "Aug 2, 2026"],
                    ["Pricing", `${vpsTier.priceKHR.toLocaleString()} KHR/mo`],
                    ["Bandwidth", d.resource.bandwidth],
                    ["Region", d.region],
                  ]
                : VPS_PLAN_STATS
            }
            showFooter={false}
            onUpgrade={onUpgrade}
            scheduledUpgrade={scheduledUpgrade}
            onCancelSchedule={onCancelSchedule}
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

      <AddSshKeyDialog
        open={addKeyOpen}
        onOpenChange={setAddKeyOpen}
        onAdd={(key) => setSshKeys((prev) => [...prev, addVpsSshKey(key)])}
      />

      <CreateSnapshotDialog
        open={createSnapshotOpen}
        onOpenChange={setCreateSnapshotOpen}
        instances={[instanceName]}
        onCreate={({ name }) =>
          addSnapshot({
            name,
            instanceName,
            size: d.resource.storage,
            createdOn: new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })
        }
      />

      <SnapshotHistoryDialog
        open={historyTarget != null}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        snapshot={historyTarget}
      />

      <ConfirmDialog
        open={restoreTarget != null}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title={restoreTarget ? `Restore ${restoreTarget.name}?` : "Restore snapshot?"}
        description="This overwrites the server's current disk with this snapshot. This can't be undone."
        confirmLabel="Restore"
        variant="destructive"
        onConfirm={() => {
          if (restoreTarget) {
            const id = restoreTarget.id;
            const initializedAt = formatHistoryTimestamp(new Date());
            setSnapshotStatus(id, "Restoring");
            setTimeout(() => {
              setSnapshotStatus(id, "Completed");
              addHistoryEntry(id, {
                actionType: "Restore",
                status: "Success",
                initializedAt,
                finishedAt: formatHistoryTimestamp(new Date()),
              });
            }, 1500);
          }
          setRestoreTarget(null);
        }}
      >
        {restoreTarget && <SnapshotInfoSummary snapshot={restoreTarget} />}
      </ConfirmDialog>

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
