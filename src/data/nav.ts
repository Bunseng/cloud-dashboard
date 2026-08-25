import {
  RiBankCardLine,
  RiBillLine,
  RiBox3Line,
  RiDashboardHorizontalLine,
  RiDatabase2Line,
  RiHome9Line,
  RiServerLine,
  RiStackLine,
  RiTeamLine,
  type RemixiconComponentType,
} from "@remixicon/react";

/* ------------------------------------------------------------------ *
 * Nav data
 * ------------------------------------------------------------------ */

export interface NavItem {
  id: string;
  label: string;
  icon: RemixiconComponentType;
}

export interface AccountBalance {
  khr: number;
  bg: number;
}

export type FeatureId = "storage" | "runapp" | "database" | "vps";

export interface Feature {
  id: FeatureId;
  icon: RemixiconComponentType;
  navLabel: string;
  tabLabel: string;
  pageTitle: string;
  resourceLabel: string;
  resourceListLabel: string;
  newAction: string | null;
  multiSubscription?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { id: "home", label: "Home", icon: RiHome9Line },
  { id: "dashboard", label: "Dashboard", icon: RiDashboardHorizontalLine },
];

/* Sidebar's "Manage" items — account-level pages that aren't tied to one
   service. Rendered as flat rows inside the Feature section (alongside
   Storage/Run App/Database) rather than under their own "Manage" label.
   Payment (saved cards, Business Gold bonus, top up — formerly
   "Wallet") and Billing Subscription (subscription + invoice history)
   are separate pages/routes, not tabs of one screen. */
export const MANAGE_NAV: NavItem[] = [
  { id: "payment", label: "Payment", icon: RiBankCardLine },
  { id: "billing", label: "Billing Subscription", icon: RiBillLine },
  { id: "groups", label: "Group Members", icon: RiTeamLine },
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
    icon: RiBox3Line,
    navLabel: "Storage",
    tabLabel: "Storage",
    pageTitle: "Storage",
    resourceLabel: "Bucket",
    resourceListLabel: "Buckets",
    newAction: "Create Bucket",
  },
  {
    id: "runapp",
    icon: RiStackLine,
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
    icon: RiDatabase2Line,
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
    icon: RiServerLine,
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
