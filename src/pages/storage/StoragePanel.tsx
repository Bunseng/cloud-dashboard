import { useState } from "react";
import { Files } from "@/components/animate-ui/icons/files";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
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

import { ServicePlanCard } from "../../components/PlanCards";
import { UserManagementTable } from "./UserManagement";
import {
  BillingDashboardButton,
  CopyIconButton,
  CredentialField,
  PAGINATION_CONTROLS,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  RadialGauge,
  RefreshIconButton,
  SearchField,
} from "../../components/atoms";

/* ------------------------------------------------------------------ *
 * Storage's right-hand "Usage" panel — plan summary, size/transfer
 * gauges, and API credentials. All values are placeholders (a fresh
 * account with 0 usage); wire in the real numbers once the API is ready.
 * ------------------------------------------------------------------ */

export const STORAGE_PLAN_STATS = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Storage Size", "1 GB"],
  ["Transfer", "100 GB"],
  ["Buckets", "1"],
];

export function StorageUsagePanel() {
  return (
    <div className="w-[320px] shrink-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Usage</h2>
        <BillingDashboardButton compact />
      </div>
      <p className="-mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">02 JUL - 02 AUG</p>

      <ServicePlanCard planName="Free" stats={STORAGE_PLAN_STATS} showFooter={false} />

      <div className="grid grid-cols-2 gap-4">
        <RadialGauge label="Size" value={0} max={1} unit="GB" />
        <RadialGauge label="Transfer" value={0} max={1024} unit="GB" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Username</h2>
        <Button
          variant="outline"
          className="h-9 shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          Generate New Key
        </Button>
      </div>
      <div className="space-y-2">
        <CredentialField label="Access Key" value="IXQ3AA8DB3MQ5H5IN1YGN1YGN" />
        <CredentialField label="Secret Key" value="IXQ3AA8IXQ3AA8DB3MQ5H5IN1" />
        <CredentialField label="Base URL" value="https://fsgw.sabay.test" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Storage / Buckets — the Storage tab's real content. "User Management"
 * shares the same table shell with different copy; wire in the real
 * bucket list and pagination once the API is ready.
 * ------------------------------------------------------------------ */

export interface StorageBucketRow {
  name: string;
  url: string;
}

export const STORAGE_BUCKET_ROWS: StorageBucketRow[] = [
  { name: "streamingbucket", url: "https://fsgw.sabay.test/streamingbucket" },
];

export function BucketsTable({
  emptyTitle,
  emptyDescription,
  rows = [],
  totalCount = 0,
  pageCount = 1,
  onViewDetail,
}: {
  emptyTitle: string;
  emptyDescription: string;
  rows?: StorageBucketRow[];
  totalCount?: number;
  pageCount?: number;
  onViewDetail?: (name: string) => void;
}) {
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const hasRows = rows.length > 0;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <SearchField />
        <RefreshIconButton />
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="w-[260px] text-[13px] text-zinc-500 dark:text-zinc-400">
                Bucket Name
              </TableHead>
              <TableHead className="w-[320px] text-[13px] text-zinc-500 dark:text-zinc-400">
                URL
              </TableHead>
              <TableHead className="text-right text-[13px] text-zinc-500 dark:text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasRows ? (
              rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="w-[260px] text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </TableCell>
                  <TableCell className="w-[320px] text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex max-w-full items-center gap-1.5">
                      <span className="truncate">{row.url}</span>
                      <CopyIconButton value={row.url} label="URL" iconClassName="h-3.5 w-3.5" />
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onViewDetail?.(row.name)}
                        className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                      >
                        View Detail
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${row.name}`}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" animateOnHover animateOnTap />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Files
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                      animateOnView
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {emptyTitle}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {emptyDescription}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400">
        <p>0 of {totalCount} row(s) selected.</p>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
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

          <span>Page 1 of {pageCount}</span>

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
                <Icon className="h-4 w-4" animateOnHover animateOnTap />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoragePanel({ onViewBucket }: { onViewBucket: (name: string) => void }) {
  const [tab, setTab] = useState("buckets");

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="buckets" className={PILL_TAB_TRIGGER_CLASS}>
            Buckets
          </TabsTrigger>
          <TabsTrigger value="users" className={PILL_TAB_TRIGGER_CLASS}>
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buckets">
          <BucketsTable
            emptyTitle="Bucket Empty"
            emptyDescription="Create your first bucket to store files for Storage, LiveStream, Streaming, and Sabay Meeting."
            rows={STORAGE_BUCKET_ROWS}
            totalCount={68}
            pageCount={7}
            onViewDetail={onViewBucket}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
