import { Box, Database, Rocket, type LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Wallet & Billing — account balance up top, then two tabs: Subscription
 * (the subscription list plus its this-month/renews-next-month cost
 * summary — merged from what used to be separate Subscription and Usage
 * tabs) and Invoice history. Reached from the sidebar's Manage group
 * rather than living inside any one Feature, since it spans all of them.
 * ------------------------------------------------------------------ */

export type BillingCategoryKey = "all" | "storage" | "runapp" | "database";

export interface BillingCategory {
  key: BillingCategoryKey;
  label: string;
  icon?: LucideIcon;
}

export type BillingCurrency = "KHR" | "BG";

export type BillingStatusTone = "green" | "zinc";

export interface BillingStatus {
  label: string;
  tone: BillingStatusTone;
}

export interface BillingRecord {
  id: string;
  category: Exclude<BillingCategoryKey, "all">;
  name: string;
  plan: string;
  amount: number;
  currency: BillingCurrency;
  status: BillingStatus;
  renewsOn: string;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  category: Exclude<BillingCategoryKey, "all">;
  name: string;
  plan: string;
  amount: number;
  currency: BillingCurrency;
}

export interface WalletTab {
  key: "subscription" | "invoice";
  label: string;
}

export const BILLING_CATEGORIES: BillingCategory[] = [
  { key: "all", label: "All" },
  { key: "storage", label: "Storage", icon: Box },
  { key: "runapp", label: "Run App", icon: Rocket },
  { key: "database", label: "Database", icon: Database },
];

/* Services that allow more than one subscription (Run App, Database) get
   a list — each card is its own instance/plan — instead of the single
   current-plan summary Storage uses. Placeholder data: 3 identical FREE
   subscriptions; swap in the real per-instance list once the API exists. */
export const PLACEHOLDER_SUBSCRIPTION_COUNT = 3;

/* One row per subscription across every service — the counts and plans
   here match what Storage/Run App/Database already show elsewhere
   (Storage's single Free plan, PLACEHOLDER_SUBSCRIPTION_COUNT Run App +
   Database subscriptions) so Billing doesn't invent its own numbers.
   Two are billed in Business Gold instead of KHR, and one is Paused, so
   the Usage tab's "this month" total has something real to exclude and
   to split by currency. */
export const BILLING_RECORDS: BillingRecord[] = [
  {
    id: "bill-storage",
    category: "storage",
    name: "Storage",
    plan: "Free Plan",
    amount: 0,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-runapp-1",
    category: "runapp",
    name: "Run App — Subscription 1",
    plan: "Basic",
    amount: 36000,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-runapp-2",
    category: "runapp",
    name: "Run App — Subscription 2",
    plan: "Basic",
    amount: 36000,
    currency: "BG",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-runapp-3",
    category: "runapp",
    name: "Run App — Subscription 3",
    plan: "Basic",
    amount: 36000,
    currency: "KHR",
    status: { label: "Paused", tone: "zinc" },
    renewsOn: "—",
  },
  {
    id: "bill-database-1",
    category: "database",
    name: "Database — Subscription 1",
    plan: "Standard",
    amount: 240000,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-database-2",
    category: "database",
    name: "Database — Subscription 2",
    plan: "Standard",
    amount: 240000,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-database-3",
    category: "database",
    name: "Database — Subscription 3",
    plan: "Standard",
    amount: 240000,
    currency: "BG",
    status: { label: "Active", tone: "green" },
    renewsOn: "Aug 2, 2026",
  },
];

/* Two most recent months for every paid, currently-active-or-was-active
   subscription — Storage's Free plan never invoices, and a Paused
   subscription stops generating new ones. */
export const INVOICE_RECORDS: InvoiceRecord[] = [
  { id: "INV-2026-0812", date: "Aug 2, 2026", category: "runapp", name: "Run App — Subscription 1", plan: "Basic", amount: 36000, currency: "KHR" },
  { id: "INV-2026-0813", date: "Aug 2, 2026", category: "runapp", name: "Run App — Subscription 2", plan: "Basic", amount: 36000, currency: "BG" },
  { id: "INV-2026-0814", date: "Aug 2, 2026", category: "database", name: "Database — Subscription 1", plan: "Standard", amount: 240000, currency: "KHR" },
  { id: "INV-2026-0815", date: "Aug 2, 2026", category: "database", name: "Database — Subscription 2", plan: "Standard", amount: 240000, currency: "KHR" },
  { id: "INV-2026-0816", date: "Aug 2, 2026", category: "database", name: "Database — Subscription 3", plan: "Standard", amount: 240000, currency: "BG" },
  { id: "INV-2026-0712", date: "Jul 2, 2026", category: "runapp", name: "Run App — Subscription 1", plan: "Basic", amount: 36000, currency: "KHR" },
  { id: "INV-2026-0713", date: "Jul 2, 2026", category: "runapp", name: "Run App — Subscription 2", plan: "Basic", amount: 36000, currency: "BG" },
  { id: "INV-2026-0714", date: "Jul 2, 2026", category: "database", name: "Database — Subscription 1", plan: "Standard", amount: 240000, currency: "KHR" },
  { id: "INV-2026-0715", date: "Jul 2, 2026", category: "database", name: "Database — Subscription 2", plan: "Standard", amount: 240000, currency: "KHR" },
  { id: "INV-2026-0716", date: "Jul 2, 2026", category: "database", name: "Database — Subscription 3", plan: "Standard", amount: 240000, currency: "BG" },
];

export const WALLET_TABS: WalletTab[] = [
  { key: "subscription", label: "Subscription" },
  { key: "invoice", label: "Invoice" },
];
