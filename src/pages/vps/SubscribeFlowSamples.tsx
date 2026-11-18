import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Camera, Check, Cpu, Globe, KeyRound, MapPin, Server } from "lucide-react";

import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClickableSurface } from "../../components/atoms";
import { SERVICE_PRICING } from "../../data/pricing";
import {
  customPlan,
  finalSpecs,
  specExtraCost,
  SNAPSHOT_TIERS,
  VPS_PRESET_PLAN_COUNT,
  VPS_WIZARD_STEPS,
  VpsCostSummary,
  VpsLocationStep,
  VpsNetworkStep,
  VpsPlanSummaryCard,
  VpsResourceStep,
  VpsServerDetailsStep,
  VpsSnapshotStep,
  VpsSshKeyStep,
  vpsStepSummary,
  type Step,
  type VpsPlanMode,
} from "../SubscribePage";
import { VPS_PROVINCES } from "./CreateVpsPage";
import {
  addVpsSshKey,
  deleteVpsSshKey,
  SelectSshKeyDialog,
  updateVpsSshKey,
  VPS_OS_FAMILIES,
  VPS_SSH_KEYS,
} from "./VpsDialogs";
import { buyVpsIpAddress, EXTRA_IP_PRICE_KHR, VPS_IP_ADDRESSES } from "./VpsIpAddressesPage";

/* ------------------------------------------------------------------ *
 * Subscribe to VPS — flow samples
 *
 * Six ways to lay out the same six-step configuration, side by side
 * so they can be compared rather than argued about. Every tab renders
 * the SAME step components, summaries and running total as the live
 * Subscribe page — only the shell around them changes. That's
 * deliberate: a layout comparison is only honest if the content is
 * identical, and reusing the real components means a sample can't
 * quietly drift into showing information the product doesn't have.
 *
 * The shells share one visual language — the same numbered indicator,
 * the same brand blue for "here", the same green tick for "done" — so
 * what stands out between tabs is the structure, not the styling.
 *
 * Each tab keeps its own draft, so poking at one doesn't disturb the
 * others.
 * ------------------------------------------------------------------ */

const REQUIRED_STEP: Step = "os";

const BRAND = "#1C75BC";

/* An icon and a one-line "why you'd open this" per step — the samples
   lean on these to give each row something to recognize besides its
   number. */
const STEP_META: Record<string, { icon: ComponentType<{ className?: string }>; hint: string }> = {
  resource: { icon: Cpu, hint: "Size of the machine" },
  os: { icon: Server, hint: "Name and operating system" },
  location: { icon: MapPin, hint: "Which datacenter" },
  ssh: { icon: KeyRound, hint: "How you log in" },
  network: { icon: Globe, hint: "How it's reached" },
  snapshot: { icon: Camera, hint: "Backups of the disk" },
};

function stepIcon(step: Step) {
  return STEP_META[step]?.icon ?? Server;
}

/* All the state one Subscribe flow needs, plus the step bodies and
   summaries built from it — so a layout below is purely a shell:
   where the rows go, what's open, and how you move between them. */
function useVpsDraft() {
  const tiers = SERVICE_PRICING.vps.slice(0, VPS_PRESET_PLAN_COUNT);

  const [tierId, setTierId] = useState("standard");
  const [planMode, setPlanMode] = useState<VpsPlanMode>("preset");
  const [customChoices, setCustomChoices] = useState<Record<string, number>>({});
  const [specEnabled, setSpecEnabled] = useState(false);
  const [specChoices, setSpecChoices] = useState<Record<string, number>>({});
  const [hostname, setHostname] = useState("");
  const [osFamily, setOsFamily] = useState(VPS_OS_FAMILIES[0].family);
  const [osVersion, setOsVersion] = useState(VPS_OS_FAMILIES[0].versions[0]);
  const [province, setProvince] = useState(VPS_PROVINCES[0].name);
  const [sshKeys, setSshKeys] = useState(() => [...VPS_SSH_KEYS]);
  const [selectedSshKeyIds, setSelectedSshKeyIds] = useState<string[]>([]);
  const [sshDialogOpen, setSshDialogOpen] = useState(false);
  const [ipAddresses, setIpAddresses] = useState(() => [...VPS_IP_ADDRESSES]);
  const [selectedIpIds, setSelectedIpIds] = useState<string[]>([]);
  const [useFreeIp, setUseFreeIp] = useState(true);
  const [buyIpOpen, setBuyIpOpen] = useState(false);
  const [snapshotEnabled, setSnapshotEnabled] = useState(false);
  const [snapshotTierId, setSnapshotTierId] = useState(SNAPSHOT_TIERS[0].id);

  const presetTier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const tier = planMode === "custom" ? customPlan(customChoices) : presetTier;
  const addOnsActive = specEnabled && planMode !== "custom";
  const snapshotTier = SNAPSHOT_TIERS.find((t) => t.id === snapshotTierId) ?? SNAPSHOT_TIERS[0];
  const extraIps = selectedIpIds.length;
  const total =
    tier.priceKHR +
    specExtraCost(tier, specChoices, addOnsActive) +
    extraIps * EXTRA_IP_PRICE_KHR +
    (snapshotEnabled ? snapshotTier.priceKHR : 0);
  const resolvedSpecs = finalSpecs(tier, specChoices, addOnsActive);
  const canCheckout = hostname.trim().length > 0;

  const selectedIps = ipAddresses.filter((ip) => selectedIpIds.includes(ip.id));
  const availableIps = ipAddresses.filter(
    (ip) => ip.kind === "extra" && !ip.assignedTo && !selectedIpIds.includes(ip.id)
  );

  function body(step: Step): ReactNode {
    switch (step) {
      case "resource":
        return (
          <VpsResourceStep
            tierId={tierId}
            onSelectTier={setTierId}
            tier={presetTier}
            planMode={planMode}
            onPlanModeChange={setPlanMode}
            customChoices={customChoices}
            onCustomChange={(key, value) =>
              setCustomChoices((prev) => ({ ...prev, [key]: value }))
            }
            specEnabled={specEnabled}
            onSpecEnabledChange={setSpecEnabled}
            specChoices={specChoices}
            onSpecChange={(key, added) => setSpecChoices((prev) => ({ ...prev, [key]: added }))}
          />
        );
      case "os":
        return (
          <VpsServerDetailsStep
            hostname={hostname}
            onHostnameChange={setHostname}
            osFamily={osFamily}
            onOsFamilyChange={(family) => {
              setOsFamily(family);
              setOsVersion(VPS_OS_FAMILIES.find((f) => f.family === family)?.versions[0] ?? "");
            }}
            osVersion={osVersion}
            onOsVersionChange={setOsVersion}
          />
        );
      case "location":
        return <VpsLocationStep province={province} onProvinceChange={setProvince} />;
      case "ssh":
        return (
          <VpsSshKeyStep
            sshKeys={sshKeys}
            selectedSshKeyIds={selectedSshKeyIds}
            onSelect={(id) => setSelectedSshKeyIds((prev) => [...prev, id])}
            onRemove={(id) => setSelectedSshKeyIds((prev) => prev.filter((k) => k !== id))}
            onOpenDialog={() => setSshDialogOpen(true)}
          />
        );
      case "network":
        return (
          <VpsNetworkStep
            useFreeIp={useFreeIp}
            onUseFreeIpChange={setUseFreeIp}
            availableIps={availableIps}
            selectedIps={selectedIps}
            onAttach={(id) => setSelectedIpIds((prev) => [...prev, id])}
            onDetach={(id) => setSelectedIpIds((prev) => prev.filter((x) => x !== id))}
            onBuy={() => setBuyIpOpen(true)}
          />
        );
      case "snapshot":
        return (
          <VpsSnapshotStep
            enabled={snapshotEnabled}
            onEnabledChange={setSnapshotEnabled}
            tierId={snapshotTierId}
            onSelectTier={setSnapshotTierId}
          />
        );
      default:
        return null;
    }
  }

  function summary(step: Step) {
    return vpsStepSummary(step, {
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
      specEnabled: addOnsActive,
      extraIps,
      useFreeIp,
    });
  }

  const rail = (
    <>
      <VpsPlanSummaryCard tier={tier} specOverride={resolvedSpecs} />
      <VpsCostSummary
        tier={tier}
        specChoices={specChoices}
        specEnabled={addOnsActive}
        extraIps={extraIps}
        snapshotEnabled={snapshotEnabled}
        snapshotTier={snapshotTier}
        total={total}
      />
    </>
  );

  /* The same money as the rail, flattened to one charge per line —
     for layouts that need the breakdown to fit in a strip rather
     than a column. Each line carries the step it came from, so the
     answer to "what is this charge?" is one word. */
  const specAddOnKHR = specExtraCost(tier, specChoices, addOnsActive);
  const breakdown: { step: Step; label: string; detail: string; price: number }[] = [
    { step: "resource", label: "Plan", detail: tier.name, price: tier.priceKHR },
  ];
  if (specAddOnKHR > 0) {
    breakdown.push({
      step: "resource",
      label: "Add-ons",
      detail: "Service Specification",
      price: specAddOnKHR,
    });
  }
  if (extraIps > 0) {
    breakdown.push({
      step: "network",
      label: "IP Address",
      detail: `${extraIps} extra`,
      price: extraIps * EXTRA_IP_PRICE_KHR,
    });
  }
  if (snapshotEnabled) {
    breakdown.push({
      step: "snapshot",
      label: "Snapshot",
      detail: snapshotTier.name,
      price: snapshotTier.priceKHR,
    });
  }
  const specLine = ["vCPU", "RAM", "SSD Storage"]
    .map((k) => resolvedSpecs[k])
    .filter(Boolean)
    .join(" · ");

  /* The two dialogs every layout needs; rendered once per tab so each
     sample is self-contained. */
  const dialogs = (
    <>
      <SelectSshKeyDialog
        open={sshDialogOpen}
        onOpenChange={setSshDialogOpen}
        availableKeys={sshKeys.filter((k) => !selectedSshKeyIds.includes(k.id))}
        onSelectExisting={(id) => setSelectedSshKeyIds((prev) => [...prev, id])}
        onCreateNew={(key) => {
          const saved = addVpsSshKey(key);
          setSshKeys((prev) => [...prev, saved]);
          setSelectedSshKeyIds((prev) => [...prev, saved.id]);
        }}
        onUpdateExisting={(id, key) => {
          updateVpsSshKey(id, key);
          setSshKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...key } : k)));
        }}
        onDeleteExisting={(id) => {
          deleteVpsSshKey(id);
          setSshKeys((prev) => prev.filter((k) => k.id !== id));
          setSelectedSshKeyIds((prev) => prev.filter((k) => k !== id));
        }}
      />
      <ConfirmDialog
        open={buyIpOpen}
        onOpenChange={setBuyIpOpen}
        title="Buy an IP address?"
        description={`One extra public IPv4 address at ${EXTRA_IP_PRICE_KHR.toLocaleString()} KHR / month, added to your account straight away.`}
        confirmLabel={`Buy · ${EXTRA_IP_PRICE_KHR.toLocaleString()} KHR/mo`}
        onConfirm={() => {
          const bought = buyVpsIpAddress({ label: hostname.trim() || undefined });
          setIpAddresses((prev) => [...prev, bought]);
          setSelectedIpIds((prev) => [...prev, bought.id]);
          setBuyIpOpen(false);
        }}
      />
    </>
  );

  /* Set several steps at once — what a "pick what it's for" layout
     needs, since one choice there stands in for four of the six
     steps. Everything it touches stays editable afterwards. */
  function applyPreset(preset: {
    tierId: string;
    osFamily: string;
    osVersion: string;
    snapshot: boolean;
  }) {
    setPlanMode("preset");
    setTierId(preset.tierId);
    setOsFamily(preset.osFamily);
    setOsVersion(preset.osVersion);
    setSnapshotEnabled(preset.snapshot);
  }

  const preview = {
    hostname: hostname.trim(),
    os: `${osFamily} ${osVersion}`,
    osFamily,
    province,
    planName: tier.name,
    ipCount: (useFreeIp ? 1 : 0) + extraIps,
    snapshot: snapshotEnabled ? snapshotTier.name : null,
    sshCount: selectedSshKeyIds.length,
  };

  return {
    body,
    summary,
    rail,
    breakdown,
    specLine,
    dialogs,
    total,
    canCheckout,
    applyPreset,
    preview,
    tierId,
  };
}

type Draft = ReturnType<typeof useVpsDraft>;

/* Shared furniture -------------------------------------------------- *
 * One indicator, one badge, one checkout button across all five, so
 * the tabs differ by structure rather than by trim.
 * ------------------------------------------------------------------ */

type IndicatorState = "idle" | "active" | "done";

function StepDot({
  index,
  state,
  size = "md",
}: {
  index: number;
  state: IndicatorState;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-[12px]";
  const look =
    state === "active"
      ? "border-transparent bg-[#1C75BC] text-white shadow-sm shadow-[#1C75BC]/30"
      : state === "done"
      ? "border-transparent bg-emerald-500 text-white"
      : "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500";
  return (
    <span
      className={
        "flex shrink-0 items-center justify-center rounded-full border font-semibold motion-safe:transition-colors " +
        dim +
        " " +
        look
      }
    >
      {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
    </span>
  );
}

function StepBadge({ step, canCheckout }: { step: Step; canCheckout: boolean }) {
  if (step !== REQUIRED_STEP) return null;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
        (canCheckout
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400")
      }
    >
      {canCheckout && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      {canCheckout ? "Completed" : "Required"}
    </span>
  );
}

function CheckoutButton({ draft, className = "" }: { draft: Draft; className?: string }) {
  return (
    <Button
      variant="brand"
      disabled={!draft.canCheckout}
      className={"h-11 text-sm font-semibold " + className}
    >
      {draft.canCheckout
        ? `Checkout · ${draft.total.toLocaleString()} KHR/mo`
        : "Name your server to check out"}
    </Button>
  );
}

/* The rail, with a consistent sticky treatment in the layouts that
   have a right column. */
function SummaryRail({ draft }: { draft: Draft }) {
  return (
    <div className="min-w-0 space-y-4 lg:sticky lg:top-0">
      {draft.rail}
      <CheckoutButton draft={draft} className="w-full" />
    </div>
  );
}

/* The running total as one charge per line — compact enough to live
   in a strip at the bottom of a layout that has no summary column. */
function BreakdownPanel({ draft, className = "" }: { draft: Draft; className?: string }) {
  return (
    <div
      className={
        "overflow-hidden border-zinc-200 bg-white shadow-lg shadow-zinc-900/5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 dark:border-zinc-800 dark:bg-zinc-950 " +
        className
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5 dark:border-zinc-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          What you&apos;re paying for
        </p>
        <p className="truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">{draft.specLine}</p>
      </div>
      <ul className="divide-y divide-zinc-50 px-5 dark:divide-zinc-900">
        {draft.breakdown.map((row, idx) => {
          const RowIcon = stepIcon(row.step);
          return (
            <li key={`${row.label}-${idx}`} className="flex items-center gap-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <RowIcon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {row.label}
                </span>
                <span className="block truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {row.detail}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {row.price.toLocaleString()} KHR
              </span>
            </li>
          );
        })}
      </ul>
      <p className="px-5 pb-3 text-[11.5px] text-zinc-400 dark:text-zinc-500">
        Billed monthly. Cancel or resize any time.
      </p>
    </div>
  );
}

/* The expandable total + actions bar, pinned to the bottom. Shared by
   the two layouts that trade the summary column for page width. */
function StickyTotalBar({ draft, children }: { draft: Draft; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky bottom-0 mt-4">
      {open && <BreakdownPanel draft={draft} className="max-h-[55vh] overflow-y-auto rounded-t-2xl border border-b-0" />}
      <div
        className={
          "flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-white px-5 py-3.5 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 " +
          (open ? "rounded-b-2xl" : "rounded-2xl")
        }
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="-m-1 flex items-center gap-2 rounded-lg p-1 text-left motion-safe:transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <span>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Running total
            </span>
            <span className="block text-xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
              {draft.total.toLocaleString()} KHR
              <span className="text-[13px] font-medium text-zinc-500">/mo</span>
            </span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11.5px] font-semibold text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]">
            {open
              ? "Hide"
              : `${draft.breakdown.length} ${draft.breakdown.length === 1 ? "item" : "items"}`}
            <ChevronDown
              className={"h-3.5 w-3.5 motion-safe:transition-transform " + (open ? "rotate-180" : "")}
            />
          </span>
        </button>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

/* A — Accordion ----------------------------------------------------- */

function SampleAccordion({ draft }: { draft: Draft }) {
  const [open, setOpen] = useState<Step[]>([VPS_WIZARD_STEPS[0].step]);
  const lastOpen = [...VPS_WIZARD_STEPS].reverse().find((s) => open.includes(s.step))?.step;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-3 lg:col-span-2">
        {VPS_WIZARD_STEPS.map((s, i) => {
          const expanded = open.includes(s.step);
          const next = VPS_WIZARD_STEPS[i + 1];
          const Icon = stepIcon(s.step);
          return (
            <div
              key={s.step}
              className={
                "overflow-hidden rounded-2xl border motion-safe:transition-all " +
                (expanded
                  ? "border-[#1C75BC]/40 shadow-sm dark:border-[#6FA8D8]/30"
                  : "border-zinc-200 dark:border-zinc-800")
              }
            >
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() =>
                  setOpen((prev) =>
                    prev.includes(s.step) ? prev.filter((x) => x !== s.step) : [...prev, s.step]
                  )
                }
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left motion-safe:transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <StepDot index={i} state={expanded ? "active" : "idle"} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Icon
                      className={
                        "h-3.5 w-3.5 shrink-0 " +
                        (expanded ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")
                      }
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {s.label}
                    </span>
                    <StepBadge step={s.step} canCheckout={draft.canCheckout} />
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                    {(expanded ? STEP_META[s.step]?.hint : draft.summary(s.step)) ??
                      STEP_META[s.step]?.hint}
                  </span>
                </span>
                <ChevronDown
                  className={
                    "h-4 w-4 shrink-0 text-zinc-400 motion-safe:transition-transform " +
                    (expanded ? "rotate-180 text-[#1C75BC] dark:text-[#6FA8D8]" : "")
                  }
                />
              </button>
              {expanded && (
                <div className="border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
                  {draft.body(s.step)}
                  {next && s.step === lastOpen && (
                    <div className="mt-5 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                        Next: {next.label}
                      </span>
                      <Button
                        variant="brand"
                        onClick={() =>
                          setOpen((prev) => [
                            ...prev.filter((x) => x !== s.step && x !== next.step),
                            next.step,
                          ])
                        }
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
        })}
      </div>
      <SummaryRail draft={draft} />
      {draft.dialogs}
    </div>
  );
}

/* C — Stacked sections (Accordion + the old Single page, merged) ---- *
 * They were the same idea twice: a vertical stack of the six steps.
 * One kept everything open with a jump list, the other collapsed what
 * you weren't using. Merged, you get both — sections start open, each
 * one folds away, and the rail tracks where you are either way.
 * ------------------------------------------------------------------ */

function SampleStacked({ draft }: { draft: Draft }) {
  const [closed, setClosed] = useState<Step[]>([]);
  const [active, setActive] = useState<string>(VPS_WIZARD_STEPS[0].step);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const allClosed = closed.length === VPS_WIZARD_STEPS.length;

  // The app scrolls inside <main>, not the window, so the spy listens
  // there and picks the last heading that has passed the top.
  useEffect(() => {
    const scroller = scrollRef.current?.closest("main");
    if (!scroller) return;
    function onScroll() {
      const top = scroller!.getBoundingClientRect().top + 140;
      let current = VPS_WIZARD_STEPS[0].step;
      for (const s of VPS_WIZARD_STEPS) {
        const el = document.getElementById(`sample-c-${s.step}`);
        if (el && el.getBoundingClientRect().top <= top) current = s.step;
      }
      setActive(current);
    }
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[168px_minmax(0,1fr)_320px]"
    >
      <nav className="hidden lg:sticky lg:top-0 lg:block">
        <div className="flex items-center justify-between gap-1 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Steps</p>
          <button
            type="button"
            onClick={() => setClosed(allClosed ? [] : VPS_WIZARD_STEPS.map((s) => s.step))}
            className="text-[11px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
          >
            {allClosed ? "Expand" : "Collapse"}
          </button>
        </div>
        <ul className="mt-2">
          {VPS_WIZARD_STEPS.map((s, i) => {
            const on = active === s.step;
            return (
              <li key={s.step}>
                <a
                  href={`#sample-c-${s.step}`}
                  title={draft.summary(s.step) ?? s.label}
                  onClick={() => setClosed((prev) => prev.filter((x) => x !== s.step))}
                  className={
                    "flex items-center gap-2 rounded-md border-l-2 py-1.5 pl-2 pr-1 text-[12.5px] motion-safe:transition-colors " +
                    (on
                      ? "border-[#1C75BC] bg-[#EFF6FF] font-semibold text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]"
                      : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900")
                  }
                >
                  <span
                    className={
                      "w-3.5 shrink-0 text-center text-[11px] font-semibold " +
                      (on ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 truncate">{s.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-3">
        {VPS_WIZARD_STEPS.map((s, i) => {
          const open = !closed.includes(s.step);
          const Icon = stepIcon(s.step);
          return (
            <div
              key={s.step}
              id={`sample-c-${s.step}`}
              className={
                "scroll-mt-4 overflow-hidden rounded-2xl border motion-safe:transition-colors " +
                (active === s.step && open
                  ? "border-[#1C75BC]/40 dark:border-[#6FA8D8]/30"
                  : "border-zinc-200 dark:border-zinc-800")
              }
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setClosed((prev) =>
                    prev.includes(s.step) ? prev.filter((x) => x !== s.step) : [...prev, s.step]
                  )
                }
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left motion-safe:transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <StepDot index={i} state={open ? "active" : "idle"} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Icon
                      className={
                        "h-3.5 w-3.5 shrink-0 " +
                        (open ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")
                      }
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {s.label}
                    </span>
                    <StepBadge step={s.step} canCheckout={draft.canCheckout} />
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                    {draft.summary(s.step) ?? STEP_META[s.step]?.hint}
                  </span>
                </span>
                <ChevronDown
                  className={
                    "h-4 w-4 shrink-0 text-zinc-400 motion-safe:transition-transform " +
                    (open ? "rotate-180 text-[#1C75BC] dark:text-[#6FA8D8]" : "")
                  }
                />
              </button>
              {open && (
                <div className="border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
                  {draft.body(s.step)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SummaryRail draft={draft} />
      {draft.dialogs}
    </div>
  );
}

/* B — One step at a time -------------------------------------------- */

function SampleStepper({ draft }: { draft: Draft }) {
  const [i, setI] = useState(0);
  const last = i === VPS_WIZARD_STEPS.length - 1;
  const current = VPS_WIZARD_STEPS[i];
  const Icon = stepIcon(current.step);
  const prev = VPS_WIZARD_STEPS[i - 1];
  const next = VPS_WIZARD_STEPS[i + 1];

  return (
    <div className="mx-auto max-w-[840px]">
      {/* Rail: one dot per step over a track that fills as you go, so
          progress is readable without counting. */}
      <div className="rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
            Step {i + 1} of {VPS_WIZARD_STEPS.length}
          </p>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
            {VPS_WIZARD_STEPS.length - i - 1} left
          </p>
        </div>
        {/* Dots sit ON the track rather than under a separate bar, so
            the line between two steps is the thing that fills in — the
            connector is the progress, not a decoration next to it. */}
        <ol className="mt-4 flex items-start">
          {VPS_WIZARD_STEPS.map((s, idx) => {
            const state = idx === i ? "active" : idx < i ? "done" : "idle";
            const value = draft.summary(s.step);
            return (
              <li key={s.step} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* Half-connectors on each side keep every dot
                      centred over its own label, however wide. */}
                  <span
                    className={
                      "h-0.5 flex-1 rounded-full " +
                      (idx === 0
                        ? "bg-transparent"
                        : idx <= i
                        ? "bg-[#1C75BC]"
                        : "bg-zinc-200 dark:bg-zinc-800")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setI(idx)}
                    aria-current={idx === i ? "step" : undefined}
                    aria-label={`${s.label}${value ? ` — ${value}` : ""}`}
                    className="mx-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40"
                  >
                    <StepDot index={idx} state={state} size="sm" />
                  </button>
                  <span
                    className={
                      "h-0.5 flex-1 rounded-full " +
                      (idx === VPS_WIZARD_STEPS.length - 1
                        ? "bg-transparent"
                        : idx < i
                        ? "bg-[#1C75BC]"
                        : "bg-zinc-200 dark:bg-zinc-800")
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setI(idx)}
                  className="mt-1.5 min-w-0 max-w-full px-1 text-center"
                >
                  <span
                    className={
                      "block truncate text-[11px] " +
                      (idx === i
                        ? "font-semibold text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 dark:text-zinc-400")
                    }
                  >
                    {s.label}
                  </span>
                  {/* What you picked, on the step you've already done —
                      the reason to look back at the rail at all. */}
                  <span className="mt-0.5 block truncate text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    {idx < i ? value ?? "" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <Card className="mt-4 rounded-2xl">
        <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-zinc-800">
            <Icon className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {current.label}
              </h3>
              <StepBadge step={current.step} canCheckout={draft.canCheckout} />
            </div>
            <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
              {STEP_META[current.step]?.hint}
            </p>
          </div>
        </div>
        <div className="mt-4">{draft.body(current.step)}</div>
      </Card>

      {/* The total follows you down the page instead of living in a
          column this layout doesn't have — and opens into the full
          breakdown, so "why is it that much?" is answerable without
          leaving the step you're on. Buttons name where they go: on a
          one-at-a-time flow the only question at the bottom of the
          screen is "what's next?", and "Next" alone doesn't answer it. */}
      <StickyTotalBar draft={draft}>
        <Button
          variant="outline"
          disabled={i === 0}
          onClick={() => setI((n) => n - 1)}
          className="h-11 text-sm"
        >
          {prev ? `Back · ${prev.label}` : "Back"}
        </Button>
        {last ? (
          <CheckoutButton draft={draft} />
        ) : (
          <Button
            variant="brand"
            onClick={() => setI((n) => n + 1)}
            className="h-11 px-6 text-sm font-semibold"
          >
            Next · {next.label}
          </Button>
        )}
      </StickyTotalBar>
      {draft.dialogs}
    </div>
  );
}

/* D — Two pane ------------------------------------------------------- */

function SampleTwoPane({ draft }: { draft: Draft }) {
  const [step, setStep] = useState<Step>(VPS_WIZARD_STEPS[0].step);
  const index = VPS_WIZARD_STEPS.findIndex((s) => s.step === step);
  const current = VPS_WIZARD_STEPS[index];
  const Icon = stepIcon(current.step);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-[248px_1fr]">
            {/* A vertical stepper, not a menu: one continuous line
                threads the dots, and the segment behind the step
                you're on is drawn in brand blue. The line is what
                tells you these are ordered and where you are in that
                order — without it the column reads as six unrelated
                links. */}
            <ul className="relative border-b border-zinc-200 bg-zinc-50/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/40 sm:border-b-0 sm:border-r">
              {VPS_WIZARD_STEPS.map((s, i) => {
                const active = s.step === step;
                const behind = i < index;
                const StepIcon = stepIcon(s.step);
                return (
                  <li key={s.step} className="relative">
                    {/* Connector to the next row, sitting under the
                        dot's centre (12px in from the row padding). */}
                    {i < VPS_WIZARD_STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className={
                          "absolute left-[24px] top-[30px] bottom-[-6px] w-0.5 rounded-full motion-safe:transition-colors " +
                          (behind ? "bg-[#1C75BC]" : "bg-zinc-200 dark:bg-zinc-700")
                        }
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(s.step)}
                      aria-current={active ? "step" : undefined}
                      className={
                        "relative flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left motion-safe:transition-colors " +
                        (active
                          ? "bg-white shadow-sm dark:bg-zinc-800"
                          : "hover:bg-white/70 dark:hover:bg-zinc-900")
                      }
                    >
                      <StepDot
                        index={i}
                        state={active ? "active" : behind ? "done" : "idle"}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <StepIcon
                            className={
                              "h-3 w-3 shrink-0 " +
                              (active ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")
                            }
                          />
                          <span
                            className={
                              "truncate text-[13px] font-semibold " +
                              (active
                                ? "text-[#1C75BC] dark:text-[#6FA8D8]"
                                : "text-zinc-900 dark:text-zinc-100")
                            }
                          >
                            {s.label}
                          </span>
                        </span>
                        {/* The badge sits on the value line here — the
                            left column is narrow, and next to the
                            label it would truncate the label itself. */}
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span className="min-w-0 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                            {draft.summary(s.step) ?? STEP_META[s.step]?.hint}
                          </span>
                          <StepBadge step={s.step} canCheckout={draft.canCheckout} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="min-w-0">
              <div className="flex items-start gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
                  <Icon className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {current.label}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                    Step {index + 1} of {VPS_WIZARD_STEPS.length} · {STEP_META[current.step]?.hint}
                  </p>
                </div>
              </div>
              <div className="px-5 py-4">{draft.body(current.step)}</div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <Button
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => setStep(VPS_WIZARD_STEPS[index - 1].step)}
                  className="h-9 text-sm"
                >
                  Back
                </Button>
                <Button
                  variant="brand"
                  disabled={index === VPS_WIZARD_STEPS.length - 1}
                  onClick={() => setStep(VPS_WIZARD_STEPS[index + 1].step)}
                  className="h-9 px-5 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SummaryRail draft={draft} />
      {draft.dialogs}
    </div>
  );
}


/* E — Guided, with a review before checkout -------------------------- *
 * The one-at-a-time flow's weakness is that you can't see the whole
 * server at once. This answers it with a seventh screen: every choice
 * listed, each with an Edit that drops you back on exactly that step.
 * Nothing is bought until you've seen that page.
 * ------------------------------------------------------------------ */

const REVIEW_INDEX = VPS_WIZARD_STEPS.length;

function SampleGuidedReview({ draft }: { draft: Draft }) {
  const [i, setI] = useState(0);
  const onReview = i === REVIEW_INDEX;
  const current = VPS_WIZARD_STEPS[i];
  const Icon = current ? stepIcon(current.step) : Check;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
      {/* Vertical rail: the whole route, including the stop at the end. */}
      <nav className="lg:sticky lg:top-0">
        <ol className="relative">
          {[...VPS_WIZARD_STEPS, { step: "review" as Step, label: "Review & confirm" }].map(
            (s, idx) => {
              const active = idx === i;
              const behind = idx < i;
              const RowIcon = idx === REVIEW_INDEX ? Check : stepIcon(s.step);
              return (
                <li key={s.label} className="relative">
                  {idx < REVIEW_INDEX && (
                    <span
                      aria-hidden
                      className={
                        "absolute left-[22px] top-[30px] bottom-[-6px] w-0.5 rounded-full motion-safe:transition-colors " +
                        (behind ? "bg-[#1C75BC]" : "bg-zinc-200 dark:bg-zinc-700")
                      }
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setI(idx)}
                    aria-current={active ? "step" : undefined}
                    className={
                      "relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left motion-safe:transition-colors " +
                      (active
                        ? "bg-[#EFF6FF] dark:bg-zinc-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900")
                    }
                  >
                    <StepDot index={idx} state={active ? "active" : behind ? "done" : "idle"} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <RowIcon
                          className={
                            "h-3 w-3 shrink-0 " +
                            (active ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-zinc-400")
                          }
                        />
                        <span
                          className={
                            "truncate text-[13px] font-semibold " +
                            (active
                              ? "text-[#1C75BC] dark:text-[#6FA8D8]"
                              : "text-zinc-900 dark:text-zinc-100")
                          }
                        >
                          {s.label}
                        </span>
                      </span>
                      {idx < REVIEW_INDEX && (
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span className="min-w-0 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                            {draft.summary(s.step) ?? STEP_META[s.step]?.hint}
                          </span>
                          <StepBadge step={s.step} canCheckout={draft.canCheckout} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            }
          )}
        </ol>
      </nav>

      <div className="min-w-0">
        <Card className="rounded-2xl">
          <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-zinc-800">
              <Icon className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {onReview ? "Review & confirm" : current.label}
                </h3>
                {!onReview && <StepBadge step={current.step} canCheckout={draft.canCheckout} />}
              </div>
              <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                {onReview
                  ? "Everything you've chosen, before anything is charged."
                  : `Step ${i + 1} of ${VPS_WIZARD_STEPS.length} · ${STEP_META[current.step]?.hint}`}
              </p>
            </div>
          </div>

          {onReview ? (
            <div className="mt-4 space-y-4">
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {VPS_WIZARD_STEPS.map((s, idx) => {
                  const RowIcon = stepIcon(s.step);
                  const missing = s.step === REQUIRED_STEP && !draft.canCheckout;
                  return (
                    <li key={s.step} className="flex items-center gap-3.5 px-4 py-3">
                      <span
                        className={
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                          (missing ? "bg-red-50 dark:bg-red-500/10" : "bg-zinc-100 dark:bg-zinc-800")
                        }
                      >
                        <RowIcon
                          className={
                            "h-4 w-4 " +
                            (missing ? "text-red-500" : "text-zinc-500 dark:text-zinc-400")
                          }
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          {s.label}
                        </p>
                        <p
                          className={
                            "mt-0.5 truncate text-[13px] font-medium " +
                            (missing ? "text-red-500" : "text-zinc-900 dark:text-zinc-100")
                          }
                        >
                          {missing ? "Not set — name your server" : draft.summary(s.step) ?? "Not set"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setI(idx)}
                        className="h-8 shrink-0 px-3 text-[12px]"
                      >
                        Edit
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <BreakdownPanel draft={draft} className="rounded-xl border" />
            </div>
          ) : (
            <div className="mt-4">{draft.body(current.step)}</div>
          )}
        </Card>

        <StickyTotalBar draft={draft}>
          <Button
            variant="outline"
            disabled={i === 0}
            onClick={() => setI((n) => n - 1)}
            className="h-11 text-sm"
          >
            Back
          </Button>
          {onReview ? (
            <CheckoutButton draft={draft} />
          ) : (
            <Button
              variant="brand"
              onClick={() => setI((n) => n + 1)}
              className="h-11 px-6 text-sm font-semibold"
            >
              {i === REVIEW_INDEX - 1 ? "Review" : `Next · ${VPS_WIZARD_STEPS[i + 1].label}`}
            </Button>
          )}
        </StickyTotalBar>
      </div>
      {draft.dialogs}
    </div>
  );
}

/* G — Recipes -------------------------------------------------------- *
 * The other five all answer "how do I show six questions?". This one
 * asks whether most people should have to answer them at all. You
 * pick what the server is FOR — a site, an API, a database, a dev box
 * — and that one choice sets the plan, the OS and snapshot
 * protection. The six steps are still there underneath, folded away,
 * showing what the recipe chose so it never feels like a black box.
 *
 * The live preview on the right is the point of the layout: you watch
 * the machine you're buying take shape instead of reading a bill.
 * ------------------------------------------------------------------ */

const RECIPES: {
  id: string;
  label: string;
  what: string;
  icon: ComponentType<{ className?: string }>;
  tierId: string;
  osFamily: string;
  osVersion: string;
  snapshot: boolean;
}[] = [
  {
    id: "web",
    label: "Website or shop",
    what: "WordPress, a storefront, a landing page.",
    icon: Globe,
    tierId: "basic",
    osFamily: "Ubuntu",
    osVersion: "24.04 LTS",
    snapshot: false,
  },
  {
    id: "api",
    label: "App backend",
    what: "An API, a bot, a job runner.",
    icon: Server,
    tierId: "standard",
    osFamily: "Ubuntu",
    osVersion: "24.04 LTS",
    snapshot: true,
  },
  {
    id: "db",
    label: "Database host",
    what: "Postgres, MySQL, Redis — with backups on.",
    icon: Cpu,
    tierId: "premium",
    osFamily: "Debian",
    osVersion: "12",
    snapshot: true,
  },
  {
    id: "dev",
    label: "Dev & testing",
    what: "A scratch box you can rebuild any time.",
    icon: KeyRound,
    tierId: "nano",
    osFamily: "Fedora",
    osVersion: "40",
    snapshot: false,
  },
];

function SampleRecipes({ draft }: { draft: Draft }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState<Step[]>([]);
  const tiers = SERVICE_PRICING.vps;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            What&apos;s this server for?
          </h3>
          <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            One pick sets the size, the OS and backups. Change any of it below.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RECIPES.map((r) => {
              const on = picked === r.id;
              const price = tiers.find((t) => t.id === r.tierId)?.priceKHR ?? 0;
              return (
                <ClickableSurface
                  key={r.id}
                  onClick={() => {
                    setPicked(r.id);
                    draft.applyPreset(r);
                  }}
                  className={
                    "rounded-xl border p-4 text-left motion-safe:transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                    (on
                      ? "border-[#1C75BC] bg-[#EFF6FF] shadow-sm dark:bg-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800")
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                        (on ? "bg-[#1C75BC]" : "bg-zinc-100 dark:bg-zinc-800")
                      }
                    >
                      <r.icon
                        className={
                          "h-5 w-5 " + (on ? "text-white" : "text-zinc-500 dark:text-zinc-400")
                        }
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-bold text-zinc-900 dark:text-zinc-50">
                          {r.label}
                        </p>
                        {on && <Check className="h-4 w-4 shrink-0 text-[#1C75BC]" strokeWidth={3} />}
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {r.what}
                      </p>
                      {/* What the recipe actually does, in the open —
                          a preset you can't inspect is a guess. */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[
                          tiers.find((t) => t.id === r.tierId)?.name ?? r.tierId,
                          `${r.osFamily} ${r.osVersion}`,
                          r.snapshot ? "Snapshots on" : "No snapshots",
                        ].map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[12px] font-semibold text-[#F26F21]">
                        from {price.toLocaleString()} KHR/mo
                      </p>
                    </div>
                  </div>
                </ClickableSurface>
              );
            })}
          </div>
        </div>

        {/* Required first, then the rest folded away: after a recipe
            the only thing actually left to do is name the server. */}
        <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Name your server</h3>
              <StepBadge step={REQUIRED_STEP} canCheckout={draft.canCheckout} />
            </div>
            <div className="mt-3">{draft.body("os")}</div>
          </div>

          <div className="px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Everything else {picked ? "— set by the recipe" : "— using defaults"}
            </p>
            <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {VPS_WIZARD_STEPS.filter((s) => s.step !== "os").map((s, i) => {
                const expanded = open.includes(s.step);
                const Icon = stepIcon(s.step);
                return (
                  <li key={s.step}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setOpen((prev) =>
                          prev.includes(s.step)
                            ? prev.filter((x) => x !== s.step)
                            : [...prev, s.step]
                        )
                      }
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.label}
                        </span>
                        <span className="block truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                          {draft.summary(s.step) ?? STEP_META[s.step]?.hint}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-medium text-[#1C75BC] dark:text-[#6FA8D8]">
                        {expanded ? "Done" : "Change"}
                      </span>
                      <ChevronDown
                        className={
                          "h-4 w-4 shrink-0 text-zinc-400 motion-safe:transition-transform " +
                          (expanded ? "rotate-180" : "")
                        }
                      />
                      <span className="sr-only">{i + 1}</span>
                    </button>
                    {expanded && <div className="pb-4">{draft.body(s.step)}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Live preview: the server, not the invoice. */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-0">
        <Card className="overflow-hidden rounded-2xl p-0">
          <div className="bg-gradient-to-br from-[#1C75BC] to-[#0d3f66] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Your server
            </p>
            <p className="mt-1 truncate font-mono text-[15px] font-semibold text-white">
              {draft.preview.hostname || "name-your-server"}
            </p>
            <p className="mt-0.5 text-[12px] text-white/70">
              {draft.preview.planName} · {draft.preview.os}
            </p>
          </div>
          <dl className="divide-y divide-zinc-100 px-5 dark:divide-zinc-800">
            {[
              ["Resources", draft.specLine],
              ["Location", draft.preview.province],
              [
                "IP address",
                `${draft.preview.ipCount} ${draft.preview.ipCount === 1 ? "address" : "addresses"}`,
              ],
              [
                "SSH keys",
                draft.preview.sshCount === 0 ? "None yet" : `${draft.preview.sshCount} authorized`,
              ],
              ["Snapshots", draft.preview.snapshot ?? "Off"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[12px] text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="min-w-0 truncate text-[12.5px] font-medium text-zinc-900 dark:text-zinc-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400">Monthly</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {draft.total.toLocaleString()} KHR
            </span>
          </div>
        </Card>
        <CheckoutButton draft={draft} className="w-full" />
      </div>
      {draft.dialogs}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SAMPLES: {
  id: string;
  tab: string;
  title: string;
  best: string;
  blurb: string;
  render: (draft: Draft) => ReactNode;
}[] = [
  {
    id: "accordion",
    tab: "A · Accordion",
    title: "Accordion",
    best: "Live today",
    blurb:
      "The flow as it ships right now. Rows open in place, several at once, and the bottom-most open row hands off to the next. Here as the baseline everything else is measured against.",
    render: (d) => <SampleAccordion draft={d} />
  },
  {
    id: "stepper",
    tab: "B · One step",
    title: "One step at a time",
    best: "Best for first-timers",
    blurb:
      "A single question per screen with a progress rail above and the total pinned below. Least to read at once; worst for going back to check something.",
    render: (d) => <SampleStepper draft={d} />
  },
  {
    id: "stacked",
    tab: "C · Stacked",
    title: "Stacked sections",
    best: "Best for scanning",
    blurb:
      "The accordion and the old Single page merged: sections start open with a jump list that follows you down the page, and any section folds away when you're done with it.",
    render: (d) => <SampleStacked draft={d} />
  },
  {
    id: "twopane",
    tab: "D · Two pane",
    title: "Two pane",
    best: "Most compact",
    blurb:
      "Settings-style: step list on the left with each one's current value, content on the right. Familiar and dense, but the panel height jumps between steps.",
    render: (d) => <SampleTwoPane draft={d} />
  },
  {
    id: "guided",
    tab: "E · Guided + review",
    title: "Guided, with a review",
    best: "Safest checkout",
    blurb:
      "One step at a time down a vertical rail, then a seventh screen that lists every choice with an Edit beside it. Fixes the one-at-a-time weakness — you see the whole server before anything is charged.",
    render: (d) => <SampleGuidedReview draft={d} />
  },
  {
    id: "recipes",
    tab: "G · Recipes",
    title: "Recipes — pick what it's for",
    best: "Fewest decisions",
    blurb:
      "The others all answer \"how do I show six questions?\". This asks whether most people should answer them at all: pick a purpose — site, API, database, dev box — and it sets the plan, OS and backups. The six steps stay underneath, folded, showing what the recipe chose. A live preview of the server replaces the invoice.",
    render: (d) => <SampleRecipes draft={d} />,
  },

];

function SamplePanel({ render }: { render: (draft: Draft) => ReactNode }) {
  // Each sample gets its own draft — hooks can't be called in a loop
  // in the parent, and separate state is what keeps one tab's poking
  // from showing up in another.
  const draft = useVpsDraft();
  return <>{render(draft)}</>;
}

export function SubscribeFlowSamplesPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1C75BC] dark:text-[#6FA8D8]">
            Design sample
          </p>
          <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Subscribe to VPS — flow samples
          </h1>
          <p className="mt-2 max-w-[760px] text-sm text-zinc-500 dark:text-zinc-400">
            Six shells around the same six steps. Every tab renders the real step components, the
            same summaries and the same running total as the live Subscribe page, so what differs
            between them is layout and nothing else. Each tab keeps its own draft.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold"
          style={{ borderColor: `${BRAND}33`, color: BRAND }}
        >
          6 options
        </span>
      </div>

      <Tabs defaultValue={SAMPLES[0].id} className="mt-6">
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl p-1.5">
          {SAMPLES.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="rounded-lg px-3.5 py-1.5 text-[13px]">
              {s.tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {SAMPLES.map((s) => (
          <TabsContent key={s.id} value={s.id} className="mt-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-r from-[#EFF6FF] to-transparent px-5 py-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-transparent">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{s.title}</h2>
                <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {s.blurb}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#1C75BC] shadow-sm dark:bg-zinc-800 dark:text-[#6FA8D8]">
                {s.best}
              </span>
            </div>
            <SamplePanel render={s.render} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
