import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { PLACEHOLDER_SUBSCRIPTION_COUNT } from "../data/billing";
import { formatPlanPrice, getTierTheme, type DisplayCurrency, type PricingServiceKey } from "../data/pricing";
import { BillingDashboardButton, ClickableSurface } from "./atoms";

/* One tier card, shared by the Planning page and Storage's plan-compare
   tab — pulled from SERVICE_PRICING so every price shown in the app
   traces back to the same table. "Try Now" jumps into the Subscribe
   flow (plan review → payment) for this exact tier. Hover lift + a
   staggered entrance match the hover/animation language used for cards
   everywhere else in the app (Home, Log Out) for visual consistency. */
export function PlanTierCard({
  tier,
  categoryKey,
  icon: Icon,
  isCurrent = false,
  index = 0,
  currency = "KHR",
}: {
  tier: any;
  categoryKey: PricingServiceKey;
  icon: LucideIcon;
  isCurrent?: boolean;
  index?: number;
  currency?: DisplayCurrency;
}) {
  const navigate = useNavigate();
  // Looked up by id, not the display name — "Free Plan"/"Transcoder
  // Service" etc. don't match the theme's single-word keys, but their
  // ids ("free"/"transcoder") do.
  const theme = getTierTheme(tier.id);
  const priceDisplay = formatPlanPrice(tier.priceKHR, currency);

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={
        "group flex flex-col overflow-hidden rounded-xl border bg-white motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:transition-all hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(28,117,188,0.14)] dark:bg-zinc-950 " +
        (tier.popular ? theme.ring + " ring-1 ring-inset" : "border-zinc-200 hover:border-[#1C75BC]/40 dark:border-zinc-800")
      }
    >
      <div className={"h-1.5 w-full shrink-0 motion-safe:transition-all group-hover:h-2 " + theme.badge} />
      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <div
            className={
              "flex h-9 w-9 items-center justify-center rounded-lg motion-safe:transition-transform motion-safe:duration-300 group-hover:-rotate-3 group-hover:scale-110 " +
              theme.chip
            }
          >
            <Icon className={"h-[18px] w-[18px] " + theme.icon} />
          </div>
          {tier.popular && (
            <Badge className={"border-transparent font-bold text-white hover:opacity-100 " + theme.badge}>
              Popular
            </Badge>
          )}
        </div>

        <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{tier.name}</p>
        <p className="text-[13px] leading-[1.4] text-zinc-500 dark:text-zinc-400">
          {tier.description}
        </p>

        <p>
          <span
            className={
              "text-[22px] font-bold " +
              (tier.priceKHR === 0 ? "text-zinc-900 dark:text-zinc-50" : theme.icon)
            }
          >
            {priceDisplay}
          </span>
          {tier.priceKHR !== 0 && (
            <span className="ml-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              /{tier.period}
            </span>
          )}
        </p>

        <Separator className="bg-zinc-200 dark:bg-zinc-800" />

        <ul className="flex-1 space-y-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
          {tier.specs.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                {value}
              </span>
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          disabled={isCurrent}
          onClick={() => navigate(`/subscribe/${categoryKey}/${tier.id}`)}
          className="h-9 w-full rounded-lg text-[13px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          {isCurrent ? "Current Plan" : "Try Now"}
        </Button>
      </div>
    </div>
  );
}

/* KHR/USD segmented switch — shared by Planning and the public Pricing
   page so every plan grid can flip its whole set of prices to USD
   (data/pricing's fixed KHR_PER_USD rate) without each page rolling
   its own toggle control. */
export function CurrencyToggle({
  value,
  onChange,
}: {
  value: DisplayCurrency;
  onChange: (value: DisplayCurrency) => void;
}) {
  const options: DisplayCurrency[] = ["KHR", "USD"];
  return (
    <div className="inline-flex gap-0 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={
            "rounded-md px-3.5 py-1.5 text-sm font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
            (value === c
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200")
          }
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Subscription plan — the default view for each Dashboard tab. Every
 * plan card reflects one real tier from SERVICE_PRICING (the account's
 * current tier); selecting one drills into that service's real content.
 * ------------------------------------------------------------------ */

export type PlanStat = string[];

export const PLAN_STATS: PlanStat[] = [
  ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
  ["Renews On", "Aug 2, 2026"],
  ["Pricing", "FREE"],
  ["CPU", "0.5 CORE"],
  ["RAM", "512 MB"],
  ["Transfer", "1024 GB"],
];

export function ServicePlanCard({
  title = "Plan",
  resourceLabel,
  onSelect,
  onUpgrade,
  stats = PLAN_STATS,
  showFooter = true,
  footerLabel,
  planName = "Free",
}: {
  title?: string;
  resourceLabel?: string;
  onSelect?: () => void;
  onUpgrade?: () => void;
  stats?: PlanStat[];
  showFooter?: boolean;
  footerLabel?: ReactNode;
  planName?: string;
}) {
  const clickable = Boolean(onSelect);
  const theme = getTierTheme(planName);

  return (
    <ClickableSurface
      onClick={onSelect}
      className={
        "rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 " +
        (clickable
          ? "cursor-pointer motion-safe:transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40"
          : "")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{title}</p>
          <Badge className={"border-transparent font-bold text-white hover:opacity-100 " + theme.badge}>
            {planName.toUpperCase()}
          </Badge>
        </div>
        <Button
          variant="brand"
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade?.();
          }}
          className="h-auto shrink-0 rounded-md px-3 py-1.5 text-xs"
        >
          Upgrade Plan
        </Button>
      </div>

      <dl className="mt-4 space-y-2 text-[13px]">
        {stats.map(([label, value, valueClassName]) => (
          <div key={label} className="flex items-center justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd
              className={
                "font-medium " +
                (valueClassName || "text-zinc-900 dark:text-zinc-100")
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {showFooter && (
        <>
          <Separator className="my-4 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[13px] font-medium text-[#1C75BC] dark:text-[#6FA8D8]">
            {footerLabel || `View ${resourceLabel} List`}
          </span>
        </>
      )}
    </ClickableSurface>
  );
}

/* A real billing page shows *your* status once and lets you compare
   plans once — not the same "Plan" card copy-pasted three times. */
export function CurrentPlanSummary({
  resourceLabel,
  onViewResourceList,
}: {
  resourceLabel?: string;
  onViewResourceList?: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
            <Sparkles className="h-5 w-5 text-[#1C75BC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                You're on the Free plan
              </p>
              <Badge className="border-transparent bg-[#1C75BC] text-white hover:bg-[#1C75BC]">
                FREE
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Renews on Aug 2, 2026
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BillingDashboardButton />
          {onViewResourceList && (
            <Button
              variant="outline"
              onClick={onViewResourceList}
              className="h-9 shrink-0 gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              View {resourceLabel} List
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-4 bg-zinc-200 dark:bg-zinc-800" />

      <dl className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Storage Size</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-100">1 GB</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Transfer</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-100">100 GB</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Buckets</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-100">1</dd>
        </div>
      </dl>
    </Card>
  );
}

/* Storage is the only single-subscription service (Run App/Database let
   you carry several) — its Dashboard tab is just what you're already
   subscribed to, not a full tier comparison (that's what Planning is
   for; browsing every tier here would just duplicate it). */
export function SubscriptionPlanView({
  resourceLabel,
  onSelectPlan,
}: {
  resourceLabel?: string;
  onSelectPlan?: () => void;
}) {
  return <CurrentPlanSummary resourceLabel={resourceLabel} onViewResourceList={onSelectPlan} />;
}

export function MultiSubscriptionView({
  resourceLabel,
  onSelectSubscription,
  onNewSubscription,
  description,
  footerLabel,
  planName = "Free",
  stats,
}: {
  resourceLabel: string;
  onSelectSubscription?: (index: number) => void;
  onNewSubscription?: () => void;
  description?: ReactNode;
  footerLabel?: ReactNode;
  planName?: string;
  stats?: PlanStat[];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Your Subscriptions
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {description ||
              `${PLACEHOLDER_SUBSCRIPTION_COUNT} active — each ${
                // Acronyms (VPS) stay as-is; ordinary words get lowercased.
                resourceLabel && resourceLabel === resourceLabel.toUpperCase()
                  ? resourceLabel
                  : resourceLabel.toLowerCase()
              } can carry its own plan.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BillingDashboardButton />
          <Button
            variant="brand"
            onClick={onNewSubscription}
            className="h-9 shrink-0 px-4 text-sm"
          >
            New Subscription
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        {Array.from({ length: PLACEHOLDER_SUBSCRIPTION_COUNT }, (_, i) => (
          <ServicePlanCard
            key={i}
            title={`Subscription ${i + 1}`}
            resourceLabel={resourceLabel}
            footerLabel={footerLabel}
            planName={planName}
            stats={stats}
            onSelect={
              onSelectSubscription
                ? () => onSelectSubscription(i + 1)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
