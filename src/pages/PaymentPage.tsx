import { useState } from "react";
import { ArrowUpRight } from "@/components/animate-ui/icons/arrow-up-right";
import { Download } from "@/components/animate-ui/icons/download";
import { Gem } from "@/components/animate-ui/icons/gem";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";

import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { AddCardDialog } from "../components/PaymentFlow";
import { PaymentCardVisual } from "../components/PaymentCard";
import { BILLING_CATEGORIES, INVOICE_RECORDS } from "../data/billing";
import { addSavedCard, removeSavedCard, SAVED_CARDS, type SavedCard } from "../data/paymentMethods";

/* ------------------------------------------------------------------ *
 * Payment — formerly "Wallet". No KHR balance number/card here (or
 * anywhere outside a plan's own price) — every payment is made
 * directly, per top-up/subscription, by scanning ABA Mobile/KHQR or
 * paying with a saved card, so there's no persistent KHR figure to
 * show. What's left: Business Gold, reframed as the bonus/gift
 * currency it actually is (earned, not purchased) — and a real
 * Payment Methods section (saved cards), "your idea for better UX/UI"
 * per the redesign ask, so this page is about *how* you pay, not a
 * number that duplicated the Topbar.
 * ------------------------------------------------------------------ */

function BonusHeroCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C75BC] to-indigo-700 p-6 text-white shadow-sm">
      {/* Decorative glow — purely visual, clipped by the card's own
          rounded corners/overflow-hidden. */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Gem className="h-4.5 w-4.5" animateOnView />
        </div>
        <p className="text-sm font-medium text-white/90">Business Gold (BG)</p>
      </div>

      <p className="relative mt-5 max-w-[420px] text-sm leading-relaxed text-white/85">
        A bonus currency, not something you buy — earned as a gift for topping
        up, referrals, and promotions, and spendable on some subscriptions
        alongside KHR.
      </p>
    </div>
  );
}

/* Payment Methods — every saved card, plus a dashed "Add Card" tile.
   Delete asks for confirmation the same way any destructive action in
   this app does (ConfirmDialog); there's no "edit" here since a card's
   number/CVV shouldn't be editable in place — remove and re-add. */
function PaymentMethodsSection({
  cards,
  onAddCard,
  onRemoveCard,
}: {
  cards: SavedCard[];
  onAddCard: () => void;
  onRemoveCard: (card: SavedCard) => void;
}) {
  const [removing, setRemoving] = useState<SavedCard | null>(null);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
            Saved cards pay instantly in Top Up and Subscribe — no scanning needed.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {cards.map((card) => (
          <div key={card.id} className="group relative">
            <PaymentCardVisual card={card} />
            <button
              type="button"
              aria-label={`Remove ${card.brand} card ending in ${card.last4}`}
              onClick={() => setRemoving(card)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 opacity-0 shadow-sm motion-safe:transition-opacity group-hover:opacity-100 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddCard}
          className="flex h-[152px] w-full max-w-[280px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-500 motion-safe:transition-colors hover:border-[#1C75BC]/40 hover:text-[#1C75BC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-[#6FA8D8]"
        >
          <Plus className="h-5 w-5" animateOnHover animateOnTap />
          <span className="text-sm font-medium">Add Card</span>
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.brand} card ending in ${removing?.last4}?`}
        description="You'll need to add it again to use it as a payment method."
        confirmLabel="Remove Card"
        variant="destructive"
        onConfirm={() => {
          if (removing) onRemoveCard(removing);
          setRemoving(null);
        }}
      />
    </div>
  );
}

export function PaymentPage({
  onViewBilling,
}: {
  onViewBilling: () => void;
}) {
  // A short, real preview of recent activity (not a fabricated feed) —
  // the same invoice records Billing Subscription's Invoice tab lists,
  // just the 3 most recent, with a link across to see the rest.
  const recent = INVOICE_RECORDS.slice(0, 3);

  // Re-seeds from the shared SAVED_CARDS array on every mount — Top
  // Up/Subscribe read the same array, so a card added there or here
  // shows up wherever it's read next.
  const [cards, setCards] = useState<SavedCard[]>(() => [...SAVED_CARDS]);
  const [addCardOpen, setAddCardOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Payment
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            How you pay across every service — cards, scanning, and your Business Gold bonus.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BonusHeroCard />
      </div>

      <Card className="mt-5">
        <PaymentMethodsSection
          cards={cards}
          onAddCard={() => setAddCardOpen(true)}
          onRemoveCard={(card) => {
            removeSavedCard(card.id);
            setCards((prev) => prev.filter((c) => c.id !== card.id));
          }}
        />
      </Card>

      {/* Perk strip — reinforces the actual flexibility (scan or a
          saved card, everywhere), without inventing a balance number
          the app doesn't track. */}
      <Card className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-zinc-800">
          <ShieldCheck className="h-4.5 w-4.5 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pay however works for you
          </p>
          <p className="mt-0.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            Every Top Up and Subscribe accepts scanning ABA Mobile/KHQR, or a saved card for an instant, no-scan payment.
          </p>
        </div>
      </Card>

      {/* Recent activity — a quick peek, not the full history. */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <button
          type="button"
          onClick={onViewBilling}
          className="flex items-center gap-1 text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
        >
          View Billing Subscription
          <ArrowUpRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {recent.length > 0 ? (
          recent.map((r, i) => {
            const cat = BILLING_CATEGORIES.find((c) => c.key === r.category);
            return (
              <div
                key={r.id}
                className={
                  "flex items-center gap-3 px-4 py-3 " +
                  (i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : "")
                }
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Receipt className="h-4 w-4 text-zinc-500 dark:text-zinc-400" animateOnView />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {r.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                    {cat?.icon && <cat.icon className="h-3 w-3" animateOnView />}
                    {r.plan} · {r.date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {r.amount.toLocaleString()} {r.currency}
                  </p>
                  <Download className="h-4 w-4 text-zinc-400 dark:text-zinc-500" animateOnView />
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No activity yet.
          </p>
        )}
      </div>

      <AddCardDialog
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        onSave={(card) => setCards((prev) => [...prev, addSavedCard(card)])}
      />
    </div>
  );
}
