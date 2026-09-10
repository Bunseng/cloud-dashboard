import { useRef, useState } from "react";

import { useFirstUser } from "./FirstUserContext";
import type { VerifyField } from "./VerifyContactDialog";

/* ------------------------------------------------------------------ *
 * Verify-before-subscribe — wired into PlanTierCard's "Try Now" so
 * picking an actual plan is the point a First User verifies, not
 * browsing the All Plans page itself. Only asks for what's still
 * unverified: both phone and email if neither is done (stepped through
 * in one SubscribeVerifyDialog), just the one left if the other's
 * already confirmed, or nothing at all (an immediate pass-through)
 * once both are verified.
 * ------------------------------------------------------------------ */
export function useVerifyBeforeSubscribe() {
  const { isFirstUser, profile, verifyPhone, verifyEmail } = useFirstUser();
  const [fields, setFields] = useState<VerifyField[]>([]);
  const pendingRef = useRef<(() => void) | null>(null);

  function guard(action: () => void) {
    if (!isFirstUser) {
      action();
      return;
    }
    const needed: VerifyField[] = [];
    if (!profile.phone.verified) needed.push("phone");
    if (!profile.email.verified) needed.push("email");

    if (needed.length === 0) {
      action();
      return;
    }
    pendingRef.current = action;
    setFields(needed);
  }

  function handleFieldVerified(field: VerifyField, value: string) {
    if (field === "phone") verifyPhone(value);
    else verifyEmail(value);
  }

  function handleAllVerified() {
    setFields([]);
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  }

  function cancel() {
    pendingRef.current = null;
    setFields([]);
  }

  return { fields, guard, handleFieldVerified, handleAllVerified, cancel };
}
