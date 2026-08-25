import {
  AppWindow,
  Box,
  Clapperboard,
  Database,
  ImagePlay,
  Rocket,
  Server,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Real pricing — sourced from Sabay TeKh Cloud's published rate card
 * (KHR/month unless noted). One tier list per service; every plan card
 * in the app (Planning, the Dashboard "Plan" tabs, Storage's Usage
 * panel, and Run App/Database's subscription cards) reads from this
 * single table instead of inventing its own numbers.
 * ------------------------------------------------------------------ */

export interface PricingPlan {
  id: string;
  name: string;
  priceKHR: number;
  period: "mo" | "yr";
  description: string;
  specs: [string, string][];
  popular?: boolean;
}

export type PricingServiceKey =
  | "storage"
  | "streaming"
  | "transcoder"
  | "runapp"
  | "database"
  | "vps"
  | "cms";

export type ServicePricing = Record<PricingServiceKey, PricingPlan[]>;

export const SERVICE_PRICING: ServicePricing = {
  storage: [
    {
      id: "free",
      name: "Free Plan",
      priceKHR: 0,
      period: "mo",
      description: "For personal projects and testing.",
      specs: [
        ["Storage Size", "1 GB"],
        ["Transfer", "100 GB"],
        ["Buckets", "1"],
      ],
    },
    {
      id: "starter",
      name: "Starter",
      priceKHR: 24000,
      period: "mo",
      description: "A first step up for small production traffic.",
      specs: [
        ["Storage Size", "250 GB"],
        ["Transfer", "0.5 TB"],
        ["Buckets", "2"],
      ],
    },
    {
      id: "basic",
      name: "Basic",
      priceKHR: 96000,
      period: "mo",
      description: "For growing teams that need more headroom.",
      specs: [
        ["Storage Size", "250 GB"],
        ["Transfer", "2 TB"],
        ["Buckets", "4"],
      ],
    },
    {
      id: "standard",
      name: "Standard",
      priceKHR: 240000,
      period: "mo",
      description: "Balanced capacity for steady workloads.",
      specs: [
        ["Storage Size", "500 GB"],
        ["Transfer", "4 TB"],
        ["Buckets", "Unlimited"],
      ],
    },
    {
      id: "premium",
      name: "Premium",
      priceKHR: 360000,
      period: "mo",
      popular: true,
      description: "Best value for production workloads at scale.",
      specs: [
        ["Storage Size", "1 TB"],
        ["Transfer", "5 TB"],
        ["Buckets", "Unlimited"],
      ],
    },
    {
      id: "pro",
      name: "Pro",
      priceKHR: 600000,
      period: "mo",
      description: "Higher throughput for demanding pipelines.",
      specs: [
        ["Storage Size", "2 TB"],
        ["Transfer", "6 TB"],
        ["Buckets", "Unlimited"],
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceKHR: 2000000,
      period: "mo",
      description: "Unlock the power of your business with the plan.",
      specs: [
        ["Storage Size", "10 TB"],
        ["Transfer", "30 TB"],
        ["Buckets", "Unlimited"],
      ],
    },
  ],
  streaming: [
    {
      id: "free",
      name: "Free Plan",
      priceKHR: 0,
      period: "mo",
      description: "Try streaming with a small always-on bucket.",
      specs: [
        ["Max Buckets", "1"],
        ["Transfer", "5 GB"],
      ],
    },
  ],
  transcoder: [
    {
      id: "transcoder",
      name: "Transcoder Service",
      priceKHR: 4000,
      period: "mo",
      description:
        "Required subscription to enable Transcoder services for your cloud.",
      specs: [["Converts", "Encoded → altered digital files"]],
    },
  ],
  runapp: [
    {
      id: "student",
      name: "Student",
      priceKHR: 18000,
      period: "mo",
      description: "Perfect for getting started on your first project.",
      specs: [
        ["CPU", "0.5 CORE"],
        ["RAM", "512 MB"],
        ["Transfer", "1024 GB"],
      ],
    },
    {
      id: "basic",
      name: "Basic",
      priceKHR: 36000,
      period: "mo",
      description: "For small apps that need a dedicated core.",
      specs: [
        ["CPU", "1 CORE"],
        ["RAM", "1 GB"],
        ["Transfer", "2 TB"],
      ],
    },
    {
      id: "standard",
      name: "Standard",
      priceKHR: 72000,
      period: "mo",
      description: "For growing teams that need more headroom.",
      specs: [
        ["CPU", "2 CORE"],
        ["RAM", "2 GB"],
        ["Transfer", "4 TB"],
      ],
    },
    {
      id: "premium",
      name: "Premium",
      priceKHR: 180000,
      period: "mo",
      popular: true,
      description: "Best value for production workloads at scale.",
      specs: [
        ["CPU", "4 CORE"],
        ["RAM", "8 GB"],
        ["Transfer", "12 TB"],
      ],
    },
    {
      id: "pro",
      name: "Pro",
      priceKHR: 360000,
      period: "mo",
      description: "Higher throughput for demanding services.",
      specs: [
        ["CPU", "8 CORE"],
        ["RAM", "16 GB"],
        ["Transfer", "16 TB"],
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceKHR: 880000,
      period: "mo",
      description: "Unlock the power of your business with the plan.",
      specs: [
        ["CPU", "16 CORE"],
        ["RAM", "48 GB"],
        ["Transfer", "24 TB"],
      ],
    },
  ],
  database: [
    {
      id: "student",
      name: "Student",
      priceKHR: 18000,
      period: "mo",
      description: "Perfect for getting started on your first project.",
      specs: [
        ["CPU", "0.5 CPU"],
        ["RAM", "512 MB"],
        ["Storage", "2 GB"],
        ["Cluster Charge", "16,200 KHR"],
      ],
    },
    {
      id: "developer",
      name: "Developer",
      priceKHR: 40000,
      period: "mo",
      description: "For prototypes that need a full core.",
      specs: [
        ["CPU", "1 CPU"],
        ["RAM", "1 GB"],
        ["Storage", "5 GB"],
        ["Cluster Charge", "36,000 KHR"],
      ],
    },
    {
      id: "starter",
      name: "Starter",
      priceKHR: 60000,
      period: "mo",
      description: "A first step up for small production traffic.",
      specs: [
        ["CPU", "1 CPU"],
        ["RAM", "1 GB"],
        ["Storage", "15 GB"],
        ["Cluster Charge", "54,000 KHR"],
      ],
    },
    {
      id: "basic",
      name: "Basic",
      priceKHR: 100000,
      period: "mo",
      description: "For growing teams that need more headroom.",
      specs: [
        ["CPU", "1 CPU"],
        ["RAM", "2 GB"],
        ["Storage", "25 GB"],
        ["Cluster Charge", "96,000 KHR"],
      ],
    },
    {
      id: "standard",
      name: "Standard",
      priceKHR: 240000,
      period: "mo",
      description: "Balanced capacity for steady workloads.",
      specs: [
        ["CPU", "2 CPU"],
        ["RAM", "4 GB"],
        ["Storage", "60 GB"],
        ["Cluster Charge", "228,000 KHR"],
      ],
    },
    {
      id: "premium",
      name: "Premium",
      priceKHR: 480000,
      period: "mo",
      popular: true,
      description: "Best value for production workloads at scale.",
      specs: [
        ["CPU", "4 CPU"],
        ["RAM", "8 GB"],
        ["Storage", "120 GB"],
        ["Cluster Charge", "456,000 KHR"],
      ],
    },
    {
      id: "pro",
      name: "Pro",
      priceKHR: 800000,
      period: "mo",
      description: "Higher throughput for demanding databases.",
      specs: [
        ["CPU", "8 CPU"],
        ["RAM", "16 GB"],
        ["Storage", "150 GB"],
        ["Cluster Charge", "760,000 KHR"],
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceKHR: 1600000,
      period: "mo",
      description: "Unlock the power of your business with the plan.",
      specs: [
        ["CPU", "12 CPU"],
        ["RAM", "64 GB"],
        ["Storage", "200 GB"],
        ["Cluster Charge", "1,520,000 KHR"],
      ],
    },
  ],
  /* Full root-access virtual servers — priced a step below Run App at
     the same specs (no managed platform layer on top), scaled the same
     entry-to-enterprise way as every other tier list here. */
  vps: [
    {
      id: "nano",
      name: "Nano",
      priceKHR: 20000,
      period: "mo",
      description: "A tiny always-on box for scripts, bots, and testing.",
      specs: [
        ["vCPU", "1 Core"],
        ["RAM", "1 GB"],
        ["SSD Storage", "25 GB"],
        ["Bandwidth", "1 TB"],
      ],
    },
    {
      id: "basic",
      name: "Basic",
      priceKHR: 40000,
      period: "mo",
      description: "For a personal site or small side project.",
      specs: [
        ["vCPU", "1 Core"],
        ["RAM", "2 GB"],
        ["SSD Storage", "50 GB"],
        ["Bandwidth", "2 TB"],
      ],
    },
    {
      id: "standard",
      name: "Standard",
      priceKHR: 80000,
      period: "mo",
      description: "Comfortable headroom for a small production app.",
      specs: [
        ["vCPU", "2 Core"],
        ["RAM", "4 GB"],
        ["SSD Storage", "80 GB"],
        ["Bandwidth", "4 TB"],
      ],
    },
    {
      id: "premium",
      name: "Premium",
      priceKHR: 160000,
      period: "mo",
      popular: true,
      description: "Best value for production workloads at scale.",
      specs: [
        ["vCPU", "4 Core"],
        ["RAM", "8 GB"],
        ["SSD Storage", "160 GB"],
        ["Bandwidth", "6 TB"],
      ],
    },
    {
      id: "pro",
      name: "Pro",
      priceKHR: 320000,
      period: "mo",
      description: "Higher throughput for demanding services.",
      specs: [
        ["vCPU", "8 Core"],
        ["RAM", "16 GB"],
        ["SSD Storage", "320 GB"],
        ["Bandwidth", "8 TB"],
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceKHR: 640000,
      period: "mo",
      description: "Unlock the power of your business with the plan.",
      specs: [
        ["vCPU", "16 Core"],
        ["RAM", "32 GB"],
        ["SSD Storage", "640 GB"],
        ["Bandwidth", "Unlimited"],
      ],
    },
  ],
  cms: [
    {
      id: "cms",
      name: "CMS Service",
      priceKHR: 396000,
      period: "yr",
      description: "Create and manage website content without coding.",
      specs: [["Billing", "Per Year"]],
    },
  ],
};

/* Gradient theme per tier name — a cool-to-warm ramp from entry-level to
   Enterprise, so the visual weight of a card matches how much plan it
   represents. Looked up by tier name (case-insensitive); falls back to
   the "basic" treatment for any tier not listed here. */
export interface TierTheme {
  badge: string;
  chip: string;
  icon: string;
  ring: string;
}

export const TIER_THEME: Record<string, TierTheme> = {
  free: {
    badge: "bg-gradient-to-r from-zinc-400 to-zinc-500 dark:from-zinc-600 dark:to-zinc-700",
    chip: "bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800",
    icon: "text-zinc-600 dark:text-zinc-300",
    ring: "border-zinc-300 dark:border-zinc-700",
  },
  student: {
    badge: "bg-gradient-to-r from-sky-400 to-cyan-500",
    chip: "bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-950 dark:to-cyan-950",
    icon: "text-sky-600 dark:text-sky-300",
    ring: "border-sky-400 dark:border-sky-700",
  },
  nano: {
    badge: "bg-gradient-to-r from-cyan-400 to-teal-500",
    chip: "bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950 dark:to-teal-950",
    icon: "text-cyan-600 dark:text-cyan-300",
    ring: "border-cyan-400 dark:border-cyan-700",
  },
  starter: {
    badge: "bg-gradient-to-r from-teal-400 to-emerald-500",
    chip: "bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950 dark:to-emerald-950",
    icon: "text-teal-600 dark:text-teal-300",
    ring: "border-teal-400 dark:border-teal-700",
  },
  developer: {
    badge: "bg-gradient-to-r from-indigo-400 to-blue-500",
    chip: "bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950",
    icon: "text-indigo-600 dark:text-indigo-300",
    ring: "border-indigo-400 dark:border-indigo-700",
  },
  basic: {
    badge: "bg-gradient-to-r from-blue-400 to-[#1C75BC]",
    chip: "bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950 dark:to-sky-950",
    icon: "text-[#1C75BC] dark:text-[#6FA8D8]",
    ring: "border-blue-400 dark:border-blue-700",
  },
  standard: {
    badge: "bg-gradient-to-r from-violet-400 to-purple-500",
    chip: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950 dark:to-purple-950",
    icon: "text-violet-600 dark:text-violet-300",
    ring: "border-violet-400 dark:border-violet-700",
  },
  premium: {
    badge: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
    chip: "bg-gradient-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-950 dark:to-pink-950",
    icon: "text-fuchsia-600 dark:text-fuchsia-300",
    ring: "border-fuchsia-400 dark:border-fuchsia-700",
  },
  pro: {
    badge: "bg-gradient-to-r from-amber-400 to-orange-500",
    chip: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950",
    icon: "text-amber-600 dark:text-amber-300",
    ring: "border-amber-400 dark:border-amber-700",
  },
  enterprise: {
    badge: "bg-gradient-to-r from-zinc-700 to-zinc-900",
    chip: "bg-gradient-to-br from-zinc-800 to-zinc-950",
    icon: "text-amber-400",
    ring: "border-zinc-600 dark:border-zinc-500",
  },
  transcoder: {
    badge: "bg-gradient-to-r from-rose-400 to-red-500",
    chip: "bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950 dark:to-red-950",
    icon: "text-rose-600 dark:text-rose-300",
    ring: "border-rose-400 dark:border-rose-700",
  },
  cms: {
    badge: "bg-gradient-to-r from-lime-400 to-green-500",
    chip: "bg-gradient-to-br from-lime-100 to-green-100 dark:from-lime-950 dark:to-green-950",
    icon: "text-green-600 dark:text-green-300",
    ring: "border-green-400 dark:border-green-700",
  },
};

export function getTierTheme(name: string): TierTheme {
  return TIER_THEME[name.toLowerCase()] || TIER_THEME.basic;
}

/* One label + icon per pricing category — shared by Planning's chip row
   and the Subscribe flow (which needs a category's display name/icon
   just from the :category URL param, without Planning's local state). */
export interface PricingCategory {
  key: PricingServiceKey;
  label: string;
  icon: LucideIcon;
}

export const PRICING_CATEGORIES: PricingCategory[] = [
  { key: "storage", label: "Storage", icon: Box },
  { key: "runapp", label: "Run App", icon: Rocket },
  { key: "database", label: "Database", icon: Database },
  { key: "vps", label: "VPS", icon: Server },
  { key: "streaming", label: "Streaming", icon: ImagePlay },
  { key: "transcoder", label: "Transcoder", icon: Clapperboard },
  { key: "cms", label: "CMS", icon: AppWindow },
];

/* ------------------------------------------------------------------ *
 * Display currency — every plan is priced in KHR at the source
 * (SERVICE_PRICING), but Planning/Pricing lets you flip the whole
 * grid to see the same prices converted to USD at a fixed rate. Kept
 * fixed rather than fetched live since there's no real backend here.
 * ------------------------------------------------------------------ */

export const KHR_PER_USD = 4000;

export type DisplayCurrency = "KHR" | "USD";

export function formatPlanPrice(priceKHR: number, currency: DisplayCurrency): string {
  if (priceKHR === 0) return "FREE";
  if (currency === "KHR") return `${priceKHR.toLocaleString()} KHR`;
  const usd = priceKHR / KHR_PER_USD;
  // Whole-dollar prices read as "$6", not "$6.00" — only show cents
  // when the conversion actually lands on a fraction.
  const formatted = usd % 1 === 0 ? usd.toLocaleString() : usd.toFixed(2);
  return `$${formatted}`;
}
