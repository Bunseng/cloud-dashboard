import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { ACCOUNT_BALANCE } from "../data/nav";

/* ------------------------------------------------------------------ *
 * Account Balance — both KHR and Business Gold used to be static
 * display-only numbers (ACCOUNT_BALANCE from data/nav). Cancelling/
 * pausing a subscription now actually reloads its amount back onto the
 * matching balance (and resuming takes it back off, since billing picks
 * back up) — so both need to be real state, read by the Topbar's two
 * pills and Payment's "pay with Business Gold" balance alike, instead
 * of each reading the same frozen constant.
 * ------------------------------------------------------------------ */

interface AccountBalanceContextValue {
  khr: number;
  bg: number;
  creditKHR: (amount: number) => void;
  debitKHR: (amount: number) => void;
  creditBG: (amount: number) => void;
  debitBG: (amount: number) => void;
}

const AccountBalanceContext = createContext<AccountBalanceContextValue | null>(null);

export function AccountBalanceProvider({ children }: { children: ReactNode }) {
  const [khr, setKhr] = useState(ACCOUNT_BALANCE.khr);
  const [bg, setBg] = useState(ACCOUNT_BALANCE.bg);

  const value = useMemo(
    () => ({
      khr,
      bg,
      creditKHR: (amount: number) => setKhr((prev) => prev + amount),
      debitKHR: (amount: number) => setKhr((prev) => prev - amount),
      creditBG: (amount: number) => setBg((prev) => prev + amount),
      debitBG: (amount: number) => setBg((prev) => prev - amount),
    }),
    [khr, bg]
  );

  return <AccountBalanceContext.Provider value={value}>{children}</AccountBalanceContext.Provider>;
}

export function useAccountBalance(): AccountBalanceContextValue {
  const ctx = useContext(AccountBalanceContext);
  if (!ctx) {
    throw new Error("useAccountBalance must be used within an AccountBalanceProvider");
  }
  return ctx;
}
