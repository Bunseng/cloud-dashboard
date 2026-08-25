import { useState } from "react";
import { Coins, Download, Gem, ListFilter, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
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
  INVOICE_RECORDS,
  WALLET_TABS,
  type BillingCategoryKey,
} from "../data/billing";

const STATUS_FILTERS = [
  { key: "all", label: "All Status" },
  { key: "Active", label: "Active" },
  { key: "Paused", label: "Paused" },
] as const;
type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"];

/* Filter row — a Shadcn Select per axis (Service name, Subscription
   status), replacing the old pill-tab category filter. Both tabs share
   the Service select; only Subscription has a status to filter by. */
function ServiceFilterSelect({
  value,
  onChange,
}: {
  value: BillingCategoryKey;
  onChange: (value: BillingCategoryKey) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BillingCategoryKey)}>
      <SelectTrigger className="h-9 w-[170px]">
        <SelectValue placeholder="Service" />
      </SelectTrigger>
      <SelectContent>
        {BILLING_CATEGORIES.map((c) => (
          <SelectItem key={c.key} value={c.key}>
            {c.key === "all" ? "All Services" : c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusFilterSelect({
  value,
  onChange,
}: {
  value: StatusFilterKey;
  onChange: (value: StatusFilterKey) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatusFilterKey)}>
      <SelectTrigger className="h-9 w-[150px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_FILTERS.map((s) => (
          <SelectItem key={s.key} value={s.key}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BillingCategoryKey>("all");
  const [status, setStatus] = useState<StatusFilterKey>("all");

  const categoryLabel = (key: BillingCategoryKey) =>
    BILLING_CATEGORIES.find((c) => c.key === key)?.label ?? key;

  // The Service filter narrows every section below (summary totals and
  // the table) down to one service; "All Services" mixes them back
  // together. Status only affects the table — the summary always stays
  // Active-only, since that's what actually renews.
  const inCategory = (r: (typeof BILLING_RECORDS)[number]) =>
    category === "all" || r.category === category;

  const filtered = BILLING_RECORDS.filter((r) => {
    if (!inCategory(r)) return false;
    if (status !== "all" && r.status.label !== status) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.plan.toLowerCase().includes(q) ||
      categoryLabel(r.category).toLowerCase().includes(q)
    );
  });

  // Paused (or any non-Active) subscriptions still show up in the table
  // below — so it's clear why they're not in the total — but never count
  // toward it. Nothing here changes between "this month" and "next
  // month": these are recurring subscriptions, so barring a cancellation
  // the same Active set renews at the same price next cycle too.
  const activeRows = BILLING_RECORDS.filter(inCategory).filter(
    (r) => r.status.label === "Active"
  );
  const totalKHR = activeRows
    .filter((r) => r.currency === "KHR")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalBG = activeRows
    .filter((r) => r.currency === "BG")
    .reduce((sum, r) => sum + r.amount, 0);
  const categorySuffix = category !== "all" && (
    <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">
      — {BILLING_CATEGORIES.find((c) => c.key === category)?.label}
    </span>
  );

  return (
    <div>
      {/* Search + category filter — "All" mixes every service's rows
          together; picking one narrows to just that group. */}
      <div className="flex items-center gap-2">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by service or plan"
        />
        <RefreshIconButton />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <ListFilter className="h-4 w-4" />
          Filter
        </span>
        <ServiceFilterSelect value={category} onChange={setCategory} />
        <StatusFilterSelect value={status} onChange={setStatus} />
      </div>

      {/* Summary for Renew Next Month — what these Active subscriptions
          will charge at their next renewal, split by currency. */}
      <Card className="mt-5">
        <CardTitle>
          Summary for Renew Next Month
          {categorySuffix}
        </CardTitle>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Active subscriptions only — paused ones aren't charged.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalKHR.toLocaleString()}{" "}
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">KHR</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" />
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
                Renews On
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const cat = BILLING_CATEGORIES.find((c) => c.key === r.category);
                const counted = r.status.label === "Active";
                return (
                  <TableRow key={r.id} className={counted ? "" : "opacity-50"}>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        {cat?.icon && (
                          <cat.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        )}
                        {r.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">{r.plan}</TableCell>
                    <TableCell
                      className={
                        "whitespace-nowrap text-zinc-600 dark:text-zinc-400 " +
                        (counted ? "" : "line-through")
                      }
                    >
                      {r.amount === 0 ? "FREE" : `${r.amount.toLocaleString()} ${r.currency}/mo`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={r.status.label} tone={r.status.tone} />
                        {!counted && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            not counted
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.renewsOn}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Receipt
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      No matching subscriptions
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      Try a different search term or category.
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
    </div>
  );
}

function InvoiceTab() {
  const [category, setCategory] = useState<BillingCategoryKey>("all");
  const rows = INVOICE_RECORDS.filter(
    (r) => category === "all" || r.category === category
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <ListFilter className="h-4 w-4" />
          Filter
        </span>
        <ServiceFilterSelect value={category} onChange={setCategory} />
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="text-zinc-500 dark:text-zinc-400">Invoice</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Service</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400">Amount</TableHead>
              <TableHead className="text-right text-zinc-500 dark:text-zinc-400">
                Invoice
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r) => {
                const cat = BILLING_CATEGORIES.find((c) => c.key === r.category);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                      {r.id}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.date}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        {cat?.icon && (
                          <cat.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        )}
                        {r.name}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {r.amount.toLocaleString()} {r.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label={`Download invoice ${r.id}`}
                        className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[#1C75BC] hover:bg-zinc-100 dark:text-[#6FA8D8] dark:hover:bg-zinc-900"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Receipt
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      No invoices in this category
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
          Billing Subscription
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
          <InvoiceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
