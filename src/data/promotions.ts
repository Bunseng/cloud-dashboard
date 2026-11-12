import promoSignupBonus from "@/assets/promo-signup-bonus.png";

import { REDEEM_CODES, type RedeemCode } from "./redeem-codes";

/* ------------------------------------------------------------------ *
 * Promotions — the wallet bonuses offered on Home. Each one hands a
 * code to the Redeem dialog rather than crediting the balance itself,
 * so a promotion and a code typed by hand take exactly the same path.
 * ------------------------------------------------------------------ */

export interface Promotion {
  id: string;
  title: string;
  /** Code pre-filled into the Redeem dialog when the card is tapped. */
  code: string;
  /** Artwork for the banner; the gradient + gift fallback is used without it. */
  image?: string;
}

export const PROMOTIONS: Promotion[] = [
  { id: "signup", title: "Sign Up Bonus", code: "SIGNUPBONUS" },
  { id: "coupon", title: "Free Coupon", code: "FREECOUPON", image: promoSignupBonus },
];

export function promotionBonus(promo: Promotion): RedeemCode {
  return REDEEM_CODES[promo.code];
}

export function formatBonus({ amount, currency }: RedeemCode): string {
  return `+${amount.toLocaleString()} ${currency}`;
}
