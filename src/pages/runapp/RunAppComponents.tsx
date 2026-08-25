import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ResourceListView } from "../../components/ResourceListView";
import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  RadialGauge,
  StatusBadge,
} from "../../components/atoms";
import { CreateServiceDrawer, type NewServiceFields } from "./RunAppDialogs";

/* ------------------------------------------------------------------ *
 * Stack list (Run App) and Database list.
 *
 * FIRST PASS — the columns, statuses and sample rows below are a
 * suggestion, not a spec. They're deliberately data-driven so you can
 * add/remove/reorder columns by editing STACK_COLUMNS / SERVICE_COLUMNS
 * without touching the table itself.
 * ------------------------------------------------------------------ */

/* Sample rows — replace with API data. */
export const STACK_ROWS = [
  {
    id: "stk-1",
    name: "web-frontend",
    status: { label: "Running", tone: "green" },
    serviceCount: 3,
  },
  {
    id: "stk-2",
    name: "api-gateway",
    status: { label: "Deploying", tone: "blue" },
    serviceCount: 2,
  },
  {
    id: "stk-3",
    name: "worker-queue",
    status: { label: "Stopped", tone: "zinc" },
    serviceCount: 1,
  },
];

export const STACK_COLUMNS: Array<{
  key: string;
  header: string;
  className?: string;
  render?: (row: (typeof STACK_ROWS)[number]) => ReactNode;
}> = [
  {
    key: "name",
    header: "Stack Name",
    className: "w-[260px] font-medium text-zinc-900 dark:text-zinc-100",
  },
  {
    key: "status",
    header: "Status",
    className: "w-[160px]",
    render: (row) => <StatusBadge label={row.status.label} tone={row.status.tone} />,
  },
  {
    key: "serviceCount",
    header: "Services",
    render: (row) => `${row.serviceCount} service${row.serviceCount === 1 ? "" : "s"}`,
  },
];

/* Services inside a stack — reached from a stack's "View Detail". Each
   row's `detail` block is what the service's own detail page (reached
   from *this* row's "View Detail") renders — container/runtime config,
   connection info, and canned log output. */
export const SERVICE_ROWS = [
  {
    id: "svc-1",
    name: "web",
    status: { label: "Running", tone: "green" },
    image: "nginx:1.27-alpine",
    port: "80 → 8080",
    replicas: "2 / 2",
    detail: {
      containerImage: "nginx:1.27-alpine",
      replica: "2",
      restartPolicy: { condition: "On", delay: "5 Second", maxAttempts: "3", window: "30 Second" },
      resource: { cpu: "1 Core", memory: "512 MB" },
      hostName: "web-frontend.cloudplus.app",
      domainGenerate: "web-frontend.cloudplus.app",
      repository: "https://github.com/cloudplus/web-frontend",
      env: [
        { key: "NODE_ENV", value: "production" },
        { key: "PORT", value: "8080" },
      ],
      log: [
        "Starting nginx 1.27-alpine …",
        "nginx: configuration file /etc/nginx/nginx.conf test is successful",
        "2/2 replicas healthy",
        "GET / 200 12ms",
        "GET /assets/app.js 200 4ms",
      ],
      statusLog: [
        "[Aug 18 09:02] Deployment rolled out — 2/2 replicas ready",
        "[Aug 18 09:02] Health check passed on both replicas",
        "[Aug 12 14:20] Restarted after config update",
      ],
    },
  },
  {
    id: "svc-2",
    name: "api",
    status: { label: "Running", tone: "green" },
    image: "cloudplus/api:2.4.1",
    port: "3000 → 3000",
    replicas: "1 / 1",
    detail: {
      containerImage: "cloudplus/api:2.4.1",
      replica: "1",
      restartPolicy: { condition: "On", delay: "10 Second", maxAttempts: "5", window: "30 Second" },
      resource: { cpu: "1 Core", memory: "1 GB" },
      // Internal-only — reached from "web" inside the stack, not from
      // the outside, so unlike "web" it gets no public domain of its
      // own (a stack's domain belongs to whichever one service is its
      // ingress, not every service in it).
      hostName: "NONE",
      domainGenerate: "NONE",
      repository: "https://github.com/cloudplus/api-gateway",
      env: [
        { key: "NODE_ENV", value: "production" },
        { key: "DATABASE_URL", value: "••••••••" },
        { key: "PORT", value: "3000" },
      ],
      log: [
        "Server listening on port 3000",
        "Connected to database cluster",
        "POST /v1/auth/login 200 84ms",
        "GET /v1/users/me 200 21ms",
      ],
      statusLog: [
        "[Aug 18 09:00] Deployment rolled out — 1/1 replica ready",
        "[Aug 15 11:47] Scaled from 2 to 1 replica",
      ],
    },
  },
  {
    id: "svc-3",
    name: "redis",
    status: { label: "Stopped", tone: "red" },
    image: "redis:7.4-alpine",
    port: "6379 → 6379",
    replicas: "0 / 1",
    detail: {
      containerImage: "zeng/jerry",
      replica: "2",
      restartPolicy: { condition: "On", delay: "12 Second", maxAttempts: "5", window: "12 Second" },
      resource: { cpu: "2 Core", memory: "256 MB" },
      hostName: "NONE",
      domainGenerate: "NONE",
      repository: "https://github.com/alpinel",
      env: [{ key: "REDIS_PASSWORD", value: "••••••••" }],
      log: [
        "THE DEFAULT INTERACTIVE SHELL IS NOW ZSH.",
        "TO UPDATE YOUR ACCOUNT TO USE ZSH, PLEASE RUN `CHSH -S /BIN/ZSH`.",
        "FOR MORE DETAILS, PLEASE VISIT HTTPS://SUPPORT.APPLE.COM/KB/HT208050.",
        "",
        "====================================================================",
        "WRITING COVERAGE OBJECT [/HOME/RUNNER/BUILD/EXPRESSJS/EXPRESS/COVERAGE/COVERAGE.JSON]",
        "WRITING COVERAGE REPORTS AT [/HOME/RUNNER/BUILD/EXPRESSJS/EXPRESS/COVERAGE]",
        "====================================================================",
        "",
        "==================== COVERAGE SUMMARY====================",
        "STATEMENTS : 98.81% ( 1916/1939 ), 38",
        "IGNORED BRANCHES : 94.58% ( 751/794 ), 22",
        "IGNORED FUNCTIONS : 100% ( 267/267 )",
        " LINES : 100% ( 1872/1872 )",
        "====================================================================",
        "THE COMMAND \"NPM RUN TEST-CI\" EXITED WITH 0.",
        "",
        "$ NPM RUN LINT",
        "",
        "> EXPRESS@4.17.1 LINT /HOME/RUNNER/BUILD/EXPRESS/EXPRESS",
        "> ESLINT . THE COMMAND \"NPM RUN LINT\" EXITED WITH 0.",
        "",
        "STORE BUILD CACHE $",
      ],
      statusLog: [
        "[Aug 18 08:40] Service stopped manually",
        "[Aug 17 22:15] Restart limit reached — held stopped",
        "[Aug 17 21:58] Crashed — exit code 137",
      ],
    },
  },
];

export const SERVICE_COLUMNS: Array<{
  key: string;
  header: string;
  className?: string;
  render?: (row: (typeof SERVICE_ROWS)[number]) => ReactNode;
}> = [
  {
    key: "name",
    header: "Service Name",
    className: "w-[180px] font-medium text-zinc-900 dark:text-zinc-100",
  },
  {
    key: "status",
    header: "Status",
    className: "w-[140px]",
    render: (row) => <StatusBadge label={row.status.label} tone={row.status.tone} />,
  },
  { key: "image", header: "Image", className: "w-[220px] font-mono text-[13px]" },
  { key: "port", header: "Port", className: "w-[140px] whitespace-nowrap font-mono text-[13px]" },
  { key: "replicas", header: "Replicas", className: "whitespace-nowrap font-mono text-[13px]" },
];

/* Run App's right-hand rail. Mirrors Storage's Usage panel, but carries
   the subscription — so the stack list needs no Subscriptions tab. */
export function RunAppSubscriptionPanel({
  onNewSubscription,
}: {
  onNewSubscription?: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
        <BillingDashboardButton compact />
      </div>
      <p className="-mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">02 JUL - 02 AUG</p>

      <ServicePlanCard planName="Basic" stats={RUNAPP_PLAN_STATS} showFooter={false} />

      <div className="grid grid-cols-2 gap-4">
        <RadialGauge label="CPU" value={0.5} max={1} unit="CORE" />
        <RadialGauge label="RAM" value={512} max={1024} unit="MB" />
      </div>

      <Button
        variant="outline"
        onClick={onNewSubscription}
        className="h-9 w-full text-sm"
      >
        New Subscription
      </Button>
    </div>
  );
}

export const RUNAPP_PLAN_STATS = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Pricing", "36,000 KHR/mo"],
  ["CPU", "1 CORE"],
  ["RAM", "1 GB"],
  ["Transfer", "2 TB"],
];

/* One Run App subscription's stacks, with that subscription's plan and
   usage in the right rail — the step between the subscription list and a
   stack's services. */
export function StackListPage({
  subscriptionNumber,
  onBack,
  onViewStack,
  onNewSubscription,
  onCreateStack,
  createdStack,
}: {
  subscriptionNumber: string;
  onBack: () => void;
  onViewStack: (stackName: string) => void;
  onNewSubscription?: () => void;
  onCreateStack: () => void;
  // A stack handed back from the full-page Create Run App flow (router
  // state, since this list's rows are otherwise just local sample data
  // with no shared store) — merged in on mount so it shows up right
  // after creating it.
  createdStack?: (typeof STACK_ROWS)[number] | null;
}) {
  // Local to this subscription's view — each StackListRoute mount starts
  // fresh from the sample STACK_ROWS, same as Storage's bucket list.
  const [rows, setRows] = useState(() =>
    createdStack ? [...STACK_ROWS, createdStack] : STACK_ROWS
  );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Subscriptions
      </button>

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Subscription {subscriptionNumber}
      </h1>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <ResourceListView
            columns={STACK_COLUMNS}
            rows={rows}
            createLabel="New Stack"
            emptyTitle="No stacks yet"
            emptyDescription="Deploy your first stack and it will show up here."
            onViewDetail={onViewStack}
            onCreate={onCreateStack}
            onDelete={(row) => setRows((prev) => prev.filter((r) => r.id !== row.id))}
          />
        </div>
        <RunAppSubscriptionPanel onNewSubscription={onNewSubscription} />
      </div>
    </div>
  );
}

export function ServiceListPage({
  stackName,
  onBack,
  onViewService,
}: {
  stackName: string;
  onBack: () => void;
  onViewService: (serviceName: string) => void;
}) {
  const [rows, setRows] = useState(SERVICE_ROWS);
  const [createOpen, setCreateOpen] = useState(false);

  function createService(fields: NewServiceFields) {
    setRows((prev) => [
      ...prev,
      {
        id: `svc-${Date.now()}`,
        name: fields.name,
        status: fields.autoStart ? { label: "Deploying", tone: "blue" } : { label: "Stopped", tone: "zinc" },
        image: fields.image,
        port: "—",
        replicas: fields.autoStart ? `${fields.replica} / ${fields.replica}` : `0 / ${fields.replica}`,
        detail: {
          containerImage: fields.image,
          replica: fields.replica,
          restartPolicy: { condition: "On", delay: "5 Second", maxAttempts: "3", window: "30 Second" },
          resource: fields.resourcePreset,
          hostName: fields.hostName || "NONE",
          domainGenerate: fields.hostName || "NONE",
          repository: fields.repository || "—",
          env: fields.env,
          log: fields.autoStart ? ["Deploying …"] : ["Not started."],
          statusLog: [`[Just now] Service created`],
        },
      },
    ]);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Stack List
      </button>

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        {stackName}
      </h1>

      <div className="mt-5">
        {/* Domain and CNAME now live on each service's own detail page
            (they're per-service, not per-stack) rather than a shared
            rail here — this list is just the services themselves. */}
        <ResourceListView
          columns={SERVICE_COLUMNS}
          rows={rows}
          createLabel="New Service"
          emptyTitle="No services yet"
          emptyDescription="Add a service to this stack and it will show up here."
          onViewDetail={onViewService}
          onCreate={() => setCreateOpen(true)}
          onDelete={(row) => setRows((prev) => prev.filter((r) => r.id !== row.id))}
        />
      </div>

      <CreateServiceDrawer open={createOpen} onOpenChange={setCreateOpen} onCreate={createService} />
    </div>
  );
}
