import type { ComponentType } from "react";

import { Box } from "@/components/animate-ui/icons/box";
import { Database } from "@/components/animate-ui/icons/database";
import { Rocket } from "@/components/animate-ui/icons/rocket";

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
  icon?: ComponentType<{
    className?: string;
    animate?: boolean;
    animateOnHover?: boolean;
    animateOnTap?: boolean;
    animateOnView?: boolean;
    loop?: boolean;
  }>;
}

export type BillingCurrency = "KHR" | "BG";

export type BillingStatusTone = "green" | "zinc" | "amber" | "red";

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
  // When this subscription was first created — doesn't change no matter
  // how many billing periods it's renewed through since.
  subscribedSince: string;
  // The current billing period's bounds — periodStart stays fixed for
  // the period, renewsOn is both "when this period ends" and (for an
  // Active subscription) "when it bills again next."
  periodStart: string;
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

export type BillingTxnType = "Subscription" | "Renewal Subscription" | "Upgrade Subscription";
export type PaymentStatus = "Paid" | "Pending" | "Failed";

/* The Billing tab's own ledger — every charge actually posted, as
   opposed to Invoice's one-row-per-paid-period summary. Txn Hash
   stands in for a real payment processor's transaction id. */
export interface BillingTransaction {
  id: string;
  txnHash: string;
  // Only a handful of transactions carry a human note; "—" for the rest.
  description?: string;
  type: BillingTxnType;
  category: Exclude<BillingCategoryKey, "all">;
  plan: string;
  amount: number;
  tax: number;
  currency: BillingCurrency;
  renewDate: string;
  billingDate: string;
  payment: PaymentStatus;
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
   Two are billed in Business Gold instead of KHR, and one is already
   Schedule cancel, so the Usage tab's "this month" total has something
   real to exclude and to split by currency. */
export const BILLING_RECORDS: BillingRecord[] = [
  {
    id: "bill-storage",
    category: "storage",
    name: "Storage",
    plan: "Free Plan",
    amount: 0,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    subscribedSince: "Jan 2, 2026",
    periodStart: "Jul 2, 2026",
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
    subscribedSince: "Mar 10, 2026",
    periodStart: "Jul 2, 2026",
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
    subscribedSince: "Apr 5, 2026",
    periodStart: "Jul 2, 2026",
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-runapp-3",
    category: "runapp",
    name: "Run App — Subscription 3",
    plan: "Basic",
    amount: 36000,
    currency: "KHR",
    status: { label: "Schedule cancel", tone: "amber" },
    subscribedSince: "Feb 18, 2026",
    periodStart: "Jul 2, 2026",
    renewsOn: "Aug 2, 2026",
  },
  {
    id: "bill-database-1",
    category: "database",
    name: "Database — Subscription 1",
    plan: "Standard",
    amount: 240000,
    currency: "KHR",
    status: { label: "Active", tone: "green" },
    subscribedSince: "Jan 15, 2026",
    periodStart: "Jul 2, 2026",
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
    subscribedSince: "Jan 20, 2026",
    periodStart: "Jul 2, 2026",
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
    subscribedSince: "Feb 1, 2026",
    periodStart: "Jul 2, 2026",
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

/* Every charge actually posted, newest first — tax shown alongside the
   base amount since KHR billing always itemizes VAT separately rather
   than folding it into one number. */
export const BILLING_TRANSACTIONS: BillingTransaction[] = [
  {
    id: "txn-1",
    txnHash: "61e56a2f9b3d4c7e8f1a0b6d5c4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d1626c",
    type: "Upgrade Subscription",
    category: "runapp",
    plan: "Standard",
    amount: 72000,
    tax: 7200,
    currency: "KHR",
    renewDate: "23/Oct/2026",
    billingDate: "23/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-2",
    txnHash: "d9a32b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5ecf7db",
    description: "Basic Database Subscription",
    type: "Renewal Subscription",
    category: "database",
    plan: "Starter",
    amount: 60000,
    tax: 6000,
    currency: "KHR",
    renewDate: "22/Oct/2026",
    billingDate: "22/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-3",
    txnHash: "16ae5c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f7d158",
    type: "Upgrade Subscription",
    category: "storage",
    plan: "Starter",
    amount: 24000,
    tax: 2400,
    currency: "KHR",
    renewDate: "21/Oct/2026",
    billingDate: "30/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-4",
    txnHash: "825c9d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a8d004",
    type: "Upgrade Subscription",
    category: "storage",
    plan: "Starter",
    amount: 24000,
    tax: 2400,
    currency: "KHR",
    renewDate: "17/Oct/2026",
    billingDate: "20/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-5",
    txnHash: "1c54c0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a389431",
    type: "Renewal Subscription",
    category: "runapp",
    plan: "Basic",
    amount: 36000,
    tax: 3600,
    currency: "KHR",
    renewDate: "17/Oct/2026",
    billingDate: "20/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-6",
    txnHash: "3c0df7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d1bafj",
    type: "Subscription",
    category: "storage",
    plan: "Free Plan",
    amount: 0,
    tax: 0,
    currency: "KHR",
    renewDate: "14/Oct/2026",
    billingDate: "14/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-7",
    txnHash: "4f669d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a64474",
    type: "Subscription",
    category: "runapp",
    plan: "Basic",
    amount: 36000,
    tax: 3600,
    currency: "KHR",
    renewDate: "13/Oct/2026",
    billingDate: "13/Oct/2026",
    payment: "Paid",
  },
  {
    id: "txn-8",
    txnHash: "95726f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8da031",
    description: "Basic Database Subscription",
    type: "Subscription",
    category: "database",
    plan: "Starter",
    amount: 60000,
    tax: 6000,
    currency: "KHR",
    renewDate: "22/Sep/2026",
    billingDate: "22/Sep/2026",
    payment: "Paid",
  },
  {
    id: "txn-9",
    txnHash: "26608e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8bd68a",
    type: "Renewal Subscription",
    category: "runapp",
    plan: "Basic",
    amount: 36000,
    tax: 3600,
    currency: "KHR",
    renewDate: "17/Sep/2026",
    billingDate: "17/Sep/2026",
    payment: "Paid",
  },
  {
    id: "txn-10",
    txnHash: "6eb0f4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e94c5c",
    type: "Subscription",
    category: "runapp",
    plan: "Basic",
    amount: 36000,
    tax: 3600,
    currency: "KHR",
    renewDate: "17/Aug/2026",
    billingDate: "17/Aug/2026",
    payment: "Paid",
  },
];

export const WALLET_TABS: WalletTab[] = [
  { key: "subscription", label: "Subscription" },
  { key: "invoice", label: "Billing" },
];
