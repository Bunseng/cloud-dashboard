import type { ComponentType, CSSProperties, ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Wallet } from "@/components/animate-ui/icons/wallet";

import { FEATURES } from "../data/nav";
import {
  BILLING_RECORDS,
  PLACEHOLDER_SUBSCRIPTION_COUNT,
  type BillingRecord,
} from "../data/billing";
import { useFirstUser } from "../firstusersrc/FirstUserContext";

/* ------------------------------------------------------------------ *
 * Account stats — the at-a-glance "how much am I running, and what is
 * it costing me" strip that sits above the Dashboard's service tabs.
 * Both figures are derived, never hardcoded, so First User mode (a
 * brand-new account with nothing subscribed) zeroes them out on its
 * own.
 * ------------------------------------------------------------------ */

type StatIcon =
  | LucideIcon
  | ComponentType<{
      className?: string;
      strokeWidth?: number;
      animate?: boolean;
      animateOnHover?: boolean;
      animateOnTap?: boolean;
      animateOnView?: boolean;
      loop?: boolean;
    }>;

function stagger(index: number): CSSProperties {
  return { animationDelay: `${index * 70}ms` };
}

export function QuickStat({
  icon: Icon,
  label,
  value,
  sub,
  index,
}: {
  icon: StatIcon;
  label: string;
  value: string;
  sub?: ReactNode;
  index: number;
}) {
  return (
    <div
      style={stagger(index)}
      className="flex items-center gap-3.5 rounded-xl border border-[#e5e7eb] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both dark:border-zinc-800"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
        <Icon className="h-[18px] w-[18px] text-[#1C75BC] dark:text-[#6FA8D8]" strokeWidth={1.75} animateOnView />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-[#71717a] dark:text-zinc-400">{label}</p>
        <p className="truncate text-[15px] font-bold text-[#17171c] dark:text-zinc-50">
          {value}
          {sub && <span className="ml-1.5 text-[13px] font-medium text-[#71717a] dark:text-zinc-400">{sub}</span>}
        </p>
      </div>
    </div>
  );
}

export interface AccountSummary {
  /** Subscriptions per feature, counting VPS off the placeholder since
      it has no billing rows of its own yet. */
  countFor: (featureId: string) => number;
  records: BillingRecord[];
  activeSubscriptions: number;
  totalSubscriptions: number;
  /** Anything not plainly Active — a scheduled cancel, a failed charge. */
  attention: BillingRecord[];
  /** Only the genuinely broken ones (suspended / failed), never a
      scheduled change — the banner's severity hangs off this. */
  problems: BillingRecord[];
  spendKHR: number;
  spendBG: number;
  nextChargeOn?: string;
  renewingCount: number;
}

export function useAccountSummary(): AccountSummary {
  const { isFirstUser } = useFirstUser();
  const records = isFirstUser ? [] : BILLING_RECORDS;

  const countFor = (featureId: string) => {
    const own = records.filter((r) => r.category === featureId).length;
    if (own > 0) return own;
    // VPS runs subscriptions but hasn't been wired into the billing
    // ledger yet, so fall back to the same count its tab shows.
    const feature = FEATURES.find((f) => f.id === featureId);
    return !isFirstUser && feature?.multiSubscription ? PLACEHOLDER_SUBSCRIPTION_COUNT : 0;
  };

  const totalSubscriptions = FEATURES.reduce((sum, f) => sum + countFor(f.id), 0);
  const attention = records.filter((r) => r.status.tone !== "green");
  const problems = records.filter((r) => r.status.tone === "red");

  const activeRecords = records.filter((r) => r.status.label === "Active");
  const spendKHR = activeRecords
    .filter((r) => r.currency === "KHR")
    .reduce((sum, r) => sum + r.amount, 0);
  const spendBG = activeRecords
    .filter((r) => r.currency === "BG")
    .reduce((sum, r) => sum + r.amount, 0);

  const renewing = activeRecords.filter((r) => r.amount > 0);
  const nextChargeOn = renewing
    .map((r) => r.renewsOn)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];

  return {
    countFor,
    records,
    activeSubscriptions: totalSubscriptions - problems.length,
    totalSubscriptions,
    attention,
    problems,
    spendKHR,
    spendBG,
    nextChargeOn,
    renewingCount: renewing.filter((r) => r.renewsOn === nextChargeOn).length,
  };
}

export function AccountStats({ className }: { className?: string }) {
  const s = useAccountSummary();
  const scheduled = s.attention.length - s.problems.length;

  return (
    <div className={"grid grid-cols-2 gap-4 " + (className ?? "")}>
      <QuickStat
        icon={Sparkles}
        label="Active Subscriptions"
        value={
          s.problems.length > 0
            ? `${s.activeSubscriptions} of ${s.totalSubscriptions}`
            : `${s.activeSubscriptions} running`
        }
        sub={
          s.problems.length > 0
            ? `${s.problems.length} suspended`
            : scheduled > 0
            ? `${scheduled} scheduled to cancel`
            : undefined
        }
        index={0}
      />
      <QuickStat
        icon={Wallet}
        label="This Month's Spend"
        value={`${s.spendKHR.toLocaleString()} KHR`}
        sub={s.spendBG > 0 ? `+ ${s.spendBG.toLocaleString()} BG` : undefined}
        index={1}
      />
    </div>
  );
}
