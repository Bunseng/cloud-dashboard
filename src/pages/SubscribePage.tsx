import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, KeyRound, MapPin, X } from "lucide-react";
import { RiCentosFill, RiUbuntuFill } from "@remixicon/react";
import { CircleCheck as CheckCircle2 } from "@/components/animate-ui/icons/circle-check";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ClickableSurface } from "../components/atoms";
import {
  AddCardDialog,
  PayDialog,
  PaymentMethodPicker,
  resolvePaymentSelection,
  type PaymentSelection,
} from "../components/PaymentFlow";
import { formatScheduleDate } from "../context/PlanScheduleContext";
import { addSavedCard, SAVED_CARDS, type SavedCard } from "../data/paymentMethods";
import { getTierTheme, SERVICE_PRICING, type PricingServiceKey, type PricingPlan } from "../data/pricing";
import { VPS_PROVINCES } from "./vps/CreateVpsPage";
import {
  addVpsSshKey,
  deleteVpsSshKey,
  SelectSshKeyDialog,
  updateVpsSshKey,
  VPS_OS_FAMILIES,
  VPS_SSH_KEYS,
  type VpsSshKey,
} from "./vps/VpsDialogs";

/* ------------------------------------------------------------------ *
 * Subscribe — Plan → Payment Method → QR (popup) → Success. Mirrors Top
 * Up's shape (same method picker/QR dialog, from ../components/
 * PaymentFlow) so the two payment experiences read as one consistent
 * flow. The one thing unique to this flow: the Plan step doubles as a
 * "Change Plan" step — the tier you clicked "Try Now" on is pre-picked,
 * but every other tier in the same category stays one click away, right
 * up until you pay.
 *
 * `mode="upgrade"` reuses this exact same Plan → Payment → Success shape
 * for every "Upgrade Plan" button across the app (Dashboard tabs, each
 * subscription's own detail rail) instead of a separate flow — the tier
 * you're already on arrives as `initialTierId` and renders as "Current
 * Plan" (undeletable/unselectable, same disabled treatment Planning
 * uses), so upgrading is just "Change Plan" with the copy reframed
 * around what you already have.
 *
 * Upgrades also insert one extra step (Plan → Schedule → Payment →
 * Success): "Upgrade now" keeps the flow exactly as above, while
 * "Schedule for later" picks a future date, skips payment for now (it's
 * not due yet), and reports that date back through `onDone` so the
 * caller can show "Upgrading to X on <date>" on the subscription's own
 * card instead of applying the change immediately.
 * ------------------------------------------------------------------ */

type Step =
  | "plan"
  | "resource"
  | "location"
  | "os"
  | "ssh"
  | "network"
  | "spec"
  | "snapshot"
  | "schedule"
  | "method"
  | "success";
type SubscribeMode = "new" | "upgrade";
type ScheduleChoice = "now" | "later";

/* A brand-new VPS gets its own config page (CPU → Server Details →
   Location → SSH Key → Networking) instead of the single Plan step
   every other category uses — there's simply more to set up before a
   server can actually be provisioned. Server Details sits second
   because it's the only required step: the one thing that has to be
   filled in shouldn't be buried in the middle of four optional ones.
   Upgrades skip all of this; they're resizing a server that already
   exists. */
const VPS_WIZARD_STEPS: { step: Step; label: string }[] = [
  { step: "resource", label: "CPU" },
  { step: "os", label: "Server Details" },
  { step: "location", label: "Location" },
  { step: "ssh", label: "SSH Key" },
  { step: "network", label: "Network" },
  { step: "snapshot", label: "Snapshot Protection" },
];

/* Scaling a server past what its plan includes. The per-unit rates
   aren't invented — they're the rate card's own implied pricing:
   10,000/vCPU + 5,000/GB RAM + 500/GB SSD reproduces Standard
   (80,000), Premium (160,000), Pro (320,000) and Enterprise (640,000)
   exactly, so paying for an extra core here costs the same as it does
   inside a bigger plan.

   `options` are how much to ADD, always starting at 0 — an add-on is
   its own quantity, independent of whatever the plan happens to
   bundle, and 0 means "leave this resource at the plan's own number". `max` is still the ceiling for the finished server, so the
   list is only trimmed where plan + add-on would overshoot it. */
const VPS_SPEC_ADDONS: {
  key: string;
  label: string;
  specLabel: string;
  unit: string;
  max: number;
  rateKHR: number;
  options: number[];
}[] = [
  {
    key: "vcpu",
    label: "vCPU (Processors)",
    specLabel: "vCPU",
    unit: "vCPU",
    max: 128,
    rateKHR: 10_000,
    options: [0, 1, 2, 4, 8, 16, 32, 64, 126],
  },
  {
    key: "ram",
    label: "RAM (Memory)",
    specLabel: "RAM",
    unit: "GB",
    max: 256,
    rateKHR: 5_000,
    options: [0, 1, 2, 4, 8, 16, 32, 64, 128, 252],
  },
  {
    key: "storage",
    label: "Storage",
    specLabel: "SSD Storage",
    unit: "GB",
    max: 2000,
    rateKHR: 500,
    options: [0, 1, 20, 50, 100, 250, 500, 1000, 1920],
  },
];

// "2 Core" → 2, "80 GB" → 80. The plan's own spec row is the floor for
// that resource: you can scale a server up here, never below its plan.
function specBaseline(tier: PricingPlan, specLabel: string): number {
  const raw = tier.specs.find(([label]) => label === specLabel)?.[1] ?? "";
  return parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
}

// How much headroom the chosen plan leaves before hitting the ceiling.
function specRoom(tier: PricingPlan, addon: (typeof VPS_SPEC_ADDONS)[number]): number {
  return Math.max(addon.max - specBaseline(tier, addon.specLabel), 0);
}

// The add-on quantity itself — defaults to 0 (nothing added on top of
// the plan) and never exceeds what's left under the ceiling.
function specAddedFor(
  tier: PricingPlan,
  addon: (typeof VPS_SPEC_ADDONS)[number],
  chosen?: number
): number {
  const room = specRoom(tier, addon);
  return Math.min(Math.max(chosen ?? addon.options[0], 0), room);
}

function specTotalFor(
  tier: PricingPlan,
  addon: (typeof VPS_SPEC_ADDONS)[number],
  chosen: number | undefined,
  enabled: boolean
): number {
  const base = specBaseline(tier, addon.specLabel);
  return enabled ? base + specAddedFor(tier, addon, chosen) : base;
}

function specExtraCost(
  tier: PricingPlan,
  chosen: Record<string, number>,
  enabled: boolean
): number {
  if (!enabled) return 0;
  return VPS_SPEC_ADDONS.reduce(
    (sum, a) => sum + specAddedFor(tier, a, chosen[a.key]) * a.rateKHR,
    0
  );
}

// What the server actually ends up with, per spec-row label — the
// plan's own numbers until the add-on is switched on. Drives both the
// right rail's plan card and what gets provisioned.
function finalSpecs(
  tier: PricingPlan,
  chosen: Record<string, number>,
  enabled: boolean
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of VPS_SPEC_ADDONS) {
    const total = specTotalFor(tier, a, chosen[a.key], enabled);
    out[a.specLabel] = `${total.toLocaleString()} ${a.specLabel === "vCPU" ? "Core" : a.unit}`;
  }
  return out;
}

/* Snapshot protection is a separate subscription billed alongside the
   server — same tier list Create VPS and the instance page already use,
   so a plan bought here is the same thing shown there. Off by default;
   switching it on folds its price into the one checkout total. */
const SNAPSHOT_TIERS = SERVICE_PRICING.vpsSnapshot;

// Splits the real VPS rate card (SERVICE_PRICING.vps) into Shared vCPU
// (burstable, lower cost) vs Dedicated vCPU (guaranteed cores, higher
// throughput) — same tiers/prices used everywhere else, just grouped by
// what kind of CPU access they actually give you.
const VPS_RESOURCE_TYPES: {
  id: string;
  label: string;
  description: string;
  tierIds: string[];
  // Dedicated hardware isn't orderable yet — the option stays visible
  // (so the two-tier offering reads as intentional) but can't be
  // picked, rather than disappearing and reappearing later.
  disabled?: boolean;
}[] = [
  {
    id: "shared",
    label: "Shared CPU",
    description: "Cost-effective performance with cores shared across VMs — great for most workloads.",
    tierIds: ["nano", "basic", "standard", "premium"],
  },
  {
    id: "dedicated",
    label: "Dedicated CPU",
    description: "Guaranteed, uninterrupted access to physical cores for consistent, high-throughput performance.",
    tierIds: ["pro", "enterprise"],
    disabled: true,
  },
];

function resourceTypeForTier(tierId: string): string {
  return VPS_RESOURCE_TYPES.find((r) => r.tierIds.includes(tierId))?.id ?? VPS_RESOURCE_TYPES[0].id;
}

/* The wizard runs top to bottom as a vertical accordion instead of a
   side step bar: each step is its own row. A step already finished
   collapses down to a one-line summary of what was picked — the whole
   row is a dropdown trigger (chevron on the right, like "Change Plan"
   elsewhere in this flow) that reopens it in place. The step being
   worked on right now stays fully expanded; anything still ahead
   renders as a dimmed, unopened row so the order of what's left stays
   visible without inviting you to skip into it. */
function VpsWizardStepRow({
  index,
  label,
  required,
  expanded,
  summary,
  onToggle,
  nextLabel,
  onNext,
  children,
}: {
  index: number;
  label: string;
  // Only the step that actually blocks checkout gets called out; every
  // other row already has a usable default, so opening it is a choice,
  // not a chore.
  required?: boolean;
  expanded: boolean;
  summary?: string;
  onToggle: () => void;
  // Label of the row this one hands off to; absent on the last step,
  // where the right rail's Checkout is the only thing left to do.
  nextLabel?: string;
  onNext?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left motion-safe:transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:hover:bg-zinc-900"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 text-[12px] font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {label}
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {required ? "Required" : "Optional"}
            </span>
          </p>
          {/* The picked-value line is what a collapsed row exists to
              show; expanded, the controls below say it better. */}
          {!expanded && summary && (
            <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">{summary}</p>
          )}
        </div>
        {/* Points down when there's something to open, flips up once
            open — the row stays open until this is clicked again. */}
        <ChevronDown
          className={
            "h-4 w-4 shrink-0 text-[#1C75BC] motion-safe:transition-transform dark:text-[#6FA8D8] " +
            (expanded ? "rotate-180" : "")
          }
          animateOnHover
        />
      </button>
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
          {children}
          {onNext && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="brand"
                onClick={onNext}
                // The row it opens is right below and already labelled,
                // so the button only has to say what it does.
                aria-label={nextLabel ? `Next: ${nextLabel}` : "Next"}
                className="h-9 px-5 text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One-line "here's what you picked" text for a collapsed, already-done
// row — lets you scan the whole wizard's choices at a glance without
// reopening every step.
function vpsStepSummary(
  step: Step,
  ctx: {
    tier: PricingPlan;
    province: string;
    hostname: string;
    osFamily: string;
    osVersion: string;
    sshKeys: VpsSshKey[];
    selectedSshKeyIds: string[];
    snapshotEnabled: boolean;
    snapshotTierId: string;
    specChoices: Record<string, number>;
    specEnabled: boolean;
  }
): string | undefined {
  switch (step) {
    case "resource": {
      const type = VPS_RESOURCE_TYPES.find((r) => r.id === resourceTypeForTier(ctx.tier.id));
      const label = `${type?.label ?? ""} · ${ctx.tier.name}`;
      // The spec add-on lives inside this step now, so its effect
      // belongs on this row's one-line summary too.
      const extra = specExtraCost(ctx.tier, ctx.specChoices, ctx.specEnabled);
      return extra > 0 ? `${label} · +${extra.toLocaleString()} KHR/mo add-ons` : label;
    }
    case "location":
      return ctx.province;
    case "os":
      return ctx.hostname
        ? `${ctx.hostname} · ${ctx.osFamily} ${ctx.osVersion}`
        : `${ctx.osFamily} ${ctx.osVersion}`;
    case "ssh": {
      const names = ctx.sshKeys.filter((k) => ctx.selectedSshKeyIds.includes(k.id)).map((k) => k.name);
      return names.length ? names.join(", ") : "No key added";
    }
    case "network":
      return "IPv4";
    case "snapshot": {
      if (!ctx.snapshotEnabled) return "Off";
      const t = SNAPSHOT_TIERS.find((s) => s.id === ctx.snapshotTierId) ?? SNAPSHOT_TIERS[0];
      return `${t.name} · ${t.priceKHR.toLocaleString()} KHR/${t.period}`;
    }
    default:
      return undefined;
  }
}

// Brand icon where @remixicon/react has one; everything else falls back
// to a plain colored initial so this doesn't depend on sourcing every
// distro's actual logo artwork.
const OS_LOGO: Record<
  string,
  { icon?: ComponentType<{ className?: string }>; letter: string; bg: string; text: string }
> = {
  Ubuntu: { icon: RiUbuntuFill, letter: "U", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-[#E95420]" },
  CentOS: { icon: RiCentosFill, letter: "C", bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-[#932279]" },
  Debian: { letter: "D", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  Fedora: { letter: "F", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  AlmaLinux: { letter: "A", bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
  OracleLinux: { letter: "O", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400" },
};

/* Read-only tier summary for the wizard's right rail — "same place"
   across every step, unlike PlanPicker which doubles as the Plan step's
   own editable card. Changing the plan means going back to Step 1. */
function VpsPlanSummaryCard({
  tier,
  specOverride,
}: {
  tier: PricingPlan;
  // Final resources once Service Specification add-ons are on, so the
  // plan card shows the machine being bought rather than the plan's
  // bundled defaults. Upgraded rows are marked so the change is visible.
  specOverride?: Record<string, string>;
}) {
  const theme = getTierTheme(tier.id);
  const priceDisplay = tier.priceKHR === 0 ? "FREE" : `${tier.priceKHR.toLocaleString()} KHR/${tier.period}`;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{tier.name}</p>
        <Badge className={"border-transparent font-bold text-white hover:opacity-100 " + theme.badge}>
          {resourceTypeForTier(tier.id) === "dedicated" ? "Dedicated" : "Shared"}
        </Badge>
      </div>
      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{tier.description}</p>
      <p className="mt-3">
        <span className={"text-xl font-bold " + (tier.priceKHR === 0 ? "text-zinc-900 dark:text-zinc-50" : theme.icon)}>
          {priceDisplay}
        </span>
      </p>
      <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-[13px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        {tier.specs.map(([label, value]) => {
          const upgraded = specOverride?.[label];
          const changed = upgraded != null && upgraded !== value;
          return (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="flex items-center gap-1.5">
                {changed && (
                  <span className="text-[12px] text-zinc-400 line-through dark:text-zinc-600">{value}</span>
                )}
                <span
                  className={
                    "font-medium " +
                    (changed
                      ? "text-[#1C75BC] dark:text-[#6FA8D8]"
                      : "text-zinc-900 dark:text-zinc-100")
                  }
                >
                  {upgraded ?? value}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* The right rail's running total. A VPS and its snapshot plan are two
   separate subscriptions but one checkout, so they're itemised and then
   summed rather than collapsed into a single opaque number — turning
   snapshots on should visibly change what you're about to pay. */
function VpsCostSummary({
  tier,
  specChoices,
  specEnabled,
  snapshotEnabled,
  snapshotTier,
  total,
}: {
  tier: PricingPlan;
  specChoices: Record<string, number>;
  specEnabled: boolean;
  snapshotEnabled: boolean;
  snapshotTier: PricingPlan;
  total: number;
}) {
  const rows: [string, string, number][] = [["VPS", tier.name, tier.priceKHR]];
  // One line per scaled-up resource, so the bill shows what each
  // upgrade costs rather than a single opaque "add-ons" figure.
  for (const a of specEnabled ? VPS_SPEC_ADDONS : []) {
    const added = specAddedFor(tier, a, specChoices[a.key]);
    if (added > 0) {
      rows.push([a.specLabel, `+${added.toLocaleString()} ${a.unit}`, added * a.rateKHR]);
    }
  }
  if (snapshotEnabled) rows.push(["Snapshot", snapshotTier.name, snapshotTier.priceKHR]);

  return (
    <Card>
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Total</p>
      <ul className="mt-3 space-y-2 text-[13px]">
        {rows.map(([group, name, price]) => (
          <li key={group} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-zinc-500 dark:text-zinc-400">{group}</span>
              <span className="block font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
              {price.toLocaleString()} KHR
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {total.toLocaleString()} KHR
          <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">/mo</span>
        </span>
      </div>
    </Card>
  );
}

/* Step 1 — CPU type + size. Picking a resource type filters which tiers
   show up below it; picking a tier is what actually sets the plan
   that's being subscribed to (mirrors PlanPicker's own tier-selection
   list, just as the wizard's first step instead of an expandable
   "Change Plan" section). */
function VpsResourceStep({
  tierId,
  onSelectTier,
  tier,
  specEnabled,
  onSpecEnabledChange,
  specChoices,
  onSpecChange,
}: {
  tierId: string;
  onSelectTier: (id: string) => void;
  tier: PricingPlan;
  specEnabled: boolean;
  onSpecEnabledChange: (enabled: boolean) => void;
  specChoices: Record<string, number>;
  onSpecChange: (key: string, added: number) => void;
}) {
  const tiers = SERVICE_PRICING.vps;
  const resourceType = resourceTypeForTier(tierId);

  function selectResourceType(id: string) {
    const group = VPS_RESOURCE_TYPES.find((r) => r.id === id);
    if (!group || group.disabled) return;
    if (!group.tierIds.includes(tierId)) {
      onSelectTier(group.tierIds[0]);
    }
  }

  return (
    <>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Choose how this server&apos;s CPU cores are allocated.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {VPS_RESOURCE_TYPES.map((r) => {
          const selected = r.id === resourceType && !r.disabled;
          if (r.disabled) {
            return (
              <div
                key={r.id}
                aria-disabled
                className="cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {r.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">{r.description}</p>
              </div>
            );
          }
          return (
            <ClickableSurface
              key={r.id}
              onClick={() => selectResourceType(r.id)}
              className={
                "rounded-xl border p-4 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                (selected
                  ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.label}</span>
                <span
                  className={
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                    (selected ? "border-[#1C75BC] bg-[#1C75BC]" : "border-zinc-300 dark:border-zinc-600")
                  }
                >
                  {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">{r.description}</p>
            </ClickableSurface>
          );
        })}
      </div>

      <p className="mt-5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Plan</p>
      <RadioGroup
        value={tierId}
        onValueChange={onSelectTier}
        className="mt-2.5 space-y-2"
      >
        {tiers
          .filter((t) => VPS_RESOURCE_TYPES.find((r) => r.id === resourceType)?.tierIds.includes(t.id))
          .map((t) => {
            const selected = t.id === tierId;
            const id = `vps-tier-${t.id}`;
            return (
              <Label
                key={t.id}
                htmlFor={id}
                className={
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 font-normal motion-safe:transition-colors " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                  (selected
                    ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{t.name}</span>
                    <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.priceKHR.toLocaleString()} KHR/{t.period}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">
                    {t.specs.map(([, value]) => value).join(" · ")}
                  </span>
                </span>
                <RadioGroupItem value={t.id} id={id} className="ml-2 shrink-0" />
              </Label>
            );
          })}
      </RadioGroup>

      <VpsSpecAddOn
        tier={tier}
        enabled={specEnabled}
        onEnabledChange={onSpecEnabledChange}
        chosen={specChoices}
        onChange={onSpecChange}
      />
    </>
  );
}

/* Step 2 — Location. Same province data Create VPS already uses for an
   existing instance's own form, so "roadmap only" provinces read the
   same way everywhere in the app. */
function VpsLocationStep({
  province,
  onProvinceChange,
}: {
  province: string;
  onProvinceChange: (province: string) => void;
}) {
  return (
    <>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Pick the datacenter this server will run in.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {VPS_PROVINCES.map((p) => {
          const selected = p.name === province;
          return (
            <ClickableSurface
              key={p.name}
              onClick={() => p.available && onProvinceChange(p.name)}
              className={
                "flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                (!p.available
                  ? "cursor-not-allowed border-zinc-100 opacity-60 dark:border-zinc-900"
                  : selected
                  ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
              }
            >
              <MapPin
                className={"h-5 w-5 " + (selected ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")}
              />
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {p.available ? "Available" : "Coming soon"}
              </span>
            </ClickableSurface>
          );
        })}
      </div>
    </>
  );
}

/* Step 4 — SSH Key. Same account-level key list + "pop up" (browse
   existing / paste new / edit) that Create VPS already uses, so adding
   a key here and adding one there draw from the exact same store. */
function VpsSshKeyStep({
  sshKeys,
  selectedSshKeyIds,
  onSelect,
  onRemove,
  onOpenDialog,
}: {
  sshKeys: VpsSshKey[];
  selectedSshKeyIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenDialog: () => void;
}) {
  const selectedKeys = sshKeys.filter((k) => selectedSshKeyIds.includes(k.id));

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] text-zinc-500 dark:text-zinc-400">
          Any key listed here can log in as root.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenDialog}
          className="h-9 shrink-0 gap-1.5 text-sm"
        >
          <KeyRound className="h-4 w-4" />
          Add
        </Button>
      </div>

      {selectedKeys.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {selectedKeys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{k.name}</p>
                <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{k.publicKey}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${k.name}`}
                onClick={() => onRemove(k.id)}
                className="shrink-0 text-zinc-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 pt-4 pb-6 text-center dark:border-zinc-800">
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">No SSH keys added yet.</p>
        </div>
      )}
    </>
  );
}

/* Step 5 — Networking. Only IPv4 actually exists today, so it's checked
   and locked on; IPv6/Private Network are modeled as the same
   multi-select checkboxes they'll become once they ship, just disabled
   with a "Coming soon" hint instead of hidden entirely. */
function VpsNetworkStep() {
  const options = [
    { id: "ipv4", label: "IPv4", hint: "A public IPv4 address, included by default.", checked: true, disabled: true },
    { id: "ipv6", label: "IPv6", hint: "Coming soon.", checked: false, disabled: true },
    { id: "private", label: "Private Network", hint: "Coming soon.", checked: false, disabled: true },
  ];

  return (
    <>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Choose which networks this server should have. More than one can be selected.
      </p>

      <div className="mt-4 space-y-2">
        {options.map((o) => (
          <Label
            key={o.id}
            htmlFor={`network-${o.id}`}
            className="flex cursor-not-allowed items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 font-normal dark:border-zinc-800"
          >
            <span className="flex items-start gap-3">
              <Checkbox id={`network-${o.id}`} checked={o.checked} disabled={o.disabled} className="mt-0.5" />
              <span>
                <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{o.label}</span>
                <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">{o.hint}</span>
              </span>
            </span>
          </Label>
        ))}
      </div>
    </>
  );
}

/* Service Specification — an add-on that sits under the plan list,
   since what it scales is the plan itself. Each row picks how much to
   ADD, counted from 1 rather than from whatever the plan bundles; the
   line underneath spells out what that leaves the server with. */
function VpsSpecAddOn({
  tier,
  enabled,
  onEnabledChange,
  chosen,
  onChange,
}: {
  tier: PricingPlan;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  chosen: Record<string, number>;
  onChange: (key: string, added: number) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Service Specification Add-on
            <span className="ml-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Optional
            </span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            Add resources on top of {tier.name}, billed at the same rate a larger plan would charge.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} className="mt-0.5 shrink-0" />
      </div>

      {enabled && (
        <div className="mt-4 space-y-2">
          {VPS_SPEC_ADDONS.map((a) => {
            const base = specBaseline(tier, a.specLabel);
            const room = specRoom(tier, a);
            const added = specAddedFor(tier, a, chosen[a.key]);
            const total = base + added;
            const extra = added * a.rateKHR;
            // Add-on quantities start at 0 — each resource is opted
            // into separately — and only stop where the finished
            // server would pass the ceiling.
            const options = a.options.filter((n) => n <= room);

            return (
              <div
                key={a.key}
                className="rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {a.label}
                  </span>
                  <Select value={String(added)} onValueChange={(v) => onChange(a.key, Number(v))}>
                    <SelectTrigger className="h-8 w-[150px] shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n === 0 ? "None" : `+ ${n.toLocaleString()} ${a.unit}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    {base.toLocaleString()} included → {total.toLocaleString()} {a.unit} · max{" "}
                    {a.max.toLocaleString()} {a.unit}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                    +{extra.toLocaleString()} KHR/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Snapshot Protection — an add-on subscription, not part of the server
   plan: a switch to buy it at all, then which tier. Same Switch →
   tier → specs shape Create VPS uses, reading the same
   SERVICE_PRICING.vpsSnapshot list, so the two can't drift apart. */
function VpsSnapshotStep({
  enabled,
  onEnabledChange,
  tierId,
  onSelectTier,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  tierId: string;
  onSelectTier: (id: string) => void;
}) {
  const tier = SNAPSHOT_TIERS.find((t) => t.id === tierId) ?? SNAPSHOT_TIERS[0];

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[13px] text-zinc-500 dark:text-zinc-400">
          On-demand snapshots of this server, billed as its own plan on top of the server.
        </p>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} className="mt-0.5 shrink-0" />
      </div>

      {enabled && (
        <>
          <RadioGroup value={tier.id} onValueChange={onSelectTier} className="mt-4 space-y-2">
            {SNAPSHOT_TIERS.map((t) => {
              const selected = t.id === tier.id;
              const id = `snapshot-tier-${t.id}`;
              return (
                <Label
                  key={t.id}
                  htmlFor={id}
                  className={
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 font-normal motion-safe:transition-colors " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                    (selected
                      ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{t.name}</span>
                      <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {t.priceKHR.toLocaleString()} KHR/{t.period}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">
                      {t.specs.map(([, value]) => value).join(" · ")}
                    </span>
                  </span>
                  <RadioGroupItem value={t.id} id={id} className="ml-2 shrink-0" />
                </Label>
              );
            })}
          </RadioGroup>

          {/* What the picked tier actually configures — so choosing one
              isn't just a name and a price. */}
          <dl className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-zinc-50 p-3 text-[12px] dark:bg-zinc-900/60">
            {tier.specs.map(([label, value]) => (
              <div key={label}>
                <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </>
  );
}

/* Step 3 of the VPS wizard — hostname + OS. These are the two things
   Create VPS would otherwise ask for after payment; collecting them
   here means Subscribe hands back everything needed to provision the
   server immediately, in one flow. */
function VpsServerDetailsStep({
  hostname,
  onHostnameChange,
  osFamily,
  onOsFamilyChange,
  osVersion,
  onOsVersionChange,
}: {
  hostname: string;
  onHostnameChange: (value: string) => void;
  osFamily: string;
  onOsFamilyChange: (family: string) => void;
  osVersion: string;
  onOsVersionChange: (version: string) => void;
}) {
  return (
    <>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Pick a hostname and operating system for your new server.
      </p>

      <div className="mt-4">
        <Label htmlFor="vps-hostname" className="text-zinc-900 dark:text-zinc-100">
          Hostname <span className="text-red-500">*</span>
        </Label>
        <Input
          id="vps-hostname"
          placeholder="e.g. my-server.cloudplus.test"
          value={hostname}
          onChange={(e) => onHostnameChange(e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="mt-5">
        <Label className="text-zinc-900 dark:text-zinc-100">Operating System</Label>
        <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VPS_OS_FAMILIES.map((f) => {
              const meta = OS_LOGO[f.family] ?? {
                letter: f.family[0],
                bg: "bg-zinc-100 dark:bg-zinc-800",
                text: "text-zinc-600 dark:text-zinc-300",
              };
              const Icon = meta.icon;
              const selected = f.family === osFamily;
              const versionForFamily = selected ? osVersion : f.versions[0];

              return (
                <ClickableSurface
                  key={f.family}
                  onClick={() => onOsFamilyChange(f.family)}
                  className={
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                    (selected
                      ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                  }
                >
                  <span
                    className={
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border " +
                      (selected
                        ? "border-[#1C75BC] bg-[#1C75BC]"
                        : "border-zinc-300 dark:border-zinc-600")
                    }
                  >
                    {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>

                  <span className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-full " + meta.bg}>
                    {Icon ? (
                      <Icon className={"h-6 w-6 " + meta.text} />
                    ) : (
                      <span className={"text-base font-bold " + meta.text}>{meta.letter}</span>
                    )}
                  </span>

                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.family}</span>

                  <div className="w-full" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={versionForFamily}
                      onValueChange={(v) => {
                        onOsFamilyChange(f.family);
                        onOsVersionChange(v);
                      }}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.versions.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </ClickableSurface>
              );
            })}
          </div>
        </div>
    </>
  );
}

function PlanPicker({
  categoryKey,
  icon: Icon,
  tierId,
  currentTierId,
  onSelectTier,
  onContinue,
  hideContinue = false,
}: {
  categoryKey: PricingServiceKey;
  icon: ComponentType<{
    className?: string;
    animate?: boolean | string;
    animateOnView?: boolean | string;
    animateOnHover?: boolean | string;
    animateOnTap?: boolean | string;
    loop?: boolean;
  }>;
  tierId: string;
  // Only set in upgrade mode — the plan the subscription is on right
  // now, so it can be marked "Current Plan" instead of just another
  // selectable tier.
  currentTierId?: string;
  onSelectTier: (id: string) => void;
  onContinue: () => void;
  // Hidden when Server Details renders right below this same card (new
  // VPS subscriptions) — one shared Continue button at the bottom of
  // that section drives both instead of two separate ones stacked.
  hideContinue?: boolean;
}) {
  const [changingPlan, setChangingPlan] = useState(false);
  const tiers = SERVICE_PRICING[categoryKey];
  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const theme = getTierTheme(tier.id);
  const priceDisplay = tier.priceKHR === 0 ? "FREE" : `${tier.priceKHR.toLocaleString()} KHR/${tier.period}`;
  const isCurrentTier = currentTierId != null && tier.id === currentTierId;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg " + theme.chip}>
          <Icon className={"h-5 w-5 " + theme.icon} animateOnView />
        </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{tier.name}</p>
              {isCurrentTier && (
                <Badge className="border-transparent bg-zinc-100 font-bold text-zinc-600 hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-300">
                  Current Plan
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{tier.description}</p>
          </div>
        </div>

        <p className="mt-4">
          <span className={"text-2xl font-bold " + (tier.priceKHR === 0 ? "text-zinc-900 dark:text-zinc-50" : theme.icon)}>
            {priceDisplay}
          </span>
        </p>

        <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-[13px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {tier.specs.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setChangingPlan((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-[#1C75BC] motion-safe:transition-colors hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8] dark:hover:bg-zinc-900"
          >
            {changingPlan ? "Hide other plans" : "Change Plan"}
            <ChevronDown
              className={"h-3.5 w-3.5 transition-transform " + (changingPlan ? "rotate-180" : "")}
              animateOnHover
              animateOnTap
            />
          </button>

          {changingPlan && (
            <RadioGroup
              value={tier.id}
              onValueChange={onSelectTier}
              className="mt-3 grid grid-cols-2 gap-2.5"
            >
              {tiers.map((t) => {
                const isSelected = t.id === tier.id;
                const isCurrent = currentTierId != null && t.id === currentTierId;
                const id = `tier-${t.id}`;
                return (
                  <Label
                    key={t.id}
                    htmlFor={id}
                    className={
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 font-normal motion-safe:transition-colors " +
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                      (isSelected
                        ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                    }
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {t.name}
                        {isCurrent && (
                          <span className="text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                            (Current)
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">
                        {t.priceKHR === 0 ? "FREE" : `${t.priceKHR.toLocaleString()} KHR/${t.period}`}
                      </span>
                    </span>
                    <RadioGroupItem value={t.id} id={id} />
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        </div>

        {!hideContinue && (
          <Button
            variant="brand"
            disabled={isCurrentTier}
            onClick={onContinue}
            className="mt-5 h-10 w-full text-sm"
          >
            {isCurrentTier ? "You're already on this plan" : `${currentTierId != null ? "Upgrade to" : "Continue with"} ${tier.name}`}
          </Button>
        )}
      </Card>
  );
}

/* "Upgrade now" vs "Schedule for later" — only shown mid-upgrade (a new
   subscription has no current plan to keep running in the meantime).
   Scheduling skips payment here; the change (and its charge) only
   happens once the date arrives. */
function SchedulePicker({
  tierName,
  currentTierName,
  priceDisplay,
  specs,
  choice,
  onChoiceChange,
  date,
  onDateChange,
  minDate,
  onContinue,
}: {
  tierName: string;
  currentTierName?: string;
  priceDisplay: string;
  specs: [string, string][];
  choice: ScheduleChoice;
  onChoiceChange: (choice: ScheduleChoice) => void;
  date: string;
  onDateChange: (date: string) => void;
  minDate: string;
  onContinue: () => void;
}) {
  const canContinue = choice === "now" || Boolean(date);

  return (
    <div className="mx-auto max-w-[440px]">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {currentTierName ? `Upgrading from ${currentTierName} to` : "Upgrading to"}
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{tierName}</p>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{priceDisplay}</p>
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-[13px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {specs.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t border-zinc-100 pt-4 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
          When should this take effect?
        </p>

        <RadioGroup
          value={choice}
          onValueChange={(v) => onChoiceChange(v as ScheduleChoice)}
          className="mt-3 space-y-2.5"
        >
          {(
            [
              ["now", "Upgrade now", `Pay ${priceDisplay} now — takes effect right after payment.`],
              [
                "later",
                "Schedule for later",
                `Pick a date — your current plan stays active until then, then ${priceDisplay} is charged.`,
              ],
            ] as const
          ).map(([value, label, hint]) => {
            const id = `schedule-${value}`;
            const isSelected = choice === value;
            return (
              <Label
                key={value}
                htmlFor={id}
                className={
                  "flex cursor-pointer items-start justify-between gap-3 rounded-lg border px-3 py-2.5 font-normal motion-safe:transition-colors " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                  (isSelected
                    ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                }
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">{hint}</span>
                </span>
                <RadioGroupItem value={value} id={id} className="mt-0.5" />
              </Label>
            );
          })}
        </RadioGroup>

        {choice === "later" && (
          <div className="mt-3">
            <Label htmlFor="schedule-date" className="text-zinc-900 dark:text-zinc-100">
              Upgrade date
            </Label>
            <Input
              id="schedule-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-2"
            />
          </div>
        )}

        <Button
          variant="brand"
          disabled={!canContinue}
          onClick={onContinue}
          className="mt-5 h-10 w-full text-sm"
        >
          Continue
        </Button>
      </Card>
    </div>
  );
}

function SubscribeSummary({
  name,
  priceDisplay,
  currentTierName,
}: {
  name: string;
  priceDisplay: string;
  currentTierName?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {currentTierName ? `Upgrading from ${currentTierName} to` : "Subscribing to"}
          </p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
        </div>
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{priceDisplay}</p>
      </div>
    </Card>
  );
}

function SuccessPage({
  categoryLabel,
  tierName,
  priceDisplay,
  isUpgrade,
  scheduledDate,
  onDone,
}: {
  categoryLabel: string;
  tierName: string;
  priceDisplay: string;
  isUpgrade?: boolean;
  scheduledDate?: string;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[440px] flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" animateOnView />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {scheduledDate ? "Upgrade Scheduled" : isUpgrade ? "Plan Upgraded" : "Subscription Active"}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {scheduledDate
            ? `Your plan will change to ${tierName} (${priceDisplay}) on ${formatScheduleDate(scheduledDate)}. You won't be charged until then.`
            : isUpgrade
            ? `You've upgraded to the ${tierName} plan (${priceDisplay}) for ${categoryLabel}.`
            : `You're now on the ${tierName} plan (${priceDisplay}) for ${categoryLabel}.`}
        </p>
      </div>

      <Button variant="brand" onClick={onDone} className="mt-2 h-10 w-full text-sm">
        Done
      </Button>
    </div>
  );
}

export function SubscribePage({
  categoryKey,
  categoryLabel,
  icon,
  initialTierId,
  mode = "new",
  onDone,
  onCancel,
}: {
  categoryKey: PricingServiceKey;
  categoryLabel: string;
  icon: ComponentType<{
    className?: string;
    animate?: boolean | string;
    animateOnView?: boolean | string;
    animateOnHover?: boolean | string;
    animateOnTap?: boolean | string;
    loop?: boolean;
  }>;
  initialTierId: string;
  // "upgrade" treats initialTierId as the subscription's current plan
  // (marked "Current Plan", can't re-select/pay for it) instead of just
  // a pre-picked starting point.
  mode?: SubscribeMode;
  // Called with the tier actually bought — the Plan step lets you
  // change it right up until payment, so it can end up different from
  // initialTierId; callers that need to record which plan won (e.g.
  // Database Backup, scoped to one instance) read it from here rather
  // than re-reading initialTierId. `scheduledDate` is set only when the
  // upgrade was scheduled for later rather than applied now.
  // `server` carries the hostname/OS/region collected mid-flow — only
  // set for a brand-new VPS subscription, since that's the only case
  // with a server left to provision.
  onDone: (
    tierId: string,
    scheduledDate?: string,
    server?: {
      hostname: string;
      os: string;
      region: string;
      snapshotEnabled: boolean;
      snapshotTierId?: string;
      // Final resources after any Service Specification add-ons, so the
      // provisioned server shows what was actually paid for rather than
      // the plan's bundled defaults.
      specs?: { cpu: string; memory: string; storage: string };
    }
  ) => void;
  onCancel: () => void;
}) {
  const isUpgrade = mode === "upgrade";
  const isNewVps = categoryKey === "vps" && !isUpgrade;
  const tiers = SERVICE_PRICING[categoryKey];
  const [step, setStep] = useState<Step>(isNewVps ? "resource" : "plan");
  /* Only CPU starts open — the page arrives as a short stack of
     collapsed rows rather than five screens of controls, and "Next"
     at the bottom of a row closes it and opens the one after. Nothing
     is gated: every row's own chevron still opens it at any time, in
     any order, and nothing auto-closes behind your back. Only Server
     Details (hostname + OS) genuinely has to be filled in, so it's
     what the Checkout button waits on. */
  const [expandedVpsSteps, setExpandedVpsSteps] = useState<Step[]>(() => [
    VPS_WIZARD_STEPS[0].step,
  ]);
  function toggleVpsStep(target: Step) {
    setExpandedVpsSteps((prev) =>
      prev.includes(target) ? prev.filter((s) => s !== target) : [...prev, target]
    );
  }
  // "Next" is a hand-off, not a gate: it collapses the row you just
  // finished and opens the following one, leaving every other row
  // exactly as you left it.
  function advanceVpsStep(current: Step, next: Step) {
    setExpandedVpsSteps((prev) => [...prev.filter((s) => s !== current && s !== next), next]);
  }
  const [tierId, setTierId] = useState(
    tiers.some((t) => t.id === initialTierId) ? initialTierId : tiers[0].id
  );
  const [scheduleChoice, setScheduleChoice] = useState<ScheduleChoice>("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [hostname, setHostname] = useState("");
  const [osFamily, setOsFamily] = useState(VPS_OS_FAMILIES[0].family);
  const [osVersion, setOsVersion] = useState(VPS_OS_FAMILIES[0].versions[0]);
  const [province, setProvince] = useState(VPS_PROVINCES[0].name);
  // SSH keys are account-level and reusable — same store Create VPS
  // reads/writes, so a key added in either place shows up in both.
  const [sshKeys, setSshKeys] = useState(() => [...VPS_SSH_KEYS]);
  // Nothing is attached by default — a key on the account isn't the same
  // as a key you meant to put on *this* server, and the step is optional
  // anyway, so it starts empty and waits to be picked via "Add".
  const [selectedSshKeyIds, setSelectedSshKeyIds] = useState<string[]>([]);
  const [sshDialogOpen, setSshDialogOpen] = useState(false);
  const [vpsPaymentDialogOpen, setVpsPaymentDialogOpen] = useState(false);
  // Snapshot protection is opt-in and priced separately — off until
  // asked for, same default Create VPS uses.
  const [snapshotEnabled, setSnapshotEnabled] = useState(false);
  const [snapshotTierId, setSnapshotTierId] = useState(SNAPSHOT_TIERS[0].id);
  // Chosen *totals* per resource. Empty means "whatever the plan
  // includes" — and since every read clamps to the plan's baseline,
  // switching to a bigger plan can never leave a stale smaller number
  // behind.
  const [specChoices, setSpecChoices] = useState<Record<string, number>>({});
  // Same opt-in shape as Snapshot Protection: off means the server runs
  // exactly what its plan includes and nothing extra is billed. The
  // picked totals survive toggling off, so flipping it back restores
  // them instead of resetting the whole step.
  const [specEnabled, setSpecEnabled] = useState(false);
  // Switching family (vs. just picking a version within the same one)
  // resets the version to that family's first — the old value may not
  // even exist on the new one's list.
  function selectOsFamily(family: string) {
    setOsFamily(family);
    setOsVersion(VPS_OS_FAMILIES.find((f) => f.family === family)?.versions[0] ?? "");
  }
  function selectExistingSshKey(id: string) {
    setSelectedSshKeyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function removeSshKey(id: string) {
    setSelectedSshKeyIds((prev) => prev.filter((existing) => existing !== id));
  }
  function createNewSshKey(key: { name: string; publicKey: string }) {
    const saved = addVpsSshKey(key);
    setSshKeys((prev) => [...prev, saved]);
    setSelectedSshKeyIds((prev) => [...prev, saved.id]);
  }
  function updateExistingSshKey(id: string, key: { name: string; publicKey: string }) {
    updateVpsSshKey(id, key);
    setSshKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...key } : k)));
  }
  function deleteExistingSshKey(id: string) {
    deleteVpsSshKey(id);
    setSshKeys((prev) => prev.filter((k) => k.id !== id));
    setSelectedSshKeyIds((prev) => prev.filter((existing) => existing !== id));
  }
  const [method, setMethod] = useState<PaymentSelection | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  // Same shared SAVED_CARDS array Wallet/Top Up read — a card added
  // there (or right here, mid-flow) is a "no scan needed" choice.
  const [cards, setCards] = useState<SavedCard[]>(() => [...SAVED_CARDS]);
  // Tomorrow — a schedule can't be for today or the past.
  const minScheduleDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const isScheduled = isUpgrade && scheduleChoice === "later" && Boolean(scheduledDate);

  const currentTierId = isUpgrade ? initialTierId : undefined;
  const currentTierName = tiers.find((t) => t.id === currentTierId)?.name;
  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const priceDisplay = tier.priceKHR === 0 ? "FREE" : `${tier.priceKHR.toLocaleString()} KHR/${tier.period}`;
  const isFree = tier.priceKHR === 0;
  // The only thing standing between here and checkout. OS always has a
  // family/version picked, so in practice this is "name your server".
  const canCheckoutVps = hostname.trim().length > 0 && Boolean(osFamily && osVersion);
  // One checkout, two subscriptions: the server plan plus snapshot
  // protection when it's switched on. Every VPS price shown from here
  // on — rail total, Checkout button, payment dialog — is this number.
  const snapshotTier = SNAPSHOT_TIERS.find((t) => t.id === snapshotTierId) ?? SNAPSHOT_TIERS[0];
  const specExtraKHR = specExtraCost(tier, specChoices, specEnabled);
  const vpsTotalKHR =
    tier.priceKHR + specExtraKHR + (snapshotEnabled ? snapshotTier.priceKHR : 0);
  const resolvedSpecs = finalSpecs(tier, specChoices, specEnabled);
  const purchasedSpecs = {
    cpu: resolvedSpecs["vCPU"],
    memory: resolvedSpecs["RAM"],
    storage: resolvedSpecs["SSD Storage"],
  };

  return (
    <div>
      {step !== "success" && (
        <>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
          >
            <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
            Back
          </button>

          <h1 className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {isUpgrade ? `Upgrade ${categoryLabel} Plan` : `Subscribe to ${categoryLabel}`}
          </h1>
        </>
      )}

      <div className="mt-7">
        {step === "plan" && (
          <div className="mx-auto max-w-[520px]">
            <PlanPicker
              categoryKey={categoryKey}
              icon={icon}
              tierId={tierId}
              currentTierId={currentTierId}
              onSelectTier={setTierId}
              onContinue={() => {
                if (isUpgrade) {
                  setScheduleChoice("now");
                  setScheduledDate("");
                  setStep("schedule");
                } else {
                  setStep(isFree ? "success" : "method");
                }
              }}
            />
          </div>
        )}

        {/* The brand-new VPS config — CPU, Location, Server Details,
            SSH Key, Networking as plain stacked cards. There's no
            step-through: every row already holds a working default and
            opens/closes on its own chevron, collapsed showing a
            one-line summary of what it's set to. Only Server Details
            is required, and the right rail's Checkout button is the
            single action for the whole page. */}
        {isNewVps && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-3 lg:col-span-2">
              {VPS_WIZARD_STEPS.map((s, i) => (
                <VpsWizardStepRow
                  key={s.step}
                  index={i}
                  label={s.label}
                  required={s.step === "os"}
                  expanded={expandedVpsSteps.includes(s.step)}
                  summary={vpsStepSummary(s.step, {
                    tier,
                    province,
                    hostname,
                    osFamily,
                    osVersion,
                    sshKeys,
                    selectedSshKeyIds,
                    snapshotEnabled,
                    snapshotTierId,
                    specChoices,
                    specEnabled,
                  })}
                  onToggle={() => toggleVpsStep(s.step)}
                  nextLabel={VPS_WIZARD_STEPS[i + 1]?.label}
                  onNext={
                    VPS_WIZARD_STEPS[i + 1]
                      ? () => advanceVpsStep(s.step, VPS_WIZARD_STEPS[i + 1].step)
                      : undefined
                  }
                >
                  {s.step === "resource" && (
                    <VpsResourceStep
                      tierId={tierId}
                      onSelectTier={setTierId}
                      tier={tier}
                      specEnabled={specEnabled}
                      onSpecEnabledChange={setSpecEnabled}
                      specChoices={specChoices}
                      onSpecChange={(key, added) =>
                        setSpecChoices((prev) => ({ ...prev, [key]: added }))
                      }
                    />
                  )}
                  {s.step === "location" && (
                    <VpsLocationStep province={province} onProvinceChange={setProvince} />
                  )}
                  {s.step === "os" && (
                    <VpsServerDetailsStep
                      hostname={hostname}
                      onHostnameChange={setHostname}
                      osFamily={osFamily}
                      onOsFamilyChange={selectOsFamily}
                      osVersion={osVersion}
                      onOsVersionChange={setOsVersion}
                    />
                  )}
                  {s.step === "ssh" && (
                    <VpsSshKeyStep
                      sshKeys={sshKeys}
                      selectedSshKeyIds={selectedSshKeyIds}
                      onSelect={selectExistingSshKey}
                      onRemove={removeSshKey}
                      onOpenDialog={() => setSshDialogOpen(true)}
                    />
                  )}
                  {s.step === "network" && <VpsNetworkStep />}
                  {s.step === "snapshot" && (
                    <VpsSnapshotStep
                      enabled={snapshotEnabled}
                      onEnabledChange={setSnapshotEnabled}
                      tierId={snapshotTierId}
                      onSelectTier={setSnapshotTierId}
                    />
                  )}
                </VpsWizardStepRow>
              ))}
            </div>
            {/* The plan + total + Checkout follow you down the page —
                the whole left column is long enough that the price
                you're changing would otherwise scroll out of sight.
                `top-0` is measured against the app's scrolling <main>,
                and the column scrolls internally if it ever outgrows
                the viewport. */}
            <div className="min-w-0 space-y-4 lg:sticky lg:top-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <VpsPlanSummaryCard tier={tier} specOverride={resolvedSpecs} />
              <VpsCostSummary
                tier={tier}
                specChoices={specChoices}
                specEnabled={specEnabled}
                snapshotEnabled={snapshotEnabled}
                snapshotTier={snapshotTier}
                total={vpsTotalKHR}
              />
              <Card>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {canCheckoutVps ? "Ready to check out" : "Almost there"}
                </p>
                <p className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                  {canCheckoutVps
                    ? "Everything else is already set — check out to provision this server."
                    : "Name your server under Server Details to unlock checkout."}
                </p>
                <Button
                  variant="brand"
                  disabled={!canCheckoutVps}
                  onClick={() => {
                    if (isFree) {
                      // A free tier skips payment but configures the
                      // same server, so it carries the same payload
                      // the paid path hands over.
                      onDone(tier.id, undefined, {
                        hostname,
                        os: `${osFamily} ${osVersion}`,
                        region: province,
                        snapshotEnabled,
                        snapshotTierId: snapshotEnabled ? snapshotTier.id : undefined,
                        specs: purchasedSpecs,
                      });
                    } else {
                      setVpsPaymentDialogOpen(true);
                    }
                  }}
                  className="mt-3 h-10 w-full text-sm"
                >
                  {isFree ? "Activate" : `Checkout · ${vpsTotalKHR.toLocaleString()} KHR/mo`}
                </Button>
              </Card>
            </div>
          </div>
        )}

        {step === "schedule" && (
          <SchedulePicker
            tierName={tier.name}
            currentTierName={currentTierName}
            priceDisplay={priceDisplay}
            specs={tier.specs}
            choice={scheduleChoice}
            onChoiceChange={setScheduleChoice}
            date={scheduledDate}
            onDateChange={setScheduledDate}
            minDate={minScheduleDate}
            onContinue={() => {
              if (scheduleChoice === "later") {
                setStep("success");
              } else {
                setStep(isFree ? "success" : "method");
              }
            }}
          />
        )}

        {step === "method" && (
          <PaymentMethodPicker
            summary={
              <SubscribeSummary
                name={tier.name}
                priceDisplay={priceDisplay}
                currentTierName={isUpgrade ? currentTierName : undefined}
              />
            }
            payLabel={`Pay ${tier.priceKHR.toLocaleString()} KHR`}
            amount={tier.priceKHR}
            allowBG
            selected={method}
            cards={cards}
            onSelect={setMethod}
            onPay={() => setPayOpen(true)}
            onAddCard={() => setAddCardOpen(true)}
          />
        )}

        {step === "success" && (
          <SuccessPage
            categoryLabel={categoryLabel}
            tierName={tier.name}
            priceDisplay={priceDisplay}
            isUpgrade={isUpgrade}
            scheduledDate={isScheduled ? scheduledDate : undefined}
            onDone={() =>
              onDone(
                tier.id,
                isScheduled ? scheduledDate : undefined,
                isNewVps
                  ? {
                      hostname,
                      os: `${osFamily} ${osVersion}`,
                      region: province,
                      snapshotEnabled,
                      snapshotTierId: snapshotEnabled ? snapshotTier.id : undefined,
                      specs: purchasedSpecs,
                    }
                  : undefined
              )
            }
          />
        )}
      </div>

      {step === "schedule" && (
        <div className="mx-auto mt-3 max-w-[440px]">
          <button
            type="button"
            onClick={() => setStep("plan")}
            className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
          >
            ← Change plan
          </button>
        </div>
      )}

      {step === "method" && (
        <div className="mx-auto mt-3 max-w-[440px]">
          <button
            type="button"
            onClick={() => setStep("plan")}
            className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
          >
            ← Change plan
          </button>
        </div>
      )}

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={isNewVps ? vpsTotalKHR : tier.priceKHR}
        selection={resolvePaymentSelection(method, cards)}
        onSuccess={() => {
          setPayOpen(false);
          if (isNewVps) {
            // Payment happened inside the Checkout popup — there's no
            // separate Success page to land on, just straight through
            // to the server that's now actually provisioned.
            setVpsPaymentDialogOpen(false);
            onDone(tier.id, undefined, {
              hostname,
              os: `${osFamily} ${osVersion}`,
              region: province,
              snapshotEnabled,
              snapshotTierId: snapshotEnabled ? snapshotTier.id : undefined,
              specs: purchasedSpecs,
            });
          } else {
            setStep("success");
          }
        }}
      />

      <AddCardDialog
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        onSave={(card) => {
          const saved = addSavedCard(card);
          setCards((prev) => [...prev, saved]);
          setMethod(`card:${saved.id}`);
        }}
      />

      {isNewVps && (
        <SelectSshKeyDialog
          open={sshDialogOpen}
          onOpenChange={setSshDialogOpen}
          availableKeys={sshKeys.filter((k) => !selectedSshKeyIds.includes(k.id))}
          onSelectExisting={selectExistingSshKey}
          onCreateNew={createNewSshKey}
          onUpdateExisting={updateExistingSshKey}
          onDeleteExisting={deleteExistingSshKey}
        />
      )}

      {isNewVps && (
        <Dialog open={vpsPaymentDialogOpen} onOpenChange={setVpsPaymentDialogOpen}>
          <DialogContent className="max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Choose how you&apos;d like to pay for this server.</DialogDescription>
            </DialogHeader>
            <PaymentMethodPicker
              summary={
                <VpsCostSummary
                  tier={tier}
                  specChoices={specChoices}
                  specEnabled={specEnabled}
                  snapshotEnabled={snapshotEnabled}
                  snapshotTier={snapshotTier}
                  total={vpsTotalKHR}
                />
              }
              payLabel={`Pay ${vpsTotalKHR.toLocaleString()} KHR`}
              amount={vpsTotalKHR}
              allowBG
              selected={method}
              cards={cards}
              onSelect={setMethod}
              onPay={() => setPayOpen(true)}
              onAddCard={() => setAddCardOpen(true)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
