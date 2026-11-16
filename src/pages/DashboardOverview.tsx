import type { CSSProperties, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Button } from "@/components/ui/button";

import { AccountStats, useAccountSummary } from "../components/AccountStats";
import { ClickableSurface } from "../components/atoms";
import { INVOICE_RECORDS, type BillingRecord } from "../data/billing";
import { FEATURES, type Feature } from "../data/nav";
import { useFirstUser } from "../firstusersrc/FirstUserContext";

/* ------------------------------------------------------------------ *
 * Dashboard overview — the "what's going on across my whole account"
 * landing page, sitting in front of the per-service tabs at
 * /dashboard/:tab.
 *
 * The attention banner and panel are driven entirely by the data: a
 * healthy account never renders them, so the page doesn't invent an
 * alarm where there is nothing wrong. A scheduled cancellation is a
 * heads-up, not a failure, so it reads amber and never turns the hero
 * red.
 * ------------------------------------------------------------------ */

function stagger(index: number): CSSProperties {
  return { animationDelay: `${index * 70}ms` };
}

const CARD_CLASS =
  "rounded-xl border border-[#e5e7eb] bg-white p-5 dark:border-zinc-800 dark:bg-transparent";

function DashboardHero({
  activeSubscriptions,
  attentionCount,
  problemCount,
  nextChargeOn,
}: {
  activeSubscriptions: number;
  attentionCount: number;
  problemCount: number;
  nextChargeOn?: string;
}) {
  const headline =
    problemCount > 0
      ? "Some of your services need attention"
      : attentionCount > 0
      ? "Your services are running"
      : "Everything's running smoothly";

  // Only a real problem earns the amber pill; a scheduled change gets a
  // quieter one, and a clean account gets none at all.
  const pill =
    problemCount > 0
      ? { text: `${problemCount} thing${problemCount > 1 ? "s" : ""} needs a look`, tone: "alarm" }
      : attentionCount > 0
      ? { text: `${attentionCount} scheduled change${attentionCount > 1 ? "s" : ""}`, tone: "calm" }
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C75BC] via-[#155f96] to-[#0d3f66] p-7 shadow-lg shadow-[#1C75BC]/20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full bg-[#35C3D9]/30 blur-3xl motion-safe:animate-float"
      />
      <div className="relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-3 motion-safe:duration-500">
        {pill && (
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
              (pill.tone === "alarm" ? "bg-[#FBBF24] text-[#422006]" : "bg-white/15 text-white")
            }
          >
            {pill.tone === "alarm" && <TriangleAlert className="h-3.5 w-3.5" />}
            {pill.text}
          </span>
        )}
        <h2
          className={
            "text-[26px] font-bold leading-[32px] tracking-[-0.5px] text-white " + (pill ? "mt-3" : "")
          }
        >
          {headline}
        </h2>
        <p className="mt-1.5 text-sm text-white/75">
          {activeSubscriptions} active subscription{activeSubscriptions === 1 ? "" : "s"}
          {nextChargeOn ? ` · next charge ${nextChargeOn}` : ""}
        </p>
      </div>
    </div>
  );
}

function AttentionPanel({
  items,
  onResolve,
}: {
  items: BillingRecord[];
  onResolve: (record: BillingRecord) => void;
}) {
  return (
    <div className={CARD_CLASS + " mt-5"}>
      <p className="text-[15px] font-bold text-[#17171c] dark:text-zinc-50">Needs your attention</p>
      {/* Three to a row — a single notice sits in its own column rather
          than stretching the full width of the card. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => {
          const broken = r.status.tone === "red";
          return (
            <div
              key={r.id}
              className={
                "flex items-start justify-between gap-3 rounded-lg px-4 py-3 " +
                (broken
                  ? "bg-red-50 dark:bg-red-950/30"
                  : "bg-amber-50 dark:bg-amber-950/25")
              }
            >
              <div className="min-w-0">
                <p
                  className={
                    "flex items-center gap-2 text-sm font-bold " +
                    (broken ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400")
                  }
                >
                  <span
                    className={
                      "h-2 w-2 shrink-0 rounded-full " + (broken ? "bg-red-500" : "bg-amber-500")
                    }
                  />
                  {r.status.label}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#71717a] dark:text-zinc-400">
                  {broken
                    ? `${r.name} · ${r.plan} is paused until it's paid.`
                    : `${r.name} · ${r.plan} ends on ${r.renewsOn} and won't renew.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onResolve(r)}
                className="shrink-0 text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
              >
                {broken ? "Top Up" : "Review"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceRow({
  feature,
  count,
  records,
  index,
  onOpen,
}: {
  feature: Feature;
  count: number;
  records: BillingRecord[];
  index: number;
  onOpen: () => void;
}) {
  const Icon = feature.icon;
  const suspended = records.filter((r) => r.status.tone === "red").length;
  const scheduled = records.filter((r) => r.status.tone === "amber").length;
  // The chips have to add up to `count`, so "active" is what's left
  // once the flagged ones are taken out.
  const active = count - suspended - scheduled;

  return (
    <ClickableSurface
      onClick={onOpen}
      style={stagger(index)}
      className="group cursor-pointer rounded-xl border border-[#e5e7eb] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:transition-all hover:-translate-y-0.5 hover:border-[#1C75BC]/40 hover:shadow-[0_6px_18px_rgba(28,117,188,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-800"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
          <Icon className="h-[18px] w-[18px] text-[#1C75BC] dark:text-[#6FA8D8]" animateOnHover animateOnTap />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#17171c] dark:text-zinc-50">
            {feature.navLabel}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#71717a] dark:text-zinc-400">
            {count === 0
              ? "No subscriptions yet"
              : `${count} subscription${count === 1 ? "" : "s"}`}
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-[#a1a1aa] motion-safe:transition-transform group-hover:translate-x-0.5"
          animateOnHover
        />
      </div>

      {count > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active > 0 && <StatusChip tone="green" label={`${active} active`} />}
          {suspended > 0 && <StatusChip tone="red" label={`${suspended} suspended`} />}
          {scheduled > 0 && <StatusChip tone="amber" label={`${scheduled} ending`} />}
        </div>
      )}
    </ClickableSurface>
  );
}

function StatusChip({ tone, label }: { tone: "green" | "red" | "amber"; label: string }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  } as const;
  const dots = { green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500" } as const;
  return (
    <span className={"flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium " + tones[tone]}>
      <span className={"h-1.5 w-1.5 rounded-full " + dots[tone]} />
      {label}
    </span>
  );
}

function RailCard({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
}) {
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#17171c] dark:text-zinc-50">{title}</p>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
        >
          All
        </button>
      </div>
      {children}
    </div>
  );
}

function money(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

export function DashboardOverview({
  onOpenService,
  onOpenBilling,
  onOpenTopUp,
  onSubscribe,
}: {
  onOpenService: (featureId: string) => void;
  onOpenBilling: (tab?: string) => void;
  onOpenTopUp: () => void;
  onSubscribe: () => void;
}) {
  const { isFirstUser } = useFirstUser();
  const summary = useAccountSummary();

  const upcoming = summary.records
    .filter((r) => r.status.label === "Active" && r.amount > 0)
    .sort((a, b) => Date.parse(a.renewsOn) - Date.parse(b.renewsOn));
  const nextCharge = upcoming.filter((r) => r.renewsOn === summary.nextChargeOn);
  const nextTotalKHR = nextCharge.filter((r) => r.currency === "KHR").reduce((s, r) => s + r.amount, 0);
  const nextTotalBG = nextCharge.filter((r) => r.currency === "BG").reduce((s, r) => s + r.amount, 0);
  const recentBills = isFirstUser ? [] : INVOICE_RECORDS.slice(0, 5);

  if (isFirstUser) {
    return (
      <>
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <div className="mt-6">
          <DashboardHero activeSubscriptions={0} attentionCount={0} problemCount={0} />
        </div>
        <div className={CARD_CLASS + " mt-5 text-center"}>
          <p className="text-[15px] font-bold text-[#17171c] dark:text-zinc-50">
            Nothing running yet
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#71717a] dark:text-zinc-400">
            Subscribe to your first plan and this page will fill up with what you&apos;re running,
            what&apos;s renewing, and what you&apos;ve paid.
          </p>
          <Button variant="brand" onClick={onSubscribe} className="mt-4 h-9 px-5 text-sm">
            Subscribe Plan
            <ArrowRight className="h-3.5 w-3.5" animateOnHover />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>

      <div className="mt-6">
        <DashboardHero
          activeSubscriptions={summary.activeSubscriptions}
          attentionCount={summary.attention.length}
          problemCount={summary.problems.length}
          nextChargeOn={summary.nextChargeOn}
        />
      </div>

      {/* Rendered only when something is actually off — a clean account
          never sees an alert row. */}
      {summary.attention.length > 0 && (
        <AttentionPanel
          items={summary.attention}
          onResolve={(r) => (r.status.tone === "red" ? onOpenTopUp() : onOpenService(r.category))}
        />
      )}

      <AccountStats className="mt-5" />

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-[15px] font-bold text-[#1b1b1d] dark:text-zinc-50">Your services</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <ServiceRow
                key={f.id}
                feature={f}
                count={summary.countFor(f.id)}
                records={summary.records.filter((r) => r.category === f.id)}
                index={i}
                onOpen={() => onOpenService(f.id)}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <RailCard title="Renewing soon" onSeeAll={() => onOpenBilling("subscription")}>
            {nextCharge.length > 0 ? (
              <>
                <div className="mt-3 rounded-lg bg-[#EFF6FF] p-3 dark:bg-zinc-800/60">
                  <p className="text-[12px] text-[#71717a] dark:text-zinc-400">
                    Next charge · {summary.nextChargeOn}
                  </p>
                  <p className="mt-0.5 text-[17px] font-bold text-[#17171c] dark:text-zinc-50">
                    {money(nextTotalKHR, "KHR")}
                    {nextTotalBG > 0 && (
                      <span className="ml-1.5 text-[13px] font-medium text-[#71717a] dark:text-zinc-400">
                        + {nextTotalBG.toLocaleString()} BG
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-[#71717a] dark:text-zinc-400">
                    {nextCharge.length} plan{nextCharge.length === 1 ? "" : "s"} renewing
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  {upcoming.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#17171c] dark:text-zinc-100">
                          {r.plan}
                        </p>
                        <p className="truncate text-[12px] text-[#71717a] dark:text-zinc-400">
                          {r.name}
                        </p>
                      </div>
                      <p className="shrink-0 text-[13px] font-bold text-[#17171c] dark:text-zinc-50">
                        {money(r.amount, r.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-[13px] text-[#71717a] dark:text-zinc-400">
                Nothing is due — every active plan is on a free tier.
              </p>
            )}
          </RailCard>

          <RailCard title="Recent bills" onSeeAll={() => onOpenBilling("invoice")}>
            <div className="mt-3 space-y-3">
              {recentBills.map((inv) => (
                <div key={inv.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#17171c] dark:text-zinc-100">
                      {inv.plan}
                    </p>
                    <p className="truncate text-[12px] text-[#71717a] dark:text-zinc-400">
                      {inv.name} · {inv.date}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold text-[#17171c] dark:text-zinc-50">
                      {money(inv.amount, inv.currency)}
                    </p>
                    <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Paid
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RailCard>
        </aside>
      </div>
    </>
  );
}
