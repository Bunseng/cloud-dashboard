import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { liveStreamPlans, type Plan } from "../../data/media";

/* ------------------------------------------------------------------ *
 * Media → Live Stream → Plans. Ported from media-cloudplus's plan-card
 * grid, using dashboard-ui's brand blue instead of the primary/gradient
 * CSS variables the reference project defines for its featured tier.
 * ------------------------------------------------------------------ */

export function PlansPage() {
  return (
    <div>
      <h1 className="sr-only">Live Stream Plans</h1>
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        {liveStreamPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border p-5 sm:p-6",
        plan.featured
          ? "order-first border-transparent bg-gradient-to-br from-[#1C75BC] to-[#35C3D9] text-white lg:order-none"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          plan.featured ? "bg-white/20" : "bg-[#EFF6FF] dark:bg-zinc-900"
        )}
        aria-hidden
      >
        <span className={cn("text-xl", !plan.featured && "text-[#1C75BC] dark:text-[#6FA8D8]")}>
          {plan.featured ? "🎯" : "◎"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className={cn("text-2xl font-bold leading-8 sm:text-3xl sm:leading-9", !plan.featured && "text-zinc-900 dark:text-zinc-50")}>
          {plan.name}
        </h2>
        {plan.badge && (
          <span className="rounded-md bg-white/70 px-2.5 py-1 text-sm text-[#0e4a78]">
            {plan.badge}
          </span>
        )}
      </div>

      <p className={cn("mt-3 max-w-[280px] text-sm leading-6 sm:text-base", plan.featured ? "text-white/90" : "text-[#1C75BC] dark:text-[#6FA8D8]")}>
        {plan.tagline}
      </p>

      <p className={cn("mt-6 text-3xl font-bold leading-tight sm:text-4xl", !plan.featured && "text-zinc-900 dark:text-zinc-50")}>
        {plan.price}
      </p>
      {plan.strikePrice && (
        <p className="mt-1 text-2xl font-bold leading-tight text-red-500 line-through sm:text-3xl">
          {plan.strikePrice}
        </p>
      )}
      <p className={cn("mt-1 text-base", plan.featured ? "text-white/70" : "text-zinc-500 dark:text-zinc-400")}>
        {plan.period}
      </p>

      <hr className={cn("my-6", plan.featured ? "border-white/40" : "border-zinc-200 dark:border-zinc-800")} />

      <ul className="flex flex-1 flex-col gap-3">
        {plan.features.map((feature, i) => (
          <li key={`${feature}-${i}`} className={cn("flex items-start gap-3 text-sm", !plan.featured && "text-zinc-700 dark:text-zinc-300")}>
            <CircleCheck
              className={cn("mt-0.5 h-4 w-4 shrink-0", plan.featured ? "text-white" : "text-[#1C75BC] dark:text-[#6FA8D8]")}
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        variant={plan.featured ? "secondary" : "outline"}
        className={cn("mt-8 w-full text-base", plan.featured && "bg-white text-[#1C75BC] hover:bg-white/90")}
      >
        Choose Plan
      </Button>
    </div>
  );
}
