import { AccountApiTokensSection } from "./ApiTokensSection";

/* ------------------------------------------------------------------ *
 * API Tokens — reachable from the sidebar's Manage group. Only Account
 * API Tokens live here — User API Tokens and the Global API Key are
 * tied to the signed-in user, so those live exclusively on the
 * Profile page's own "API Tokens" tab instead.
 * ------------------------------------------------------------------ */

export function ApiTokensPage() {
  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        API Tokens
      </h1>

      <div className="mt-7">
        <AccountApiTokensSection />
      </div>
    </div>
  );
}
