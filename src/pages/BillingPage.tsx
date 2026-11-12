import { useState } from "react";
import type { ReactNode } from "react";
import { CircleX, Eye, Settings2 } from "lucide-react";

import { Calendar } from "@/components/animate-ui/icons/calendar";
import { Coins } from "@/components/animate-ui/icons/coins";
import { Gem } from "@/components/animate-ui/icons/gem";
import { History } from "@/components/animate-ui/icons/history";
import { ListFilter } from "@/components/animate-ui/icons/list-filter";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

import {
  CopyIconButton,
  PAGINATION_CONTROLS,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  RefreshIconButton,
  SearchField,
  StatusBadge,
} from "../components/atoms";
import {
  BILLING_CATEGORIES,
  BILLING_RECORDS,
  BILLING_TRANSACTIONS,
  WALLET_TABS,
  type BillingCategoryKey,
  type BillingRecord,
  type BillingTransaction,
} from "../data/billing";
import { useAccountBalance } from "../context/AccountBalanceContext";
import { formatScheduleDate, usePlanSchedule } from "../context/PlanScheduleContext";
import { getTierTheme } from "../data/pricing";
import type { PlanStat } from "../components/PlanCards";
import { STACK_ROWS, RUNAPP_PLAN_STATS } from "./runapp/RunAppComponents";
import { DATABASE_INSTANCES, DATABASE_SUBSCRIPTION_STATS } from "./database/DatabaseInstanceDetailPage";
import { STORAGE_BUCKET_ROWS, STORAGE_PLAN_STATS } from "./storage/StoragePanel";
import { useFirstUser } from "../firstusersrc/FirstUserContext";

/* Every "Upgrade Plan" schedule is keyed per-instance (see
   PlanScheduleContext / AppRoutes) — "database:DB Instance 1",
   "runapp:1", "storage". Billing's own record ids ("bill-database-1",
   "bill-runapp-1", "bill-storage") carry the same subscription number,
   so this just re-derives the same key from the id instead of Billing
   inventing its own scheme. */
function scheduleKeyFor(record: BillingRecord): string {
  const n = record.id.match(/-(\d+)$/)?.[1];
  if (record.category === "database") return `database:DB Instance ${n}`;
  if (record.category === "runapp") return `runapp:${n}`;
  return "storage";
}

/* The actual services this billing record's subscription contains —
   Run App's stacks, the one DB instance, or (Storage being a single
   shared subscription) every bucket — so Manage can show what you're
   actually about to cancel/terminate instead of just a bill line. */
function serviceNamesFor(record: BillingRecord): string[] {
  const n = Number(record.id.match(/-(\d+)$/)?.[1] ?? "1");
  if (record.category === "runapp") {
    return STACK_ROWS.filter((s) => s.subscriptionNumber === n).map((s) => s.name);
  }
  if (record.category === "database") {
    const instance = DATABASE_INSTANCES[`DB Instance ${n}`];
    return instance ? [instance.name] : [];
  }
  return STORAGE_BUCKET_ROWS.map((b) => b.name);
}

// What each service actually is — shown in the card-preview dialog
// opened from the Plan column's info icon.
const CATEGORY_INFO: Record<BillingRecord["category"], string> = {
  storage: "Object storage for files, media, and static assets.",
  runapp: "Deploy and run containerized apps as stacks.",
  database: "A managed database instance with automatic backups.",
};

// Reuses that feature's own subscription-card stats shape (CPU/RAM/
// Transfer etc. — illustrative, same as everywhere else in this mock)
// but swaps in the real Status/Renews On/Price from this billing
// record, so the preview isn't just a disconnected copy of the row.
function statsForRecord(record: BillingRecord): PlanStat[] {
  const base =
    record.category === "runapp"
      ? RUNAPP_PLAN_STATS
      : record.category === "database"
      ? DATABASE_SUBSCRIPTION_STATS
      : STORAGE_PLAN_STATS;

  return base.map(([label, value, toneClass]) => {
    if (label === "Status") {
      return [
        label,
        record.status.label,
        record.status.tone === "green" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
      ];
    }
    if (label === "Renews On") return [label, record.renewsOn];
    if (label === "Price" || label === "Pricing") {
      return [label, record.amount === 0 ? "FREE" : `${record.amount.toLocaleString()} ${record.currency}/mo`];
    }
    return [label, value, toneClass];
  });
}

// The resource rows only (Status/Renews On/Price live in the summary
// header instead) — what the "Plan Specifications" table in the detail
// popup actually lists.
function specsForRecord(record: BillingRecord): PlanStat[] {
  return statsForRecord(record).filter(
    ([label]) => label !== "Status" && label !== "Renews On" && label !== "Price" && label !== "Pricing"
  );
}

// The real transaction this subscription's last bill posted as — same
// category+plan match preferred, falling back to any transaction in
// that category — so "Additional Information" shows a real txn hash
// and tax rate instead of inventing one.
function transactionFor(record: BillingRecord): BillingTransaction | undefined {
  return (
    BILLING_TRANSACTIONS.find((t) => t.category === record.category && t.plan === record.plan) ??
    BILLING_TRANSACTIONS.find((t) => t.category === record.category)
  );
}

// Every status a subscription can actually be in — drives the Status
// field's own Value dropdown in the advanced filter builder below.
const SUBSCRIPTION_STATUS_OPTIONS = ["Active", "Schedule cancel", "Cancelled"];

/* Pagination footer — visual parity only; the underlying data isn't
   actually paginated, so the controls are static/disabled. */
function PaginationFooter({ total }: { total: number }) {
  return (
    <div className="flex h-8 items-center justify-between text-[13px] text-zinc-500 dark:text-zinc-400">
      <p>
        0 of {total} row(s) selected.
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value="10" onValueChange={() => {}}>
            <SelectTrigger className="h-7 w-14 border-zinc-200 dark:border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span>Page 1 of 1</span>
        <div className="flex items-center gap-1">
          {PAGINATION_CONTROLS.map(({ Icon, label }) => (
            <Button
              key={label}
              variant="outline"
              size="icon"
              disabled
              aria-label={label}
              className="h-7 w-7 border-zinc-200 dark:border-zinc-800"
            >
              <Icon className="h-3.5 w-3.5" animateOnHover animateOnTap />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Advanced filter builder — Field / Operator / Value rows, replacing
 * the old pair of plain Service/Status Selects with one "Add filter"
 * affordance that can stack several conditions (AND'd together).
 * ------------------------------------------------------------------ */

interface FilterFieldConfig {
  key: string;
  label: string;
  operators: string[];
  // A fixed set of valid values renders the Value field as a Select
  // instead of free text — omit it for an open Input (Plan, Amount).
  valueOptions?: string[];
}

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

function makeFilterRow(fields: FilterFieldConfig[]): FilterRow {
  const first = fields[0];
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    field: first.key,
    operator: first.operators[0],
    value: "",
  };
}

const SUBSCRIPTION_SERVICE_OPTIONS = BILLING_CATEGORIES.filter((c) => c.key !== "all").map((c) => c.label);

const SUBSCRIPTION_FILTER_FIELDS: FilterFieldConfig[] = [
  { key: "service", label: "Service", operators: ["is", "is not"], valueOptions: SUBSCRIPTION_SERVICE_OPTIONS },
  { key: "status", label: "Status", operators: ["is", "is not"], valueOptions: SUBSCRIPTION_STATUS_OPTIONS },
  { key: "plan", label: "Plan", operators: ["contains"] },
  { key: "amount", label: "Amount", operators: ["equals", "greater than", "less than"] },
];

function matchesSubscriptionFilter(
  r: BillingRecord,
  filter: FilterRow,
  categoryLabel: (key: BillingCategoryKey) => string
): boolean {
  if (!filter.value.trim()) return true;
  switch (filter.field) {
    case "service": {
      const label = categoryLabel(r.category);
      return filter.operator === "is" ? label === filter.value : label !== filter.value;
    }
    case "status":
      return filter.operator === "is" ? r.status.label === filter.value : r.status.label !== filter.value;
    case "plan":
      return r.plan.toLowerCase().includes(filter.value.trim().toLowerCase());
    case "amount": {
      const num = Number(filter.value);
      if (Number.isNaN(num)) return true;
      if (filter.operator === "equals") return r.amount === num;
      if (filter.operator === "greater than") return r.amount > num;
      return r.amount < num;
    }
    default:
      return true;
  }
}

const TRANSACTION_TYPE_OPTIONS = ["Subscription", "Renewal Subscription", "Upgrade Subscription"];
const PAYMENT_STATUS_OPTIONS = ["Paid", "Pending", "Failed"];

const TRANSACTION_FILTER_FIELDS: FilterFieldConfig[] = [
  { key: "service", label: "Service", operators: ["is", "is not"], valueOptions: SUBSCRIPTION_SERVICE_OPTIONS },
  { key: "type", label: "Type", operators: ["is", "is not"], valueOptions: TRANSACTION_TYPE_OPTIONS },
  { key: "plan", label: "Plan", operators: ["contains"] },
  { key: "payment", label: "Payment", operators: ["is", "is not"], valueOptions: PAYMENT_STATUS_OPTIONS },
  { key: "amount", label: "Amount", operators: ["equals", "greater than", "less than"] },
];

function matchesTransactionFilter(
  r: BillingTransaction,
  filter: FilterRow,
  categoryLabel: (key: BillingCategoryKey) => string
): boolean {
  if (!filter.value.trim()) return true;
  switch (filter.field) {
    case "service": {
      const label = categoryLabel(r.category);
      return filter.operator === "is" ? label === filter.value : label !== filter.value;
    }
    case "type":
      return filter.operator === "is" ? r.type === filter.value : r.type !== filter.value;
    case "plan":
      return r.plan.toLowerCase().includes(filter.value.trim().toLowerCase());
    case "payment":
      return filter.operator === "is" ? r.payment === filter.value : r.payment !== filter.value;
    case "amount": {
      const num = Number(filter.value);
      if (Number.isNaN(num)) return true;
      const total = r.amount + r.tax;
      if (filter.operator === "equals") return total === num;
      if (filter.operator === "greater than") return total > num;
      return total < num;
    }
    default:
      return true;
  }
}

function FilterBuilderPanel({
  fields,
  rows,
  onChange,
  onCancel,
  onApply,
}: {
  fields: FilterFieldConfig[];
  rows: FilterRow[];
  onChange: (rows: FilterRow[]) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  function updateRow(id: string, patch: Partial<FilterRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-2 w-[440px] rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-2 border-l-2 border-[#1C75BC] pl-3">
        {rows.map((row) => {
          const fieldConfig = fields.find((f) => f.key === row.field) ?? fields[0];
          const valueOptions = fieldConfig.valueOptions ?? null;
          return (
            <div key={row.id} className="flex items-center gap-2">
              <Select
                value={row.field}
                onValueChange={(v) => {
                  const next = fields.find((f) => f.key === v) ?? fields[0];
                  updateRow(row.id, { field: next.key, operator: next.operators[0], value: "" });
                }}
              >
                <SelectTrigger className="h-9 w-[110px] shrink-0 text-[13px]">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={row.operator} onValueChange={(v) => updateRow(row.id, { operator: v })}>
                <SelectTrigger className="h-9 w-[110px] shrink-0 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldConfig.operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {valueOptions ? (
                <Select value={row.value} onValueChange={(v) => updateRow(row.id, { value: v })}>
                  <SelectTrigger className="h-9 flex-1 text-[13px]">
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    {valueOptions.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={row.value}
                  onChange={(e) => updateRow(row.id, { value: e.target.value })}
                  placeholder="Value"
                  type={row.field === "amount" ? "number" : "text"}
                  className="h-9 flex-1 text-[13px]"
                />
              )}

              <button
                type="button"
                aria-label="Remove filter"
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <Trash2 className="h-4 w-4" animateOnHover animateOnTap />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange([...rows, makeFilterRow(fields)])}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
      >
        <Plus className="h-3.5 w-3.5" animateOnHover animateOnTap />
        Add filter
      </button>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear all
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} className="h-8 px-3 text-sm">
            Cancel
          </Button>
          <Button variant="brand" onClick={onApply} className="h-8 px-3 text-sm">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Manage dialog — replaces the old bare Cancel/Resume buttons. Options
 * depend on where the subscription is today: Active offers Schedule
 * cancel / Terminate; already-scheduled-to-cancel offers Resume /
 * Terminate instead. Terminate's own description carries the warning,
 * so there's no second destructive confirm layered on top of this one.
 * ------------------------------------------------------------------ */

type ManageAction = "schedule" | "resume" | "terminate";

function ManageSubscriptionDialog({
  record,
  onOpenChange,
  onSchedule,
  onResume,
  onTerminate,
}: {
  record: BillingRecord | null;
  onOpenChange: (open: boolean) => void;
  onSchedule: () => void;
  onResume: () => void;
  onTerminate: () => void;
}) {
  const isScheduled = record?.status.label === "Schedule cancel";
  const [choice, setChoice] = useState<ManageAction>("schedule");

  // Re-seed the default choice (the milder option) every time a new
  // record opens, rather than carrying over whatever was picked last.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (record && record.id !== openedFor) {
    setOpenedFor(record.id);
    setChoice(isScheduled ? "resume" : "schedule");
  }

  if (!record) return null;

  const theme = getTierTheme(record.plan);
  const serviceNames = serviceNamesFor(record);

  const primaryLabel =
    choice === "schedule" ? "Schedule Cancel" : choice === "resume" ? "Resume Subscription" : "Terminate Permanently";

  function confirm() {
    if (choice === "schedule") onSchedule();
    else if (choice === "resume") onResume();
    else onTerminate();
    onOpenChange(false);
  }

  return (
    <Dialog open={record != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Subscription Settings</DialogTitle>
          <DialogDescription>Manage how this subscription ends.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{record.name}</p>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{record.plan}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5" animateOnView />
              {isScheduled ? `Won't renew after ${record.renewsOn}` : `Renews ${record.renewsOn}`}
            </div>
          </div>
          {serviceNames.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {serviceNames.map((name) => (
                <span
                  key={name}
                  className={"rounded-full px-2.5 py-1 text-[12px] font-medium " + theme.chip + " " + theme.icon}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {!isScheduled ? (
            <ManageOptionCard
              icon={History}
              title="Schedule cancel"
              description="Keep using it until the billing period ends, then it won't renew."
              selected={choice === "schedule"}
              onSelect={() => setChoice("schedule")}
            />
          ) : (
            <ManageOptionCard
              icon={History}
              title="Resume"
              description="Undo the scheduled cancellation — it goes back to Active and renews as usual."
              selected={choice === "resume"}
              onSelect={() => setChoice("resume")}
            />
          )}
          <ManageOptionCard
            icon={CircleX}
            iconClassName="text-red-500"
            title="Terminate permanently"
            titleClassName="text-red-600 dark:text-red-400"
            description={`Delete this subscription now. ${record.name} stops immediately and cannot be restored.`}
            selected={choice === "terminate"}
            onSelect={() => setChoice("terminate")}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">
            Close
          </Button>
          <Button
            variant={choice === "terminate" ? "destructive" : "brand"}
            onClick={confirm}
            className="h-9 text-sm"
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Opened from the Plan column's eye icon — a denser, read-only summary
   than the Manage dialog: every field on the bill in one place (dates,
   specs, tax, the transaction it last posted as) instead of spread
   across the table's columns. Dark surface on purpose — reads as a
   receipt/statement, distinct from the rest of the app's light UI. */
function SubscriptionDetailsDialog({
  record,
  onOpenChange,
}: {
  record: BillingRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!record) return null;

  const txn = transactionFor(record);
  const specs = specsForRecord(record);

  const infoRows: [string, ReactNode][] = [
    ["Service", BILLING_CATEGORIES.find((c) => c.key === record.category)?.label ?? record.category],
    ["Plan", record.plan],
    ["Billing Cycle", "Monthly"],
    ["Status", <StatusBadge key="status" label={record.status.label} tone={record.status.tone} />],
    ["Subscribed Since", record.subscribedSince],
    ["Start Date", record.periodStart],
    ["End Date", record.renewsOn],
    ["Next Renewal", record.renewsOn],
  ];

  return (
    <Dialog open={record != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Subscription Details</DialogTitle>
            <StatusBadge label={record.status.label} tone={record.status.tone} />
          </div>
        </DialogHeader>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Service</p>
          <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
            {BILLING_CATEGORIES.find((c) => c.key === record.category)?.label ?? record.category}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {record.amount === 0 ? "FREE" : `${record.amount.toLocaleString()} ${record.currency}`}
          </p>
          <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">{record.plan} Plan · Monthly</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Subscription Information</p>
          <div className="mt-2 divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
            {infoRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {specs.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Plan Specifications</p>
            <div className="mt-2 divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3 py-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <span>Resource</span>
                <span>Limit</span>
              </div>
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Additional Information</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
            <li>
              Subscription ID:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {record.id}
              </code>
            </li>
            {txn && (
              <li>
                Transaction Hash:{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {truncateHash(txn.txnHash)}
                </code>
              </li>
            )}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageOptionCard({
  icon: Icon,
  iconClassName,
  title,
  titleClassName,
  description,
  selected,
  onSelect,
}: {
  icon: (props: { className?: string; animateOnView?: boolean }) => ReactNode;
  iconClassName?: string;
  title: string;
  titleClassName?: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left motion-safe:transition-colors " +
        (selected
          ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-zinc-800">
        <Icon className={"h-4 w-4 " + (iconClassName ?? "text-[#1C75BC] dark:text-[#6FA8D8]")} animateOnView />
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block text-sm font-semibold text-zinc-900 dark:text-zinc-100 " + (titleClassName ?? "")}>
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] text-zinc-500 dark:text-zinc-400">{description}</span>
      </span>
      <span
        className={
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " +
          (selected ? "border-[#1C75BC] bg-[#1C75BC]" : "border-zinc-300 dark:border-zinc-600")
        }
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

function SubscriptionTab() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterRow[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  // First User mode previews a brand-new account — no subscriptions to
  // bill for yet — so the whole tab reads off an empty list instead of
  // the placeholder BILLING_RECORDS.
  const { isFirstUser } = useFirstUser();
  // Schedule cancel/Resume/Terminate are the only actions that ever
  // change a subscription's status, so only that override needs to live
  // in state — everything else still reads straight from BILLING_RECORDS.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BillingRecord["status"]>>({});
  const [manageTargetId, setManageTargetId] = useState<string | null>(null);
  const [detailsTargetId, setDetailsTargetId] = useState<string | null>(null);
  const { getSchedule } = usePlanSchedule();
  const { creditKHR, debitKHR, creditBG, debitBG } = useAccountBalance();
  const records = (isFirstUser ? [] : BILLING_RECORDS).map((r) =>
    statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r
  );
  const manageTarget = records.find((r) => r.id === manageTargetId) ?? null;
  const detailsTarget = records.find((r) => r.id === detailsTargetId) ?? null;

  const categoryLabel = (key: BillingCategoryKey) =>
    BILLING_CATEGORIES.find((c) => c.key === key)?.label ?? key;

  const filtered = records.filter((r) => {
    if (!filters.every((f) => matchesSubscriptionFilter(r, f, categoryLabel))) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.plan.toLowerCase().includes(q) ||
      categoryLabel(r.category).toLowerCase().includes(q)
    );
  });

  // The summary always covers every Active subscription regardless of
  // what's filtered in the table below — filtering is about finding a
  // row, not about changing what actually renews next month.
  const activeRows = records.filter((r) => r.status.label === "Active");
  const totalKHR = activeRows
    .filter((r) => r.currency === "KHR")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalBG = activeRows
    .filter((r) => r.currency === "BG")
    .reduce((sum, r) => sum + r.amount, 0);

  function openFilterPanel() {
    setDraftFilters(filters.length > 0 ? filters : [makeFilterRow(SUBSCRIPTION_FILTER_FIELDS)]);
    setFilterPanelOpen(true);
  }

  return (
    <div>
      {/* Search + advanced filter — "Add filter" opens a Field/Operator/
          Value builder instead of a fixed Service/Status Select pair, so
          any column can be filtered, not just those two. */}
      <div className="flex items-center gap-2">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subscriptions"
        />
        <RefreshIconButton />
        <div className="relative shrink-0">
          <Button
            variant="outline"
            onClick={() => (filterPanelOpen ? setFilterPanelOpen(false) : openFilterPanel())}
            className="h-9 gap-1.5 text-sm"
          >
            <ListFilter className="h-4 w-4" animateOnHover animateOnTap />
            Add filter
            {filters.length > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1C75BC] px-1 text-[11px] font-semibold text-white dark:bg-[#6FA8D8] dark:text-zinc-900">
                {filters.length}
              </span>
            )}
          </Button>
          {filterPanelOpen && (
            <FilterBuilderPanel
              fields={SUBSCRIPTION_FILTER_FIELDS}
              rows={draftFilters}
              onChange={setDraftFilters}
              onCancel={() => setFilterPanelOpen(false)}
              onApply={() => {
                setFilters(draftFilters.filter((f) => f.value.trim() !== ""));
                setFilterPanelOpen(false);
              }}
            />
          )}
        </div>
      </div>

      {/* Summary for Renew Next Month — what these Active subscriptions
          will charge at their next renewal, split by currency. */}
      <Card className="mt-5">
        <CardTitle>Summary for Renew Next Month</CardTitle>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Active subscriptions only — paused ones aren't charged.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" animateOnView />
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalKHR.toLocaleString()}{" "}
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">KHR</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalBG.toLocaleString()}{" "}
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">BG</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="text-zinc-500 dark:text-zinc-400">Service</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Plan</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Subscribed Since
              </TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Start – End Date
              </TableHead>
              <TableHead className="w-px text-right text-zinc-500 dark:text-zinc-400">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const cat = BILLING_CATEGORIES.find((c) => c.key === r.category);
                const isTerminated = r.status.label === "Cancelled";
                const scheduledUpgrade = getSchedule(scheduleKeyFor(r));
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        {cat?.icon && (
                          <cat.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" animateOnView />
                        )}
                        {r.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <p>{r.plan}</p>
                        <button
                          type="button"
                          onClick={() => setDetailsTargetId(r.id)}
                          aria-label={`View ${r.name}'s subscription details`}
                          className="shrink-0 text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:hover:text-zinc-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {scheduledUpgrade && (
                        <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          Upgrading to {scheduledUpgrade.tierName} on {formatScheduleDate(scheduledUpgrade.date)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.amount === 0 ? "FREE" : `${r.amount.toLocaleString()} ${r.currency}/mo`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={r.status.label} tone={r.status.tone} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.subscribedSince}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.periodStart} – {r.renewsOn}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        disabled={isTerminated}
                        onClick={() => setManageTargetId(r.id)}
                        className="h-8 gap-1.5 px-3 text-xs"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Receipt
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                      animateOnView
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {isFirstUser ? "No subscriptions yet" : "No matching subscriptions"}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {isFirstUser
                        ? "Subscribe to a plan to see it billed here."
                        : "Try a different search term or category."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5">
        <PaginationFooter total={filtered.length} />
      </div>

      <ManageSubscriptionDialog
        record={manageTarget}
        onOpenChange={(open) => !open && setManageTargetId(null)}
        onSchedule={() => {
          if (!manageTarget) return;
          setStatusOverrides((prev) => ({
            ...prev,
            [manageTarget.id]: { label: "Schedule cancel", tone: "amber" },
          }));
          if (manageTarget.currency === "BG") creditBG(manageTarget.amount);
          else creditKHR(manageTarget.amount);
        }}
        onResume={() => {
          if (!manageTarget) return;
          setStatusOverrides((prev) => ({
            ...prev,
            [manageTarget.id]: { label: "Active", tone: "green" },
          }));
          if (manageTarget.currency === "BG") debitBG(manageTarget.amount);
          else debitKHR(manageTarget.amount);
        }}
        onTerminate={() => {
          if (!manageTarget) return;
          // Already-Schedule-cancel subscriptions were credited back when
          // they were scheduled — only credit here if it was still Active.
          if (manageTarget.status.label === "Active") {
            if (manageTarget.currency === "BG") creditBG(manageTarget.amount);
            else creditKHR(manageTarget.amount);
          }
          setStatusOverrides((prev) => ({
            ...prev,
            [manageTarget.id]: { label: "Cancelled", tone: "red" },
          }));
        }}
      />

      <SubscriptionDetailsDialog
        record={detailsTarget}
        onOpenChange={(open) => !open && setDetailsTargetId(null)}
      />
    </div>
  );
}

// "61e56a2f...d1626c" — enough of each end to recognize/verify a hash
// without the full string crowding the row.
function truncateHash(hash: string): string {
  return hash.length > 14 ? `${hash.slice(0, 5)}...${hash.slice(-5)}` : hash;
}

function BillingTab() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterRow[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { isFirstUser } = useFirstUser();

  const categoryLabel = (key: BillingCategoryKey) =>
    BILLING_CATEGORIES.find((c) => c.key === key)?.label ?? key;

  const rows = (isFirstUser ? [] : BILLING_TRANSACTIONS).filter((r) => {
    if (!filters.every((f) => matchesTransactionFilter(r, f, categoryLabel))) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.txnHash.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false) ||
      r.plan.toLowerCase().includes(q) ||
      categoryLabel(r.category).toLowerCase().includes(q)
    );
  });

  function openFilterPanel() {
    setDraftFilters(filters.length > 0 ? filters : [makeFilterRow(TRANSACTION_FILTER_FIELDS)]);
    setFilterPanelOpen(true);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices"
        />
        <RefreshIconButton />
        <div className="relative shrink-0">
          <Button
            variant="outline"
            onClick={() => (filterPanelOpen ? setFilterPanelOpen(false) : openFilterPanel())}
            className="h-9 gap-1.5 text-sm"
          >
            <ListFilter className="h-4 w-4" animateOnHover animateOnTap />
            Add filter
            {filters.length > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1C75BC] px-1 text-[11px] font-semibold text-white dark:bg-[#6FA8D8] dark:text-zinc-900">
                {filters.length}
              </span>
            )}
          </Button>
          {filterPanelOpen && (
            <FilterBuilderPanel
              fields={TRANSACTION_FILTER_FIELDS}
              rows={draftFilters}
              onChange={setDraftFilters}
              onCancel={() => setFilterPanelOpen(false)}
              onApply={() => {
                setFilters(draftFilters.filter((f) => f.value.trim() !== ""));
                setFilterPanelOpen(false);
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Txn Hash</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Description</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Type</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Service</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Plan</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Tax</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Total</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Renew Date</TableHead>
              <TableHead className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Billing Date</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r) => {
                const cat = BILLING_CATEGORIES.find((c) => c.key === r.category);
                const total = r.amount + r.tax;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        {truncateHash(r.txnHash)}
                        <CopyIconButton value={r.txnHash} label="transaction hash" iconClassName="h-3.5 w-3.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {r.description ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.type}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        {cat?.icon && (
                          <cat.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" animateOnView />
                        )}
                        {cat?.label ?? r.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">{r.plan}</TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.amount === 0 ? "0 KHR" : `${r.amount.toLocaleString()} ${r.currency}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {r.tax === 0 ? "0 KHR" : `${r.tax.toLocaleString()} ${r.currency}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-zinc-900 dark:text-zinc-100">
                      {total === 0 ? "0 KHR" : `${total.toLocaleString()} ${r.currency}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.renewDate}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.billingDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={r.payment}
                        tone={r.payment === "Paid" ? "green" : r.payment === "Pending" ? "amber" : "red"}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={11} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Receipt
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                      animateOnView
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {isFirstUser ? "No transactions yet" : "No matching transactions"}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {isFirstUser
                        ? "Subscribe to a plan to see its charges billed here."
                        : "Try a different search term or filter."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5">
        <PaginationFooter total={rows.length} />
      </div>
    </div>
  );
}

// `tab`/`onTabChange` are controlled by the route (/billing/:tab) so each
// tab is its own shareable, bookmarkable URL rather than throwaway state.
// Payment methods + Top Up now live on their own Payment page — this
// page is just subscription and invoice history.
export function BillingPage({
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div>
      <div>
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Bill Subscription
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Every subscription's cost and past invoices, in one place.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="mt-5">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          {WALLET_TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className={PILL_TAB_TRIGGER_CLASS}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="subscription" className="mt-5">
          <SubscriptionTab />
        </TabsContent>
        <TabsContent value="invoice" className="mt-5">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
