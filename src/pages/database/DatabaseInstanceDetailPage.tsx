import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Lock } from "@/components/animate-ui/icons/lock";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Plus } from "@/components/animate-ui/icons/plus";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  ConnectionRow,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  RadialGauge,
  StatTile,
  StatusBadge,
  UsageBar,
} from "../../components/atoms";
import type { ScheduledPlanChange } from "../../context/PlanScheduleContext";
import { PLACEHOLDER_SUBSCRIPTION_COUNT } from "../../data/billing";
import { SERVICE_PRICING } from "../../data/pricing";
import { useDatabaseBackup } from "./DatabaseBackupContext";
import { AddIpWhitelistDialog, EditDatabaseDialog } from "./DatabaseDialogs";

/* ------------------------------------------------------------------ *
 * Database instance detail — three columns of fields, matching the
 * supplied design, plus Edit (resize/version/cluster), Trusted Sources,
 * and a Danger Zone — the same shape as DigitalOcean's cluster Overview
 * + Settings tabs, minus the parts our model doesn't have.
 * ------------------------------------------------------------------ */

interface DatabaseInstance {
  name: string;
  status: { label: string; tone: string };
  engine: { language: string; version: string };
  resource: { cpu: string; memory: string; storage: string };
  cluster: string;
  runappConnection: { hostName: string; port: string; connectionString: string };
  externalConnection: { commandLine: string; port: string; adminLink: string; uri: string };
}

const DATABASE_INSTANCE_TEMPLATE: Omit<DatabaseInstance, "name"> = {
  status: { label: "Running", tone: "green" },
  engine: { language: "Mongo DB", version: "1.1" },
  resource: { cpu: "2 Core", memory: "4 GB", storage: "60 GB" },
  cluster: "1",
  runappConnection: {
    hostName: "https://github.cloudplus.test/db/lpinel",
    port: "4570",
    connectionString: "mongodb://dbaas.cloudplus.test:4570/lpinel",
  },
  externalConnection: {
    commandLine: "mysql -h dbaas.cloudplus.test -u dpdb01 -p",
    port: "4570",
    adminLink: "https://github.cloudplus.test/admin/lpinel",
    uri: "https://github.cloudplus.test/uri/lpinel",
  },
};

/* One instance per subscription (the multi-subscription model is
   unchanged) — keyed by name so each "DB Instance N" gets its own
   editable record instead of all of them sharing one object. */
export const DATABASE_INSTANCES: Record<string, DatabaseInstance> = Object.fromEntries(
  Array.from({ length: PLACEHOLDER_SUBSCRIPTION_COUNT }, (_, i) => {
    const name = `DB Instance ${i + 1}`;
    return [name, { ...DATABASE_INSTANCE_TEMPLATE, name }];
  })
);

/* Kept for anything still importing the old single-instance export. */
export const DATABASE_INSTANCE_DETAIL = DATABASE_INSTANCES["DB Instance 1"];

export function DatabaseInstanceDetailPage({
  instanceName,
  onBack,
  onUpgrade,
  onOpenBackups,
  scheduledUpgrade,
  onCancelSchedule,
}: {
  instanceName: string;
  onBack: () => void;
  onUpgrade?: () => void;
  onOpenBackups: () => void;
  scheduledUpgrade?: ScheduledPlanChange | null;
  onCancelSchedule?: () => void;
}) {
  const base = DATABASE_INSTANCES[instanceName] ?? {
    ...DATABASE_INSTANCE_TEMPLATE,
    name: instanceName,
  };
  const [d, setD] = useState(base);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addIpOpen, setAddIpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isSubscribed, getTierId, backups } = useDatabaseBackup();
  const backupSubscribed = isSubscribed(instanceName);
  const instanceBackupCount = backups.filter((b) => b.instanceName === instanceName).length;
  const backupPlan = SERVICE_PRICING.databaseBackup.find((t) => t.id === getTierId(instanceName));
  const externalAccessEnabled = ipWhitelist.length > 0;
  const [tab, setTab] = useState("overview");

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
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1b1b1d] dark:text-zinc-50">
            {instanceName}
          </h1>
          <StatusBadge label={d.status.label} tone={d.status.tone} />
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

      <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className={PILL_TABS_LIST_CLASS}>
              <TabsTrigger value="overview" className={PILL_TAB_TRIGGER_CLASS}>
                Overview
              </TabsTrigger>
              <TabsTrigger value="connection" className={PILL_TAB_TRIGGER_CLASS}>
                Connection
              </TabsTrigger>
              <TabsTrigger value="backups" className={PILL_TAB_TRIGGER_CLASS}>
                Backups
              </TabsTrigger>
              <TabsTrigger value="settings" className={PILL_TAB_TRIGGER_CLASS}>
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-5">
              {/* At-a-glance facts, so you don't have to read a form to know
                  what this instance is. */}
              <Card>
                <CardTitle>Overview</CardTitle>
                <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-4">
                  <StatTile label="Database Name">{instanceName}</StatTile>
                  <StatTile label="Engine">
                    {d.engine.language} {d.engine.version}
                  </StatTile>
                  <StatTile label="Cluster">{d.cluster}</StatTile>
                  <StatTile label="CPU">{d.resource.cpu}</StatTile>
                  <StatTile label="Memory">{d.resource.memory}</StatTile>
                  <StatTile label="Storage">{d.resource.storage}</StatTile>
                </div>
              </Card>

              {/* Usage */}
              <Card>
                <div className="flex items-baseline justify-between gap-3">
                  <CardTitle>Usage</CardTitle>
                  <p className="text-[11px] text-[#71717a] dark:text-zinc-400">02 JUL - 02 AUG</p>
                </div>
                <div className="mt-4 space-y-4">
                  <UsageBar label="Storage" used={18} total={60} unit="GB" />
                  <UsageBar label="Memory" used={1.5} total={4} unit="GB" />
                </div>
              </Card>

              {/* Access & Backups — the at-a-glance summary of both
                  "ways in" (external access) and "can I get my data
                  back" (backups); each row's link jumps to the tab that
                  actually manages it instead of duplicating that UI
                  here. */}
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Access & Backups</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => window.open(d.externalConnection.adminLink, "_blank", "noopener,noreferrer")}
                    className="h-9 shrink-0 gap-1.5 text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Admin Tool
                  </Button>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">External Access</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        label={externalAccessEnabled ? "On" : "Off"}
                        tone={externalAccessEnabled ? "green" : "zinc"}
                      />
                      <button
                        type="button"
                        onClick={() => setTab("connection")}
                        className="flex items-center gap-1 text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                      >
                        Manage
                        <ChevronRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                    <div className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                      <span>Backups</span>
                      {backupSubscribed && (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {backupPlan?.specs[0]?.[1] ?? "Once-Daily"} · {backupPlan?.specs[1]?.[1] ?? "7 Days"} retention
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        label={backupSubscribed ? "Enabled" : "Disabled"}
                        tone={backupSubscribed ? "green" : "zinc"}
                      />
                      <button
                        type="button"
                        onClick={() => setTab("backups")}
                        className="flex items-center gap-1 text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="connection" className="mt-4 space-y-5">
              {/* Connections — the two ways in, side by side */}
              <div className="grid grid-cols-2 items-start gap-5">
                <Card>
                  <CardTitle>RunApp Connection</CardTitle>
                  <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                    Use these from a stack running inside Cloud Plus.
                  </p>
                  <div className="mt-4 space-y-2">
                    <ConnectionRow label="Host Name" value={d.runappConnection.hostName} />
                    <ConnectionRow label="Port" value={d.runappConnection.port} copyable={false} />
                    <ConnectionRow
                      label="Connection String"
                      value={d.runappConnection.connectionString}
                    />
                  </div>
                </Card>

                {/* Hidden until at least one IP is whitelisted — showing
                    connection details nobody's allowed to use yet just
                    invites someone to try and get blocked. */}
                {externalAccessEnabled ? (
                  <Card>
                    <CardTitle>External Connection</CardTitle>
                    <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                      Use these from outside, from any of the IPs whitelisted below.
                    </p>
                    <div className="mt-4 space-y-2">
                      <ConnectionRow
                        label="Command Line"
                        value={d.externalConnection.commandLine}
                      />
                      <ConnectionRow label="Port" value={d.externalConnection.port} copyable={false} />
                      <ConnectionRow label="Admin Link" value={d.externalConnection.adminLink} />
                      <ConnectionRow label="URI" value={d.externalConnection.uri} />
                    </div>
                  </Card>
                ) : (
                  <Card className="flex flex-col items-center justify-center border-dashed text-center">
                    <Lock className="h-6 w-6 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} animateOnView />
                    <CardTitle className="mt-2">External Connection</CardTitle>
                    <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                      Add an IP to the whitelist below to unlock connecting from
                      outside Cloud Plus.
                    </p>
                  </Card>
                )}
              </div>

              {/* IP whitelist */}
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>IP Whitelist</CardTitle>
                    <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                      IP Whitelist is required to allow external connections to the service.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setAddIpOpen(true)}
                    className="h-9 shrink-0 gap-1.5 text-sm"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
                    Add
                  </Button>
                </div>

                {ipWhitelist.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {ipWhitelist.map((ip) => (
                      <li
                        key={ip}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e5e7] px-3 py-2 dark:border-zinc-800"
                      >
                        <span className="font-mono text-[13px] text-[#1b1b1d] dark:text-zinc-100">{ip}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${ip}`}
                          onClick={() => setIpWhitelist((prev) => prev.filter((v) => v !== ip))}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" animateOnHover animateOnTap />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-[#e5e5e7] pt-4 pb-6 text-center dark:border-zinc-800">
                    <p className="text-[13px] text-[#71717a] dark:text-zinc-400">
                      No IP addresses allowed yet.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="backups" className="mt-4">
              {/* Backups — the full list + create flow lives on its own
                  page (matches Figma's dedicated "{instance} - Back Up
                  list" screen); this card is just the entry point. Not
                  subscribed yet: the button sends you straight into the
                  Subscribe flow (that page auto-redirects there) instead
                  of picking a plan inline here. */}
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Backups</CardTitle>
                    <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                      {backupSubscribed
                        ? `${instanceBackupCount} backup${instanceBackupCount === 1 ? "" : "s"}${
                            backupPlan ? ` · ${backupPlan.name} plan` : ""
                          }`
                        : "Not enabled yet — subscribe to a Backup plan to get started."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={onOpenBackups}
                    className="h-9 shrink-0 gap-1.5 text-sm"
                  >
                    {backupSubscribed ? (
                      <>
                        Backup List
                        <ChevronRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </>
                    ) : (
                      <>
                        Enable Backup
                        <ChevronRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              {/* Danger zone — the one destructive action for this instance,
                  set apart the same way DO's Settings tab isolates it. */}
              <Card className="border-red-200 dark:border-red-900/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <p className="mt-1 text-[13px] text-[#71717a] dark:text-zinc-400">
                      Deleting this database instance is permanent and can't be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                    className="h-9 shrink-0 text-sm"
                  >
                    Delete Database
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail: this instance's subscription */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1b1b1d] dark:text-zinc-50">
              Subscription
            </h2>
            <BillingDashboardButton compact />
          </div>

          <ServicePlanCard
            title="Database"
            planName="Standard"
            stats={[
              ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
              ["Renews On", "Aug 2, 2026"],
              ["Price", "240,000 KHR/mo"],
              ["CPU", d.resource.cpu],
              ["RAM", d.resource.memory],
              ["Storage", d.resource.storage],
              ["Cluster", d.cluster],
            ]}
            daysLeft={18}
            showFooter={false}
            onUpgrade={onUpgrade}
            scheduledUpgrade={scheduledUpgrade}
            onCancelSchedule={onCancelSchedule}
          />

          <div className="grid grid-cols-2 gap-4">
            <RadialGauge label="CPU" value={1} max={2} unit="CORE" tooltip="CPU cores currently used by this instance." />
            <RadialGauge label="RAM" value={2.1} max={4} unit="GB" tooltip="Memory currently used by this instance." />
            <RadialGauge
              label="Storage"
              value={18}
              max={60}
              unit="GB"
              tooltip="Disk space currently used by this instance."
            />
          </div>
        </div>
      </div>

      <EditDatabaseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        value={d}
        onSave={(next) => setD((prev) => ({ ...prev, ...next }))}
      />

      <AddIpWhitelistDialog
        open={addIpOpen}
        onOpenChange={setAddIpOpen}
        onAdd={(value) =>
          setIpWhitelist((prev) => (prev.includes(value) ? prev : [...prev, value]))
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${instanceName}?`}
        description="This permanently deletes the database and all its data. This can't be undone."
        confirmLabel="Delete Database"
        variant="destructive"
        onConfirm={onBack}
      />
    </div>
  );
}

/* Shown on the subscription list, one level up from a specific
   instance — leads with capacity (CPU/RAM/Storage) rather than the
   cluster-charge detail, which only matters once you're inside one. */
export const DATABASE_SUBSCRIPTION_STATS = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Price", "240,000 KHR/mo"],
  ["CPU", "2 CPU"],
  ["RAM", "4 GB"],
  ["Storage", "60 GB"],
];
