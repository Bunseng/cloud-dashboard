/* ------------------------------------------------------------------ *
 * Redeem codes.
 *
 * These stand in for whatever the backend would validate; an unknown
 * one is rejected in RedeemDialog rather than silently accepted, so
 * the error state is part of the prototype too. Each code carries its
 * own currency because the wallet keeps KHR and BG apart — a voucher
 * credits one or the other, never both.
 * ------------------------------------------------------------------ */

export type WalletCurrency = "KHR" | "BG";

export interface RedeemCode {
  amount: number;
  currency: WalletCurrency;
}

export const REDEEM_CODES: Record<string, RedeemCode> = {
  CLOUDPLUS50: { amount: 50_000, currency: "KHR" },
  WELCOME2026: { amount: 20_000, currency: "KHR" },
  SABAYTEKH: { amount: 100_000, currency: "KHR" },
  SIGNUPBONUS: { amount: 1_000, currency: "BG" },
  FREECOUPON: { amount: 100, currency: "BG" },
};
