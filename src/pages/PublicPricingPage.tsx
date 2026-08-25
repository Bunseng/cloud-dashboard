import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../components/atoms";
import { CurrencyToggle, PlanTierCard } from "../components/PlanCards";
import { PublicFooter, PublicHeader } from "../components/PublicShell";
import {
  PRICING_CATEGORIES,
  SERVICE_PRICING,
  type DisplayCurrency,
  type PricingServiceKey,
} from "../data/pricing";

/* ------------------------------------------------------------------ *
 * Public Pricing — reached from the Log Out landing page's "View
 * Plans"/"Pricing" links without signing in first, same as any real
 * product's public pricing page. Same category tabs + tier grid as
 * the in-dashboard Planning page (same data, same PlanTierCard), just
 * wrapped in PublicShell's top bar/footer instead of the dashboard
 * Layout — so it reads as one more page of the marketing site, not a
 * sneak peek into the dashboard itself.
 * ------------------------------------------------------------------ */

export function PublicPricingPage({
  dark,
  onToggleTheme,
  onLogIn,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onLogIn: () => void;
}) {
  const [categoryKey, setCategoryKey] = useState<PricingServiceKey>(PRICING_CATEGORIES[0].key);
  const [currency, setCurrency] = useState<DisplayCurrency>("KHR");
  const category = PRICING_CATEGORIES.find((c) => c.key === categoryKey)!;
  const tiers = SERVICE_PRICING[categoryKey];
  const isSingleTier = tiers.length === 1;

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-white dark:bg-zinc-950">
      <PublicHeader dark={dark} onToggleTheme={onToggleTheme} onLogIn={onLogIn} />

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]">
            <Sparkles className="h-3.5 w-3.5" />
            Pricing
          </span>
          <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Try our plan with GOOD PRICE
          </h1>
          <p className="mx-auto mt-[10px] max-w-[560px] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Choose the plan that fits your workload. Every tier scales with you —
            upgrade, downgrade, or cancel at any time.
          </p>
        </div>

        <Tabs
          value={categoryKey}
          onValueChange={(v) => setCategoryKey(v as PricingServiceKey)}
          className="mt-7 flex flex-col items-center"
        >
          <TabsList className={PILL_TABS_LIST_CLASS + " h-auto flex-wrap justify-center gap-1"}>
            {PRICING_CATEGORIES.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className={PILL_TAB_TRIGGER_CLASS + " gap-1.5"}>
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{category.label}</h2>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>

        <div
          key={categoryKey}
          className={
            "mt-6 grid gap-5 " +
            (isSingleTier
              ? "mx-auto max-w-sm grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
          }
        >
          {tiers.map((tier, i) => (
            <PlanTierCard
              key={tier.id}
              tier={tier}
              categoryKey={categoryKey}
              icon={category.icon}
              index={i}
              currency={currency}
            />
          ))}
        </div>

        <PublicFooter />
      </main>
    </div>
  );
}
