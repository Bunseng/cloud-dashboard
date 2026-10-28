/* ------------------------------------------------------------------ *
 * API Tokens — scoped credentials for scripts/CI, same "no real
 * backend, module-level mutable array" convention as paymentMethods.ts
 * (SAVED_CARDS). Each token's own secret is only ever shown once (on
 * create, and again on roll) — the row itself never stores or displays
 * the secret afterward, matching how a real token API would behave.
 *
 * Three distinct credential shapes, following Cloudflare's own naming:
 * - Global API Key (cfk_...)  — one account-wide key tied to the user,
 *   full access, not a list; "regenerating" replaces it outright.
 * - User API Token (cfut_...) — scoped, created by a user for specific
 *   permissions; this is what "API Tokens" usually means day to day.
 * - Account API Token (cfat_...) — owned by the account itself rather
 *   than any one user, so it keeps working even if that user leaves.
 * Every secret is `<prefix><40 hex chars><8-char checksum>`.
 * ------------------------------------------------------------------ */

import { DEFAULT_PERMISSIONS, type GroupPermissions } from "./groups";

export type ApiTokenScope = "user" | "account";
export type ApiTokenStatus = "Active" | "Disabled";

export type TokenExpiryPreset = "none" | "7d" | "30d" | "90d" | "1y" | "custom";

export const TOKEN_EXPIRY_PRESETS: { value: TokenExpiryPreset; label: string }[] = [
  { value: "none", label: "No Expiration" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "custom", label: "Custom" },
];

export interface TokenExpiry {
  preset: TokenExpiryPreset;
  // Only set when preset is "custom" — an explicit expiration date
  // instead of a duration from creation time.
  endDate?: string;
}

export type IpFilterMode = "allow" | "deny";

export interface TokenIpFilter {
  mode: IpFilterMode;
  addresses: string[];
}

export interface ApiToken {
  id: string;
  name: string;
  scope: ApiTokenScope;
  status: ApiTokenStatus;
  createdOn: string;
  lastUsed: string;
  permissions: GroupPermissions;
  expiry: TokenExpiry;
  ipFilter: TokenIpFilter;
}

export interface NewTokenFields {
  name: string;
  permissions: GroupPermissions;
  expiry: TokenExpiry;
  ipFilter: TokenIpFilter;
}

export const GLOBAL_KEY_PREFIX = "cfk_";
export const USER_TOKEN_PREFIX = "cfut_";
export const ACCOUNT_TOKEN_PREFIX = "cfat_";

function randomHex(length: number): string {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Not real cryptography — just enough to make the suffix look like a
// checksum derived from the body, the way Cloudflare's own tokens read.
function checksumFor(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum = (sum * 31 + body.charCodeAt(i)) >>> 0;
  return sum.toString(16).padStart(8, "0").slice(0, 8);
}

function makeSecret(prefix: string): string {
  const body = randomHex(40);
  return `${prefix}${body}${checksumFor(body)}`;
}

let nextTokenId = 1;
function makeTokenId() {
  return `token-${Date.now()}-${nextTokenId++}`;
}

const NO_IP_FILTER: TokenIpFilter = { mode: "allow", addresses: [] };

/* A couple of each scope already set up, so both tables aren't empty on
   first load. */
export const API_TOKENS: ApiToken[] = [
  {
    id: "token-seed-1",
    name: "CI Deploy Token",
    scope: "user",
    status: "Active",
    createdOn: "Aug 2, 2026",
    lastUsed: "2 hours ago",
    permissions: { ...DEFAULT_PERMISSIONS, runapp: "Admin", storage: "Read & Write" },
    expiry: { preset: "90d" },
    ipFilter: NO_IP_FILTER,
  },
  {
    id: "token-seed-2",
    name: "Local Dev",
    scope: "user",
    status: "Active",
    createdOn: "Jul 14, 2026",
    lastUsed: "Never",
    permissions: { ...DEFAULT_PERMISSIONS, storage: "Read Only" },
    expiry: { preset: "none" },
    ipFilter: NO_IP_FILTER,
  },
  {
    id: "token-seed-3",
    name: "Terraform Provider",
    scope: "account",
    status: "Active",
    createdOn: "Jun 20, 2026",
    lastUsed: "1 day ago",
    permissions: { ...DEFAULT_PERMISSIONS, runapp: "Admin", database: "Admin", vps: "Admin" },
    expiry: { preset: "none" },
    ipFilter: { mode: "allow", addresses: ["203.0.113.4"] },
  },
];

export function addApiToken(
  fields: NewTokenFields,
  scope: ApiTokenScope
): { token: ApiToken; secret: string } {
  const token: ApiToken = {
    id: makeTokenId(),
    name: fields.name,
    scope,
    status: "Active",
    createdOn: new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    lastUsed: "Never",
    permissions: fields.permissions,
    expiry: fields.expiry,
    ipFilter: fields.ipFilter,
  };
  API_TOKENS.unshift(token);
  return { token, secret: makeSecret(scope === "account" ? ACCOUNT_TOKEN_PREFIX : USER_TOKEN_PREFIX) };
}

export function removeApiToken(id: string) {
  const i = API_TOKENS.findIndex((t) => t.id === id);
  if (i !== -1) API_TOKENS.splice(i, 1);
}

// Rolling keeps the same token row/identity — only the secret changes.
export function rollApiToken(scope: ApiTokenScope): string {
  return makeSecret(scope === "account" ? ACCOUNT_TOKEN_PREFIX : USER_TOKEN_PREFIX);
}

export let GLOBAL_API_KEY = makeSecret(GLOBAL_KEY_PREFIX);

export function regenerateGlobalApiKey(): string {
  GLOBAL_API_KEY = makeSecret(GLOBAL_KEY_PREFIX);
  return GLOBAL_API_KEY;
}
