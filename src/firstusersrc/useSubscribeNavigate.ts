import { useNavigate } from "react-router-dom";

import { useFirstUser } from "./FirstUserContext";

/* ------------------------------------------------------------------ *
 * Every "Subscribe Plan" CTA (Dashboard tabs, RunApp/Database/VPS/
 * Storage empty states) routes through here instead of calling
 * `navigate` directly: a First User browsing from an empty state goes
 * to the All Plans page first, same as anyone exploring what's
 * available, rather than jumping straight into one plan's checkout —
 * but lands on that same service's own tab there (Database's empty
 * state opens All Plans already on the Database tab, not Storage's),
 * so it still reads as "go pick a Database plan", not a cold start.
 * Verification only happens once they actually pick a plan there (see
 * useVerifyBeforeSubscribe, wired into PlanTierCard's "Try Now").
 * ------------------------------------------------------------------ */
export function useSubscribeNavigate() {
  const navigate = useNavigate();
  const { isFirstUser } = useFirstUser();

  return (subscribeUrl: string) => {
    if (!isFirstUser) {
      navigate(subscribeUrl);
      return;
    }
    // subscribeUrl looks like "/subscribe/{category}/{tier}" — lift the
    // category back out so Planning can preselect that exact tab.
    const category = subscribeUrl.split("/")[2];
    navigate(category ? `/planning?service=${category}` : "/planning");
  };
}
