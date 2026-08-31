import { Wifi } from "@/components/animate-ui/icons/wifi";

import type { SavedCard } from "../data/paymentMethods";

/* ------------------------------------------------------------------ *
 * A realistic credit-card visual — gradient, brand wordmark, chip
 * glyph, masked number, holder/expiry — instead of a plain "ABA ••••
 * 4242" text row. Used both by Wallet's Payment Methods section (a
 * real-size tile) and inline in the payment method picker/PayDialog
 * (a `compact` size), so a saved card looks the same wherever it's
 * shown, not just in the one place it was added.
 * ------------------------------------------------------------------ */

const BRAND_GRADIENT: Record<SavedCard["brand"], string> = {
  ABA: "bg-gradient-to-br from-[#e0201d] to-[#7a0f0a]",
  Visa: "bg-gradient-to-br from-[#1C75BC] to-[#0d3f66]",
  Mastercard: "bg-gradient-to-br from-zinc-700 to-zinc-900",
};

export function PaymentCardVisual({
  card,
  compact = false,
  className = "",
}: {
  card: SavedCard;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        "relative flex shrink-0 flex-col overflow-hidden rounded-xl text-white shadow-sm " +
        BRAND_GRADIENT[card.brand] +
        " " +
        (compact ? "h-[104px] w-[176px] p-3.5" : "h-[152px] w-full max-w-[280px] p-5") +
        " " +
        className
      }
    >
      <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className={"font-bold tracking-wide " + (compact ? "text-[11px]" : "text-sm")}>
          {card.brand}
        </span>
        <Wifi
          className={compact ? "h-3.5 w-3.5 text-white/70" : "h-4 w-4 text-white/70"}
          animateOnView
        />
      </div>

      <p
        className={
          "relative mt-auto font-mono text-white/90 " +
          (compact ? "text-[12px] tracking-[0.12em]" : "text-base tracking-[0.15em]")
        }
      >
        •••• •••• •••• {card.last4}
      </p>

      <div className="relative mt-2 flex items-end justify-between gap-2">
        <span className={"truncate uppercase text-white/70 " + (compact ? "text-[9px]" : "text-[11px]")}>
          {card.holder}
        </span>
        <span className={"shrink-0 text-white/70 " + (compact ? "text-[9px]" : "text-[11px]")}>
          {card.expiry}
        </span>
      </div>
    </div>
  );
}
