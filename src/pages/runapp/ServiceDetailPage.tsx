import { useState } from "react";
import { ChevronLeft, Download, History, Pencil, Play, RotateCw, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ConnectionRow,
  CopyIconButton,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  StatTile,
  StatusBadge,
} from "../../components/atoms";
import { SERVICE_ROWS } from "./RunAppComponents";
import { EditServiceInfoDrawer } from "./RunAppDialogs";

/* ------------------------------------------------------------------ *
 * Service detail — reached from a service row's "View Detail". Same
 * rounded-panel/StatTile/ConnectionRow language as the Database instance
 * detail page below, rather than a one-off look — a service and a
 * database instance are both "one resource's full detail", so they
 * should read as the same kind of page.
 * ------------------------------------------------------------------ */

const SERVICE_LOG_TABS: Array<{ key: "log" | "statusLog"; label: string }> = [
  { key: "log", label: "Log" },
  { key: "statusLog", label: "Status Log" },
];

export function ServiceDetailPage({
  stackName,
  serviceName,
  onBack,
}: {
  stackName: string;
  serviceName: string;
  onBack: () => void;
}) {
  const row = SERVICE_ROWS.find((r) => r.name === serviceName) ?? SERVICE_ROWS[0];
  // Editable fields live in local state, seeded from the sample row, so
  // the Edit dialog has something to actually change.
  const [detail, setDetail] = useState(row.detail);
  const d = detail;
  // Interactive Start/Stop/Restart — running state is local to this view
  // so the badge and controls stay in sync with each other.
  const [running, setRunning] = useState(row.status.label === "Running");
  const [logTab, setLogTab] = useState<"log" | "statusLog">("log");
  const [editOpen, setEditOpen] = useState(false);
  const status = running
    ? { label: "Running", tone: "green" }
    : { label: "Stopped", tone: "red" };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {stackName}
      </button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {serviceName}
          </h1>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="h-9 text-sm">
            Update Service
          </Button>
          <Button variant="brand" onClick={() => setEditOpen(true)} className="h-9 gap-1.5 text-sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="mt-5">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="info" className={PILL_TAB_TRIGGER_CLASS}>
            Service Info
          </TabsTrigger>
          <TabsTrigger value="env" className={PILL_TAB_TRIGGER_CLASS}>
            Environment
          </TabsTrigger>
          <TabsTrigger value="policy" className={PILL_TAB_TRIGGER_CLASS}>
            Policy & Resource
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-5 space-y-5">
          {/* At-a-glance facts — mirrors the Database instance page's
              Overview panel. Sizing/restart policy live on their own
              Policy & Resource tab instead of crowding this one. */}
          <Card>
            <CardTitle>Overview</CardTitle>
            <div className="mt-4 grid grid-cols-4 gap-x-6 gap-y-5">
              <StatTile label="Container Image">{d.containerImage}</StatTile>
            </div>
          </Card>

          {/* Connection */}
          <Card>
            <CardTitle>Connection</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Where this service is reachable from.
            </p>
            <div className="mt-4 space-y-2">
              <ConnectionRow
                label="Host Name"
                value={d.hostName}
                copyable={d.hostName !== "NONE"}
              />
              <ConnectionRow
                label="Domain Generate"
                value={d.domainGenerate}
                copyable={d.domainGenerate !== "NONE"}
              />
              <ConnectionRow label="Repository" value={d.repository} />
            </div>
          </Card>

          {/* Domain & CNAME — only for services actually exposed with a
              domain (an internal-only service, like a cache with no
              public hostname, has neither and skips this card
              entirely rather than showing empty/"NONE" values). */}
          {d.domainGenerate !== "NONE" && (
            <Card>
              <CardTitle>Domain & DNS</CardTitle>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                This service's public domain, and the CNAME record to point
                your own domain at it.
              </p>
              <div className="mt-4 space-y-2">
                <ConnectionRow label="Domain Name" value={d.domainGenerate} />
                <div className="grid grid-cols-3 gap-2">
                  <ConnectionRow label="Type" value="CNAME" copyable={false} />
                  <ConnectionRow label="Name" value="www" />
                  <ConnectionRow label="Value" value={d.domainGenerate} />
                </div>
              </div>
            </Card>
          )}

          {/* Controls */}
          <Card className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Controls</CardTitle>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                Start, stop, or restart this service.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                disabled={running}
                onClick={() => setRunning(true)}
                className="h-9 gap-1.5 text-sm"
              >
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
              <Button
                variant="destructive"
                disabled={!running}
                onClick={() => setRunning(false)}
                className="h-9 gap-1.5 text-sm"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
              <Button
                variant="outline"
                disabled={!running}
                onClick={() => setRunning(true)}
                className="h-9 gap-1.5 text-sm"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Restart
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="env" className="mt-5">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <TableHead className="text-zinc-500 dark:text-zinc-400">Key</TableHead>
                  <TableHead className="text-zinc-500 dark:text-zinc-400">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.env.map((envRow) => (
                  <TableRow key={envRow.key}>
                    <TableCell className="font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                      {envRow.key}
                    </TableCell>
                    <TableCell className="font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
                      {envRow.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="policy" className="mt-5 space-y-5">
          {/* Resource size — same fields Create/Edit Service collect. */}
          <Card>
            <CardTitle>Resource</CardTitle>
            <div className="mt-4 grid grid-cols-4 gap-x-6 gap-y-5">
              <StatTile label="Replica">{d.replica}</StatTile>
              <StatTile label="CPU">{d.resource.cpu}</StatTile>
              <StatTile label="Memory">{d.resource.memory}</StatTile>
            </div>
          </Card>

          {/* Restart policy */}
          <Card>
            <CardTitle>Restart Policy</CardTitle>
            <div className="mt-4 grid grid-cols-4 gap-x-6 gap-y-5">
              <StatTile label="Condition">{d.restartPolicy.condition}</StatTile>
              <StatTile label="Delay">{d.restartPolicy.delay}</StatTile>
              <StatTile label="Max Attempts">{d.restartPolicy.maxAttempts}</StatTile>
              <StatTile label="Window">{d.restartPolicy.window}</StatTile>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Console — same rounded-panel treatment as the rest of the page;
          only the header's tab switch and icon actions are bespoke. */}
      <div className="mt-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex gap-1">
            {SERVICE_LOG_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLogTab(tab.key)}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium motion-safe:transition-colors " +
                  (logTab === tab.key
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="View log history"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              <History className="h-4 w-4" />
            </button>
            <CopyIconButton
              value={d[logTab].join("\n")}
              label="log output"
              className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            />
            <button
              type="button"
              aria-label="Download log"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto px-5 py-4">
          {d[logTab].map((line, i) => (
            <div key={i} className="flex gap-4 font-mono text-[12.5px] leading-5">
              <span className="w-5 shrink-0 select-none text-right text-zinc-300 dark:text-zinc-700">
                {i + 1}
              </span>
              <span className="min-w-0 whitespace-pre-wrap break-all text-zinc-600 dark:text-zinc-400">
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      <EditServiceInfoDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        serviceName={serviceName}
        value={detail}
        running={running}
        onRunningChange={setRunning}
        onSave={(next) =>
          setDetail((prev) => ({ ...prev, ...next, domainGenerate: next.hostName || prev.domainGenerate }))
        }
      />
    </div>
  );
}
