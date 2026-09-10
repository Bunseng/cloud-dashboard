import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * First User mode — a demo toggle (Topbar's avatar menu, right below
 * "Payment") that previews the dashboard exactly as a brand-new account
 * sees it: zero subscriptions, zero services, nothing to drill into.
 * Every page that lists subscriptions/services reads `isFirstUser` from
 * here instead of keeping its own "am I empty?" state, so flipping the
 * one switch clears the whole app at once instead of page by page.
 *
 * `profile` backs Phone/Email verification (see VerifyContactDialog on
 * the Profile page, and useVerifyBeforeSubscribe's combined flow) —
 * phone and email are tracked independently, each with its own
 * `verified` flag, so verifying one never re-asks for the other: once
 * phone is verified, only email still needs it, and vice versa. Resets
 * to fully-unverified every time First User mode is freshly switched
 * on, so each preview run starts fresh.
 *
 * "Subscribe Plan" CTAs across the app (Dashboard tabs, RunApp/
 * Database/VPS/Storage empty states) send a First User to the All
 * Plans page first (see useSubscribeNavigate) — verification only
 * kicks in once they actually pick a service's plan there
 * (useVerifyBeforeSubscribe, wired into PlanTierCard's "Try Now").
 * ------------------------------------------------------------------ */

export interface ContactField {
  value: string;
  verified: boolean;
}

export interface FirstUserProfile {
  phone: ContactField;
  email: ContactField;
}

const EMPTY_PROFILE: FirstUserProfile = {
  phone: { value: "", verified: false },
  email: { value: "", verified: false },
};

interface FirstUserContextValue {
  isFirstUser: boolean;
  toggleFirstUser: () => void;
  profile: FirstUserProfile;
  verifyPhone: (phone: string) => void;
  verifyEmail: (email: string) => void;
  isVerified: boolean;
}

const FirstUserContext = createContext<FirstUserContextValue | null>(null);

export function FirstUserProvider({ children }: { children: ReactNode }) {
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [profile, setProfile] = useState<FirstUserProfile>(EMPTY_PROFILE);

  const value = useMemo(
    () => ({
      isFirstUser,
      toggleFirstUser: () =>
        setIsFirstUser((v) => {
          const next = !v;
          if (next) setProfile(EMPTY_PROFILE);
          return next;
        }),
      profile,
      verifyPhone: (phone: string) =>
        setProfile((prev) => ({ ...prev, phone: { value: phone, verified: true } })),
      verifyEmail: (email: string) =>
        setProfile((prev) => ({ ...prev, email: { value: email, verified: true } })),
      isVerified: profile.phone.verified && profile.email.verified,
    }),
    [isFirstUser, profile]
  );
  return <FirstUserContext.Provider value={value}>{children}</FirstUserContext.Provider>;
}

export function useFirstUser(): FirstUserContextValue {
  const ctx = useContext(FirstUserContext);
  if (!ctx) {
    throw new Error("useFirstUser must be used within a FirstUserProvider");
  }
  return ctx;
}
