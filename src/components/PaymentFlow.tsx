import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Building2 } from "@/components/animate-ui/icons/building-2";
import { CreditCard } from "@/components/animate-ui/icons/credit-card";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Plus } from "@/components/animate-ui/icons/plus";
import { QrCode } from "@/components/animate-ui/icons/qr-code";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PaymentCardVisual } from "./PaymentCard";
import type { CardBrand, SavedCard } from "../data/paymentMethods";

/* ------------------------------------------------------------------ *
 * Shared payment building blocks — the "pick a method, pay, wait for
 * confirmation" shape used by both Top Up and Subscribe/Change Plan,
 * so the two flows read as one consistent payment experience instead
 * of two one-off look-alikes.
 *
 * Two families of method now, not three flat options: SCAN_METHODS
 * (open an app, scan a code) and any of the user's SAVED_CARDS (pay
 * straight away, already set up — no scanning). Same overall flow —
 * amount/plan → pick a method → PayDialog → success — either family
 * just resolves to a different confirmation screen inside PayDialog.
 * ------------------------------------------------------------------ */

export const SCAN_METHODS = [
  {
    id: "aba",
    label: "ABA Mobile",
    description: "Scan with ABA Mobile to pay instantly.",
    icon: QrCode,
  },
  {
    id: "khqr",
    label: "KHQR (Bakong)",
    description: "Pay from any bank that supports KHQR.",
    icon: Building2,
  },
] as const;

export type ScanMethodId = (typeof SCAN_METHODS)[number]["id"];

/* The value a RadioGroup carries for "what's selected" — a scan
   method's id as-is, or a saved card prefixed "card:" so the two
   families can share one RadioGroup (exactly one method total,
   whichever family it's from) without colliding on id. */
export type PaymentSelection = string;

export function cardSelectionId(cardId: string): PaymentSelection {
  return `card:${cardId}`;
}

export type ResolvedPayment =
  | { kind: "scan"; method: (typeof SCAN_METHODS)[number] }
  | { kind: "card"; card: SavedCard }
  | null;

/* Turns the picker's raw string selection into something PayDialog
   can actually render — one lookup, shared by every screen that
   needs it, instead of each page re-deriving it. */
export function resolvePaymentSelection(
  selection: PaymentSelection | null,
  cards: SavedCard[]
): ResolvedPayment {
  if (!selection) return null;
  if (selection.startsWith("card:")) {
    const card = cards.find((c) => cardSelectionId(c.id) === selection);
    return card ? { kind: "card", card } : null;
  }
  const method = SCAN_METHODS.find((m) => m.id === selection);
  return method ? { kind: "scan", method } : null;
}

type PayState = "confirm" | "loading" | "done";

/* A stand-in QR pattern — deterministic from the amount so it looks
   different per payment, not a scannable code. Swap for the real KHQR
   payload/image once the payment API exists. */
export function PlaceholderQr({ seed }: { seed: number }) {
  const cells = 9;
  let n = seed || 1;
  function next() {
    n = (n * 1103515245 + 12345) % 2147483648;
    return n;
  }
  return (
    <div className="grid grid-cols-9 gap-[3px] rounded-lg bg-white p-3">
      {Array.from({ length: cells * cells }, (_, i) => {
        // Corner "finder" squares stay solid, like a real QR code's.
        const row = Math.floor(i / cells);
        const col = i % cells;
        const inCorner =
          (row < 3 && col < 3) || (row < 3 && col >= cells - 3) || (row >= cells - 3 && col < 3);
        const on = inCorner || next() % 2 === 0;
        return (
          <div
            key={i}
            className={"aspect-square rounded-[1px] " + (on ? "bg-zinc-900" : "bg-transparent")}
          />
        );
      })}
    </div>
  );
}

/* Method picker — a summary of what's being paid for (customizable via
   `summary`), then "scan to pay" methods and, below a divider, every
   saved card as an equally-selectable option. Both live in one
   RadioGroup so picking a card deselects a scan method and vice
   versa. */
export function PaymentMethodPicker({
  summary,
  payLabel,
  selected,
  cards,
  onSelect,
  onPay,
  onAddCard,
  payDisabled = false,
}: {
  summary: ReactNode;
  payLabel: string;
  selected: PaymentSelection | null;
  cards: SavedCard[];
  onSelect: (id: PaymentSelection) => void;
  onPay: () => void;
  onAddCard?: () => void;
  payDisabled?: boolean;
}) {
  return (
    <div className="mx-auto max-w-[440px]">
      {summary}

      <p className="mt-5 text-sm font-medium text-zinc-900 dark:text-zinc-100">Scan to Pay</p>
      <RadioGroup value={selected ?? ""} onValueChange={onSelect} className="mt-2 space-y-2">
        {SCAN_METHODS.map((method) => {
          const isSelected = selected === method.id;
          const id = `method-${method.id}`;
          return (
            <Label
              key={method.id}
              htmlFor={id}
              className={
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left font-normal motion-safe:transition-colors " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                (isSelected
                  ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
              }
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
                <method.icon
                  className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]"
                  animateOnView
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {method.label}
                </p>
                <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                  {method.description}
                </p>
              </div>
              <RadioGroupItem value={method.id} id={id} />
            </Label>
          );
        })}

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">
            OR PAY WITH A CARD
          </span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {cards.map((card) => {
          const value = cardSelectionId(card.id);
          const isSelected = selected === value;
          const id = `method-${value}`;
          return (
            <Label
              key={card.id}
              htmlFor={id}
              className={
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left font-normal motion-safe:transition-colors " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 " +
                (isSelected
                  ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
              }
            >
              <PaymentCardVisual card={card} compact />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {card.brand} •••• {card.last4}
                </p>
                <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                  Already set up — pays instantly, no scan needed.
                </p>
              </div>
              <RadioGroupItem value={value} id={id} />
            </Label>
          );
        })}
      </RadioGroup>

      {onAddCard && (
        <button
          type="button"
          onClick={onAddCard}
          className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
        >
          <Plus className="h-3.5 w-3.5" animateOnHover animateOnTap />
          {cards.length > 0 ? "Add another card" : "Add a card"}
        </button>
      )}

      <Button
        variant="brand"
        disabled={!selected || payDisabled}
        onClick={onPay}
        className="mt-5 h-10 w-full text-sm"
      >
        {payLabel}
      </Button>
    </div>
  );
}

/* The popup itself. Scan methods wait on a QR (fake scan, then a
   confirming spinner); a saved card skips straight to confirming —
   it's already set up, there's nothing to scan — before landing on
   the same success handoff either way. */
export function PayDialog({
  open,
  onOpenChange,
  amount,
  selection,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  selection: ResolvedPayment;
  onSuccess: () => void;
}) {
  const [state, setState] = useState<PayState>("confirm");
  const [secondsLeft, setSecondsLeft] = useState(180);
  const isCard = selection?.kind === "card";

  useEffect(() => {
    if (!open) {
      setState("confirm");
      setSecondsLeft(180);
      return;
    }
    // Scanning takes a beat to "notice" the payment; a saved card has
    // nothing to scan, so it moves to confirming almost immediately.
    const confirmDelay = isCard ? 1200 : 3000;
    const doneDelay = isCard ? 2800 : 5000;
    const toLoading = setTimeout(() => setState("loading"), confirmDelay);
    const toDone = setTimeout(() => {
      setState("done");
      onSuccess();
    }, doneDelay);
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearTimeout(toLoading);
      clearTimeout(toDone);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={state === "loading" ? undefined : onOpenChange}>
      <DialogContent className="max-w-[360px]" showClose={state !== "loading"}>
        {state === "confirm" ? (
          selection?.kind === "card" ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Card Payment</DialogTitle>
                <DialogDescription>
                  Charging your {selection.card.brand} card ending in {selection.card.last4}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4">
                <PaymentCardVisual card={selection.card} />
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {amount.toLocaleString()} KHR
                </p>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Scan to Pay</DialogTitle>
                <DialogDescription>
                  Open {selection?.method.label ?? "your payment app"} and scan this code.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4">
                <PlaceholderQr seed={amount} />
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {amount.toLocaleString()} KHR
                  </p>
                  <p className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                    Expires in {mm}:{ss}
                  </p>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1C75BC]" animate loop />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Confirming payment…
            </p>
            <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400">
              Don't close this window.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* Amount summary strip shown above the method picker on Top Up. */
export function AmountSummary({ amount }: { amount: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount to Top Up</p>
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {amount.toLocaleString()} KHR
        </p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Add Card — a short Dialog (name, number, expiry, CVV), same shape
 * as Create Bucket/Create Group's single-purpose dialogs. Brand
 * defaults to ABA (the one most Top Up/Subscribe amounts here are
 * priced in KHR for), but any card brand can be added.
 * ------------------------------------------------------------------ */

const CARD_BRANDS: CardBrand[] = ["ABA", "Visa", "Mastercard"];

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function AddCardDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (card: Omit<SavedCard, "id">) => void;
}) {
  const [brand, setBrand] = useState<CardBrand>("ABA");
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const digits = number.replace(/\D/g, "");
  const valid =
    holder.trim().length > 0 &&
    digits.length === 16 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    /^\d{3,4}$/.test(cvv);

  function reset() {
    setBrand("ABA");
    setHolder("");
    setNumber("");
    setExpiry("");
    setCvv("");
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    onSave({ brand, holder: holder.trim().toUpperCase(), last4: digits.slice(-4), expiry });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
          <DialogDescription>
            Saved once, it's a one-tap "pay instantly" choice in every payment
            flow — no scanning needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Card Brand</Label>
            <Select value={brand} onValueChange={(v) => setBrand(v as CardBrand)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="add-card-holder" className="text-zinc-900 dark:text-zinc-100">
              Cardholder Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="add-card-holder"
              autoFocus
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="SORN BUNSENG"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="add-card-number" className="text-zinc-900 dark:text-zinc-100">
              Card Number<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="add-card-number"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="mt-2 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-card-expiry" className="text-zinc-900 dark:text-zinc-100">
                Expiry (MM/YY)<span className="ml-0.5 text-red-500">*</span>
              </Label>
              <Input
                id="add-card-expiry"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                }}
                placeholder="08/28"
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="add-card-cvv" className="text-zinc-900 dark:text-zinc-100">
                CVV<span className="ml-0.5 text-red-500">*</span>
              </Label>
              <Input
                id="add-card-cvv"
                inputMode="numeric"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="mt-2 font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={!valid} className="h-9 text-sm">
              Save Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
