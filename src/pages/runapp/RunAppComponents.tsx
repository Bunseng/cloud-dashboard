import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Info } from "@/components/animate-ui/icons/info";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Play } from "@/components/animate-ui/icons/play";
import { Rocket } from "@/components/animate-ui/icons/rocket";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Square } from "@/components/animate-ui/icons/square";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { ResourceListView } from "../../components/ResourceListView";
import { ServicePlanCard } from "../../components/PlanCards";
import {
  BillingDashboardButton,
  RadialGauge,
  StatusBadge,
} from "../../components/atoms";
import type { ScheduledPlanChange } from "../../context/PlanScheduleContext";
import { CreateServiceDrawer, EditServiceInfoDrawer, type NewServiceFields } from "./RunAppDialogs";

/* ------------------------------------------------------------------ *
 * Stack list (Run App) and Database list.
 *
 * FIRST PASS — the columns, statuses and sample rows below are a
 * suggestion, not a spec. They're deliberately data-driven so you can
 * add/remove/reorder columns by editing STACK_COLUMNS / SERVICE_COLUMNS
 * without touching the table itself.
 * ------------------------------------------------------------------ */

/* Sample rows — replace with API data. `projectId` ties each stack to
   one of data/projects.ts's Projects, so the list can filter down to
   just the active Project's stacks. `subscriptionNumber` ties it to one
   of Run App's own "Subscription N" slots, so each subscription shows
   only its own stacks instead of every stack in the account. */
export const STACK_ROWS = [
  {
    id: "stk-1",
    name: "web-frontend",
    status: { label: "Running", tone: "green" },
    serviceCount: 3,
    projectId: "proj-web",
    subscriptionNumber: 1,
  },
  {
    id: "stk-2",
    name: "api-gateway",
    status: { label: "Deploying", tone: "blue" },
    serviceCount: 2,
    projectId: "proj-api",
    subscriptionNumber: 2,
  },
  {
    id: "stk-3",
    name: "worker-queue",
    status: { label: "Stopped", tone: "zinc" },
    serviceCount: 1,
    projectId: "proj-worker",
    subscriptionNumber: 3,
  },
];

// A function rather than a plain array so the "View status" link can
// close over this render's own onViewStack — it jumps to the same place
// the row's "View Detail" action does.
function buildStackColumns(
  onViewStack: (stackName: string) => void
): Array<{
  key: string;
  header: string;
  className?: string;
  render?: (row: (typeof STACK_ROWS)[number]) => ReactNode;
}> {
  return [
    {
      key: "name",
      header: "Stack Name",
      className: "w-[260px] font-medium text-zinc-900 dark:text-zinc-100",
    },
    {
      key: "status",
      header: "Deployment",
      className: "w-[160px]",
      render: (row) => <StatusBadge label={row.status.label} tone={row.status.tone} />,
    },
    {
      key: "serviceCount",
      header: "Services",
      className: "whitespace-nowrap",
      render: (row) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          {row.serviceCount} service{row.serviceCount === 1 ? "" : "s"}
          <button
            type="button"
            onClick={() => onViewStack(row.name)}
            className="text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
          >
            View status
          </button>
        </span>
      ),
    },
  ];
}

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
      registryAuth: "public" as "public" | "private",
      registryId: "",
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
      registryAuth: "public" as "public" | "private",
      registryId: "",
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
      registryAuth: "public" as "public" | "private",
      registryId: "",
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
  {
    key: "domain",
    header: "Domain",
    className: "w-[220px]",
    // Host Name is this service's own address — not yet verified against
    // a real DNS record in this mock, hence the warning triangle, same
    // as Hetzner/Vercel flag an unconfirmed custom domain. Domain
    // Generate is the platform-issued fallback, always reachable, so it
    // renders as an actual link.
    render: (row) =>
      row.detail.hostName === "NONE" ? (
        <span className="text-zinc-400 dark:text-zinc-600">—</span>
      ) : (
        <div className="space-y-1 text-[13px]">
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="truncate">{row.detail.hostName}</span>
          </div>
          <a
            href={`https://${row.detail.domainGenerate}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
          >
            <span className="max-w-[160px] truncate">{row.detail.domainGenerate}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      ),
  },
  { key: "replicas", header: "Replicas", className: "whitespace-nowrap font-mono text-[13px]" },
];

/* Run App's right-hand rail. Mirrors Storage's Usage panel, but carries
   the subscription — so the stack list needs no Subscriptions tab. No
   "New Subscription" button here — that action lives on the Run App
   list page one level up, not inside a subscription's own stack list. */
export function RunAppSubscriptionPanel({
  onUpgrade,
  scheduledUpgrade,
  onCancelSchedule,
}: {
  onUpgrade?: () => void;
  scheduledUpgrade?: ScheduledPlanChange | null;
  onCancelSchedule?: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
        <BillingDashboardButton compact />
      </div>
      <p className="-mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">02 JUL - 02 AUG</p>

      <ServicePlanCard
        planName="Basic"
        stats={RUNAPP_PLAN_STATS}
        showFooter={false}
        onUpgrade={onUpgrade}
        scheduledUpgrade={scheduledUpgrade}
        onCancelSchedule={onCancelSchedule}
      />

      <div className="grid grid-cols-2 gap-4">
        <RadialGauge label="CPU" value={0.5} max={1} unit="CORE" />
        <RadialGauge label="RAM" value={512} max={1024} unit="MB" />
      </div>
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
  onUpgrade,
  scheduledUpgrade,
  onCancelSchedule,
  onCreateStack,
  onEditStack,
  createdStack,
  renamedStack,
}: {
  subscriptionNumber: string;
  onBack: () => void;
  onViewStack: (stackName: string) => void;
  onUpgrade?: () => void;
  scheduledUpgrade?: ScheduledPlanChange | null;
  onCancelSchedule?: () => void;
  onCreateStack: () => void;
  // Edit opens the same full-page Create Run App flow a new stack uses
  // (mode="edit"), not a bare rename dialog, so a stack's fields always
  // read the same way whether you're creating or editing it.
  onEditStack: (stackName: string) => void;
  // A stack handed back from the full-page Create/Edit Run App flow
  // (router state, since this list's rows are otherwise just local
  // sample data with no shared store) — merged in on mount so it shows
  // up right after creating or renaming it.
  createdStack?: (typeof STACK_ROWS)[number] | null;
  renamedStack?: { from: string; to: string } | null;
}) {
  // Local to this subscription's view — each StackListRoute mount starts
  // fresh from the sample STACK_ROWS, same as Storage's bucket list.
  const [rows, setRows] = useState(() => {
    const base = createdStack ? [...STACK_ROWS, createdStack] : STACK_ROWS;
    return renamedStack
      ? base.map((r) => (r.name === renamedStack.from ? { ...r, name: renamedStack.to } : r))
      : base;
  });

  // Filters the visible list down to this subscription's own stacks —
  // doesn't touch `rows` itself so status updates still apply correctly
  // if you switch to a different subscription mid-deploy. Each stack
  // belongs to exactly one subscription now, so there's no longer a
  // separate Project filter stacked on top here — that would just hide
  // a subscription's only stack whenever a different Project happens to
  // be active elsewhere.
  const subscriptionNum = Number(subscriptionNumber);
  const visibleRows = rows.filter((r) => r.subscriptionNumber === subscriptionNum);

  // Pull & Re-deploy / Pull & Restart flip a stack to "Deploying" and
  // settle back to "Running" a moment later, mirroring how a real deploy
  // would report status — cleaned up on unmount so a route change can't
  // trigger a state update after the component's gone.
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => pendingTimers.current.forEach(clearTimeout), []);

  function setStackStatus(id: string | number, status: { label: string; tone: string }) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function pullAndDeploy(id: string | number) {
    setStackStatus(id, { label: "Deploying", tone: "blue" });
    const timer = setTimeout(() => setStackStatus(id, { label: "Running", tone: "green" }), 1200);
    pendingTimers.current.push(timer);
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

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Subscription {subscriptionNumber}
      </h1>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <ResourceListView
            columns={buildStackColumns(onViewStack)}
            rows={visibleRows}
            createLabel="New Stack"
            emptyTitle="No stacks yet"
            emptyDescription="Deploy your first stack and it will show up here."
            onViewDetail={onViewStack}
            onCreate={onCreateStack}
            onEdit={(row) => onEditStack(row.name)}
            onDelete={(row) => setRows((prev) => prev.filter((r) => r.id !== row.id))}
            extraActions={(row) => {
              const isStopped = row.status.label === "Stopped";
              const isDeploying = row.status.label === "Deploying";
              return [
                {
                  key: "rebuild",
                  label: "Rebuild Stack",
                  icon: Rocket,
                  disabled: isDeploying,
                  hint: "Pulls the latest image and redeploys every service in this stack from scratch.",
                  onSelect: () => pullAndDeploy(row.id),
                },
                {
                  key: "pull-restart",
                  label: "Pull & Restart",
                  icon: RotateCw,
                  disabled: isDeploying,
                  hint: "Pulls the latest image and restarts every service without a full rebuild.",
                  onSelect: () => pullAndDeploy(row.id),
                },
                {
                  key: "stop",
                  label: "Stop",
                  icon: Square,
                  disabled: isStopped,
                  onSelect: () => setStackStatus(row.id, { label: "Stopped", tone: "zinc" }),
                },
              ];
            }}
          />
        </div>
        <RunAppSubscriptionPanel
          onUpgrade={onUpgrade}
          scheduledUpgrade={scheduledUpgrade}
          onCancelSchedule={onCancelSchedule}
        />
      </div>
    </div>
  );
}

export function ServiceListPage({
  stackName,
  onBack,
  onViewService,
  onEditStack,
  onDeleteStack,
}: {
  stackName: string;
  onBack: () => void;
  onViewService: (serviceName: string) => void;
  // Optional — only the Run App route wires these in (the Projects
  // route reuses this same page for a project's own services, where
  // "edit/delete the stack" doesn't apply).
  onEditStack?: () => void;
  onDeleteStack?: () => void;
}) {
  const [rows, setRows] = useState(SERVICE_ROWS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | number | null>(null);
  const [deleteStackOpen, setDeleteStackOpen] = useState(false);
  const editTarget = rows.find((r) => r.id === editTargetId) ?? null;

  const stackRow = STACK_ROWS.find((r) => r.name === stackName);
  const [stackStatus, setStackStatus] = useState(stackRow?.status ?? { label: "Running", tone: "green" });

  // Pull & Re-deploy / Pull & Restart flip a service to "Deploying" and
  // settle back to "Running" a moment later, same timing as the stack
  // list's own version above — cleaned up on unmount.
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => pendingTimers.current.forEach(clearTimeout), []);

  function setServiceStatus(id: string | number, status: { label: string; tone: string }) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function pullAndDeployService(id: string | number) {
    setServiceStatus(id, { label: "Deploying", tone: "blue" });
    const timer = setTimeout(() => setServiceStatus(id, { label: "Running", tone: "green" }), 1200);
    pendingTimers.current.push(timer);
  }

  // Stack Controls — operates on every service at once (not just what's
  // checked), settling the stack's own badge back to "Running" once
  // every service has, same timing/shape as a single service's own
  // Pull & Re-deploy above.
  function rebuildStack() {
    setStackStatus({ label: "Deploying", tone: "blue" });
    rows.forEach((r) => pullAndDeployService(r.id));
    const timer = setTimeout(() => setStackStatus({ label: "Running", tone: "green" }), 1200);
    pendingTimers.current.push(timer);
  }

  function stopOrStartStack() {
    const allStopped = rows.every((r) => r.status.label === "Stopped");
    rows.forEach((r) =>
      setServiceStatus(r.id, allStopped ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "red" })
    );
    setStackStatus(allStopped ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "zinc" });
  }

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
          registryAuth: fields.registryAuth,
          registryId: fields.registryId,
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

  const anyDeploying = rows.some((r) => r.status.label === "Deploying");
  const allStopped = rows.length > 0 && rows.every((r) => r.status.label === "Stopped");
  const runningCount = rows.filter((r) => r.status.label === "Running").length;
  const summaryText =
    rows.length === 0
      ? "No services yet"
      : runningCount === rows.length
      ? `All ${rows.length} service${rows.length === 1 ? "" : "s"} running`
      : runningCount === 0
      ? `All ${rows.length} service${rows.length === 1 ? "" : "s"} stopped`
      : `${runningCount} of ${rows.length} services running`;
  const summaryDotClassName = runningCount === rows.length && rows.length > 0 ? "bg-emerald-500" : runningCount === 0 ? "bg-zinc-400" : "bg-amber-500";

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to Stack List
      </button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {stackName}
          </h1>
          <StatusBadge label={stackStatus.label} tone={stackStatus.tone} />
        </div>
        {onEditStack && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={onEditStack} className="h-9 gap-1.5 text-sm">
              <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteStackOpen(true)}
              className="h-9 gap-1.5 text-sm"
            >
              <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Stack Controls — acts on every service at once, regardless of
          what's checked below, same spirit as the VPS instance page's
          own top-level power controls. */}
      <Card className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>Stack Controls</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Deploy, restart or stop every service in this stack at once.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${summaryDotClassName}`} />
              {summaryText}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  disabled={anyDeploying}
                  onClick={rebuildStack}
                  className="h-9 gap-1.5 text-sm"
                >
                  <Rocket className="h-3.5 w-3.5" animateOnHover animateOnTap />
                  Rebuild Stack
                  <Info className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-[12.5px] leading-snug">
                Pulls the latest image and redeploys every service in this stack from scratch.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  disabled={anyDeploying}
                  onClick={rebuildStack}
                  className="h-9 gap-1.5 text-sm"
                >
                  <RotateCw className="h-3.5 w-3.5" animateOnHover animateOnTap />
                  Pull & Restart
                  <Info className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-[12.5px] leading-snug">
                Pulls the latest image and restarts every service without a full rebuild.
              </TooltipContent>
            </Tooltip>
            <Button
              variant={allStopped ? "brand" : "destructive"}
              disabled={anyDeploying || rows.length === 0}
              onClick={stopOrStartStack}
              className="h-9 gap-1.5 text-sm"
            >
              {allStopped ? (
                <Play className="h-3.5 w-3.5" animateOnHover animateOnTap />
              ) : (
                <Square className="h-3.5 w-3.5" animateOnHover animateOnTap />
              )}
              {allStopped ? "Start" : "Stop"}
            </Button>
          </div>
        </div>
      </Card>

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
          onEdit={(row) => setEditTargetId(row.id)}
          onDelete={(row) => setRows((prev) => prev.filter((r) => r.id !== row.id))}
          deleteLabel="Remove"
          deleteTitle={(row) => `Remove ${row.name}?`}
          deleteDescription={(row) =>
            row.status.label === "Running"
              ? `"${row.name}" is currently running — removing it stops and deletes its container, and its domain stops resolving. This can't be undone.`
              : `This permanently deletes "${row.name}" and its container. This can't be undone.`
          }
        />
      </div>

      <CreateServiceDrawer open={createOpen} onOpenChange={setCreateOpen} onCreate={createService} />

      <ConfirmDialog
        open={deleteStackOpen}
        onOpenChange={setDeleteStackOpen}
        title={`Delete ${stackName}?`}
        description="This permanently removes the stack and every service in it. This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          setDeleteStackOpen(false);
          onDeleteStack?.();
        }}
      />

      <EditServiceInfoDrawer
        open={editTarget != null}
        onOpenChange={(open) => !open && setEditTargetId(null)}
        serviceName={editTarget?.name ?? ""}
        value={editTarget?.detail ?? SERVICE_ROWS[0].detail}
        running={editTarget?.status.label === "Running"}
        onRunningChange={(running) => {
          if (!editTarget) return;
          setServiceStatus(
            editTarget.id,
            running ? { label: "Running", tone: "green" } : { label: "Stopped", tone: "red" }
          );
        }}
        onSave={(next) => {
          if (!editTarget) return;
          setRows((prev) =>
            prev.map((r) =>
              r.id === editTarget.id
                ? {
                    ...r,
                    image: next.containerImage,
                    detail: { ...r.detail, ...next, domainGenerate: next.hostName || r.detail.domainGenerate },
                  }
                : r
            )
          );
        }}
      />
    </div>
  );
}
