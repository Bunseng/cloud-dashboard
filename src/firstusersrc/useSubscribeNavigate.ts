import { useNavigate } from "react-router-dom";

import { useFirstUser } from "./FirstUserContext";

/* ------------------------------------------------------------------ *
 * Every "Subscribe Plan" CTA (Dashboard tabs, RunApp/Database/VPS/
 * Storage empty states) routes through here instead of calling
 * `navigate` directly: an unverified First User instead gets the
 * "verify your account first" popup (rendered once in Layout), whose
 * own confirm button sends them to Profile. Once verified, this is
 * just a plain pass-through to the Subscribe flow.
 * ------------------------------------------------------------------ */
export function useSubscribeNavigate() {
  const navigate = useNavigate();
  const { isFirstUser, isVerified, requestVerification } = useFirstUser();

  return (subscribeUrl: string) => {
    if (isFirstUser && !isVerified) {
      requestVerification();
      return;
    }
    navigate(subscribeUrl);
  };
}
