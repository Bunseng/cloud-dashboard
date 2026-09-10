import type { ComponentType } from "react";
import { useState } from "react";
import { CircleCheck as CheckCircle2 } from "@/components/animate-ui/icons/circle-check";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  AddCardDialog,
  PayDialog,
  PaymentMethodPicker,
  resolvePaymentSelection,
  type PaymentSelection,
} from "../components/PaymentFlow";
import { addSavedCard, SAVED_CARDS, type SavedCard } from "../data/paymentMethods";
import { getTierTheme, SERVICE_PRICING, type PricingServiceKey } from "../data/pricing";

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
 * ------------------------------------------------------------------ */

type Step = "plan" | "method" | "success";
type SubscribeMode = "new" | "upgrade";

function PlanPicker({
  categoryKey,
  icon: Icon,
  tierId,
  currentTierId,
  onSelectTier,
  onContinue,
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
}) {
  const [changingPlan, setChangingPlan] = useState(false);
  const tiers = SERVICE_PRICING[categoryKey];
  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const theme = getTierTheme(tier.id);
  const priceDisplay = tier.priceKHR === 0 ? "FREE" : `${tier.priceKHR.toLocaleString()} KHR/${tier.period}`;
  const isCurrentTier = currentTierId != null && tier.id === currentTierId;

  return (
    <div className="mx-auto max-w-[520px]">
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

        <Button
          variant="brand"
          disabled={isCurrentTier}
          onClick={onContinue}
          className="mt-5 h-10 w-full text-sm"
        >
          {isCurrentTier ? "You're already on this plan" : `${currentTierId != null ? "Upgrade to" : "Continue with"} ${tier.name}`}
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
  isUpgrade,
  onDone,
}: {
  categoryLabel: string;
  tierName: string;
  isUpgrade?: boolean;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[440px] flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" animateOnView />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {isUpgrade ? "Plan Upgraded" : "Subscription Active"}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isUpgrade
            ? `You've upgraded to the ${tierName} plan for ${categoryLabel}.`
            : `You're now on the ${tierName} plan for ${categoryLabel}.`}
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
  onDone: () => void;
  onCancel: () => void;
}) {
  const isUpgrade = mode === "upgrade";
  const tiers = SERVICE_PRICING[categoryKey];
  const [step, setStep] = useState<Step>("plan");
  const [tierId, setTierId] = useState(
    tiers.some((t) => t.id === initialTierId) ? initialTierId : tiers[0].id
  );
  const [method, setMethod] = useState<PaymentSelection | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  // Same shared SAVED_CARDS array Wallet/Top Up read — a card added
  // there (or right here, mid-flow) is a "no scan needed" choice.
  const [cards, setCards] = useState<SavedCard[]>(() => [...SAVED_CARDS]);

  const currentTierId = isUpgrade ? initialTierId : undefined;
  const currentTierName = tiers.find((t) => t.id === currentTierId)?.name;
  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const priceDisplay = tier.priceKHR === 0 ? "FREE" : `${tier.priceKHR.toLocaleString()} KHR/${tier.period}`;
  const isFree = tier.priceKHR === 0;

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
          <PlanPicker
            categoryKey={categoryKey}
            icon={icon}
            tierId={tierId}
            currentTierId={currentTierId}
            onSelectTier={setTierId}
            onContinue={() => (isFree ? setStep("success") : setStep("method"))}
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
            isUpgrade={isUpgrade}
            onDone={onDone}
          />
        )}
      </div>

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
        amount={tier.priceKHR}
        selection={resolvePaymentSelection(method, cards)}
        onSuccess={() => {
          setPayOpen(false);
          setStep("success");
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
    </div>
  );
}
