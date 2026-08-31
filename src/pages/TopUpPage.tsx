import { useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { CircleCheck as CheckCircle2 } from "@/components/animate-ui/icons/circle-check";
import { Coins } from "@/components/animate-ui/icons/coins";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  AddCardDialog,
  AmountSummary,
  PayDialog,
  PaymentMethodPicker,
  resolvePaymentSelection,
  type PaymentSelection,
} from "../components/PaymentFlow";
import { addSavedCard, SAVED_CARDS, type SavedCard } from "../data/paymentMethods";

/* ------------------------------------------------------------------ *
 * Top Up — Amount → Payment Method → QR (popup) → Loading → Success.
 * Reference: MyFun's Reload Coin flow (Figma 8a9DTZufFtKkgBjMt5xPme,
 * node 7402:4576) — same shape (amount card grid, method picker, QR
 * pay, confirm), rebuilt with this app's own components/tokens rather
 * than copying MyFun's visuals wholesale. Amount is a fixed set of
 * denomination cards, not a free-typed number, matching that flow.
 * Method picker/QR dialog are shared with the Subscribe flow (see
 * ../components/PaymentFlow) so both payment experiences stay in sync.
 * ------------------------------------------------------------------ */

const AMOUNT_OPTIONS = [
  { value: 5000, tag: null },
  { value: 10000, tag: null },
  { value: 20000, tag: null },
  { value: 50000, tag: "Popular" },
  { value: 100000, tag: null },
  { value: 200000, tag: "Best Value" },
  { value: 500000, tag: null },
  { value: 1000000, tag: null },
];

type Step = "amount" | "method" | "success";

/* Amount is chosen from a fixed set of denomination cards — no typed
   number field — matching the reload flow this is based on. */
function AmountCard({
  amount,
  onSelectAmount,
  onContinue,
}: {
  amount: number | null;
  onSelectAmount: (value: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto max-w-[560px]">
      <Card>
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Coins className="h-4 w-4 text-amber-500" animateOnView />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Select Amount to Top Up
          </p>
        </div>
        <RadioGroup
          value={amount ? String(amount) : ""}
          onValueChange={(v) => onSelectAmount(Number(v))}
          className="mt-2 grid grid-cols-4 gap-3"
        >
          {AMOUNT_OPTIONS.map((option) => {
            const isSelected = amount === option.value;
            const id = `amount-${option.value}`;
            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={
                  "relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-4 font-normal motion-safe:transition-colors " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                  (isSelected
                    ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                }
              >
                <RadioGroupItem value={String(option.value)} id={id} className="sr-only" />
                {option.tag && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1C75BC] px-2 py-0.5 text-[10px] font-bold text-white">
                    {option.tag}
                  </span>
                )}
                <Coins
                  className={
                    "h-6 w-6 " + (isSelected ? "text-[#1C75BC] dark:text-[#6FA8D8]" : "text-amber-500")
                  }
                  animateOnView
                />
                <span
                  className={
                    "text-[13px] font-bold " +
                    (isSelected
                      ? "text-[#1C75BC] dark:text-[#6FA8D8]"
                      : "text-zinc-900 dark:text-zinc-100")
                  }
                >
                  {option.value.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">KHR</span>
              </Label>
            );
          })}
        </RadioGroup>

        <Button
          variant="brand"
          disabled={!amount}
          onClick={onContinue}
          className="mt-5 h-10 w-full gap-1.5 text-sm"
        >
          Continue
          <ChevronRight className="h-4 w-4" animateOnHover animateOnTap />
        </Button>
      </Card>
    </div>
  );
}

function PaymentMethodCard({
  amount,
  selected,
  cards,
  onSelect,
  onBack,
  onPay,
  onAddCard,
}: {
  amount: number;
  selected: PaymentSelection | null;
  cards: SavedCard[];
  onSelect: (id: PaymentSelection) => void;
  onBack: () => void;
  onPay: () => void;
  onAddCard: () => void;
}) {
  return (
    <div>
      <div className="mx-auto max-w-[440px]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
        >
          <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
          Back
        </button>
      </div>

      <div className="mt-4">
        <PaymentMethodPicker
          summary={<AmountSummary amount={amount} />}
          payLabel={`Pay ${amount.toLocaleString()} KHR`}
          selected={selected}
          cards={cards}
          onSelect={onSelect}
          onPay={onPay}
          onAddCard={onAddCard}
        />
      </div>
    </div>
  );
}

function SuccessPage({ amount, onDone }: { amount: number; onDone: () => void }) {
  return (
    <div className="mx-auto flex max-w-[440px] flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" animateOnView />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Payment Successful</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your balance has been topped up.
        </p>
      </div>

      <Card className="mt-2 w-full">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Amount</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            +{amount.toLocaleString()} KHR
          </span>
        </div>
      </Card>

      <Button variant="brand" onClick={onDone} className="mt-2 h-10 w-full text-sm">
        Done
      </Button>
    </div>
  );
}

export function TopUpPage({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentSelection | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  // Re-seeded from the shared SAVED_CARDS array on mount (same as
  // Wallet's own Payment Methods section) so a card added earlier in
  // Wallet already shows up here as a "no scan needed" choice.
  const [cards, setCards] = useState<SavedCard[]>(() => [...SAVED_CARDS]);

  const numericAmount = amount ?? 0;
  const resolvedSelection = resolvePaymentSelection(method, cards);

  return (
    <div>
      {step !== "success" && (
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Top Up
        </h1>
      )}

      <div className="mt-7">
        {step === "amount" && (
          <AmountCard amount={amount} onSelectAmount={setAmount} onContinue={() => setStep("method")} />
        )}

        {step === "method" && (
          <PaymentMethodCard
            amount={numericAmount}
            selected={method}
            cards={cards}
            onSelect={setMethod}
            onBack={() => setStep("amount")}
            onPay={() => setPayOpen(true)}
            onAddCard={() => setAddCardOpen(true)}
          />
        )}

        {step === "success" && <SuccessPage amount={numericAmount} onDone={onDone} />}
      </div>

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={numericAmount}
        selection={resolvedSelection}
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
