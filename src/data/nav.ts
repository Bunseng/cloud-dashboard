import type { ComponentType } from "react";

import { CreditCard } from "@/components/animate-ui/icons/credit-card";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { Box } from "@/components/animate-ui/icons/box";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { Database } from "@/components/animate-ui/icons/database";
import { House } from "@/components/animate-ui/icons/house";
import { Server } from "@/components/animate-ui/icons/server";
import { Layers } from "@/components/animate-ui/icons/layers";
import { Users } from "@/components/animate-ui/icons/users";

type NavIconComponent = ComponentType<{
  className?: string;
  animate?: boolean;
  animateOnHover?: boolean;
  animateOnTap?: boolean;
  animateOnView?: boolean;
  loop?: boolean;
}>;

/* ------------------------------------------------------------------ *
 * Nav data
 * ------------------------------------------------------------------ */

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconComponent;
}

export interface AccountBalance {
  khr: number;
  bg: number;
}

export type FeatureId = "storage" | "runapp" | "database" | "vps";

export interface Feature {
  id: FeatureId;
  icon: NavIconComponent;
  navLabel: string;
  tabLabel: string;
  pageTitle: string;
  resourceLabel: string;
  resourceListLabel: string;
  newAction: string | null;
  multiSubscription?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

/* Sidebar's "Manage" items — account-level pages that aren't tied to one
   service. Rendered as flat rows inside the Feature section (alongside
   Storage/Run App/Database) rather than under their own "Manage" label.
   Payment (saved cards, Business Gold bonus, top up — formerly
   "Wallet") and Billing Subscription (subscription + invoice history)
   are separate pages/routes, not tabs of one screen. */
export const MANAGE_NAV: NavItem[] = [
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "billing", label: "Billing Subscription", icon: Receipt },
  { id: "groups", label: "Group Members", icon: Users },
];

/* One account balance, read by both the Topbar pills and the Billing
   page's summary cards. */
export const ACCOUNT_BALANCE: AccountBalance = { khr: 100000, bg: 100000 };

/* Single source of truth for each Feature — the sidebar's Feature group,
   Dashboard's tab bar, and each Feature's own detail page all read from
   this one list instead of keeping separate, driftable label maps.
   `resourceListLabel` is the sidebar's resource-list child (e.g.
   "Buckets") — the only child each Feature group shows. */
export const FEATURES: Feature[] = [
  {
    id: "storage",
    icon: Box,
    navLabel: "Storage",
    tabLabel: "Storage",
    pageTitle: "Storage",
    resourceLabel: "Bucket",
    resourceListLabel: "Buckets",
    newAction: "Create Bucket",
  },
  {
    id: "runapp",
    icon: Layers,
    navLabel: "Run App",
    tabLabel: "RunApp",
    pageTitle: "Run App",
    resourceLabel: "Stack",
    resourceListLabel: "Stacks",
    newAction: null,
    // Unlike Storage (one account, one plan), you can run several Run App
    // / Database subscriptions side by side — each its own instance with
    // its own plan — so these get a list instead of a single summary.
    multiSubscription: true,
  },
  {
    id: "database",
    icon: Database,
    navLabel: "Database",
    tabLabel: "Database",
    pageTitle: "Databases",
    resourceLabel: "Database",
    resourceListLabel: "Databases",
    newAction: null,
    multiSubscription: true,
  },
  {
    id: "vps",
    icon: Server,
    navLabel: "VPS",
    tabLabel: "VPS",
    pageTitle: "VPS",
    resourceLabel: "VPS",
    resourceListLabel: "Instances",
    newAction: null,
    // Same shape as Run App/Database — each subscription is its own
    // full root-access server, not a shared pool.
    multiSubscription: true,
  },
];
