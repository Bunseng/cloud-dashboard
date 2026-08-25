/* ------------------------------------------------------------------ *
 * Saved cards — the "pay with a card you've already added" choice
 * offered alongside scanning ABA Mobile/KHQR in every payment flow
 * (Wallet's Top Up, Subscribe). No real backend, so SAVED_CARDS is a
 * module-level mutable array (same pattern as data/groups.ts) — a
 * card added from Wallet's own Payment Methods section is still
 * there, picked up fresh, wherever a payment flow reads it next.
 * ------------------------------------------------------------------ */

export type CardBrand = "ABA" | "Visa" | "Mastercard";

export interface SavedCard {
  id: string;
  brand: CardBrand;
  holder: string;
  last4: string;
  expiry: string; // MM/YY
}

let nextCardId = 1;
function makeCardId() {
  return `card-${Date.now()}-${nextCardId++}`;
}

/* One ABA card already set up — so every payment flow always has a
   real "pay with card" option to demo right away, not just an empty
   "add your first card" state. */
export const SAVED_CARDS: SavedCard[] = [
  { id: "card-aba-seed", brand: "ABA", holder: "SORN BUNSENG", last4: "4242", expiry: "08/28" },
];

export function addSavedCard(card: Omit<SavedCard, "id">): SavedCard {
  const saved: SavedCard = { ...card, id: makeCardId() };
  SAVED_CARDS.push(saved);
  return saved;
}

export function removeSavedCard(id: string) {
  const i = SAVED_CARDS.findIndex((c) => c.id === id);
  if (i !== -1) SAVED_CARDS.splice(i, 1);
}
