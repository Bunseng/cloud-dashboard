import { useState } from "react";

import { Box } from "@/components/animate-ui/icons/box";
import { Calendar } from "@/components/animate-ui/icons/calendar";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { CreditCard } from "@/components/animate-ui/icons/credit-card";
import { Database } from "@/components/animate-ui/icons/database";
import { Info } from "@/components/animate-ui/icons/info";
import { Key } from "@/components/animate-ui/icons/key";
import { Layers } from "@/components/animate-ui/icons/layers";
import { Plus } from "@/components/animate-ui/icons/plus";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { Server } from "@/components/animate-ui/icons/server";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CredentialField, PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS, RowActionIconButton, StatusBadge } from "../components/atoms";
import {
  addApiToken,
  API_TOKENS,
  GLOBAL_API_KEY,
  regenerateGlobalApiKey,
  removeApiToken,
  rollApiToken,
  TOKEN_EXPIRY_PRESETS,
  type ApiToken,
  type ApiTokenScope,
  type IpFilterMode,
  type NewTokenFields,
  type TokenExpiry,
  type TokenExpiryPreset,
  type TokenIpFilter,
} from "../data/apiTokens";
import {
  DEFAULT_PERMISSIONS,
  PERMISSION_LEVELS,
  PERMISSION_RESOURCES,
  type GroupPermissions,
  type PermissionLevel,
  type PermissionResourceKey,
} from "../data/groups";

/* ------------------------------------------------------------------ *
 * API Tokens — same split as Cloudflare: User API Tokens + the legacy
 * Global API Key live only on the Profile page's own "API Tokens" tab
 * (they're tied to the signed-in user), while Account API Tokens —
 * owned by the account rather than any one user — get the sidebar's
 * standalone "API Tokens" page (Manage group). Both panels share the
 * same `TokenTable`/dialogs below and the same underlying API_TOKENS
 * data, just filtered to their own scope.
 * ------------------------------------------------------------------ */

// Same icon each resource already uses in the sidebar's own Feature
// group, so a token's Permission Policy reads as "the same four
// things" rather than inventing a second icon set.
const PERMISSION_RESOURCE_ICONS: Record<PermissionResourceKey, typeof Box> = {
  storage: Box,
  runapp: Layers,
  database: Database,
  vps: Server,
  billing: CreditCard,
};

// A default name so the field isn't blank on open — still just a
// suggestion, freely editable or replaceable with the refresh button.
const TOKEN_NAME_ADJECTIVES = ["swift", "quiet", "bold", "amber", "rapid", "cobalt", "lunar", "brisk"];
const TOKEN_NAME_NOUNS = ["falcon", "token", "relay", "beacon", "comet", "otter", "ember", "pixel"];

function generateTokenName(): string {
  const adjective = TOKEN_NAME_ADJECTIVES[Math.floor(Math.random() * TOKEN_NAME_ADJECTIVES.length)];
  const noun = TOKEN_NAME_NOUNS[Math.floor(Math.random() * TOKEN_NAME_NOUNS.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${adjective}-${noun}-${suffix}`;
}

/* Multiple-value IP input — same add/remove-row shape as Run App's env
   var rows, just one value per row instead of a key/value pair. */
function IpRowInputs({
  addresses,
  onChange,
}: {
  addresses: string[];
  onChange: (addresses: string[]) => void;
}) {
  function update(i: number, value: string) {
    onChange(addresses.map((a, idx) => (idx === i ? value : a)));
  }
  function remove(i: number) {
    onChange(addresses.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      {addresses.map((address, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={address}
            onChange={(e) => update(i, e.target.value)}
            placeholder="e.g. 203.0.113.0/24"
            className="h-9 font-mono text-[13px]"
          />
          <button
            type="button"
            aria-label="Remove IP address"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900"
          >
            <X className="h-3.5 w-3.5" animateOnHover animateOnTap />
          </button>
        </div>
      ))}
      {addresses.length === 0 && (
        <p className="text-[13px] text-zinc-400 dark:text-zinc-500">
          No addresses added — leave empty to allow every IP.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...addresses, ""])}
        className="h-8 gap-1.5 text-[13px]"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Add IP Address
      </Button>
    </div>
  );
}

function expiryDescription(expiry: TokenExpiry): string {
  if (expiry.preset === "none") return "Never expires";
  if (expiry.preset === "custom") {
    return expiry.endDate ? `Expires on ${expiry.endDate}` : "Custom expiration (incomplete)";
  }
  return `Expires ${TOKEN_EXPIRY_PRESETS.find((p) => p.value === expiry.preset)?.label.toLowerCase()} from creation`;
}

/* Create API Token — full page, matching Run App's Create flow (a page
   that replaces the list, not a modal) rather than a dialog. Fill in
   the fields, then "Review" swaps to a read-only Summary/JSON/Terraform
   step before the token actually gets created — same two-step shape as
   Cloudflare's own token wizard. */
function CreateApiTokenView({
  scopeLabel,
  onCancel,
  onCreate,
}: {
  scopeLabel: string;
  onCancel: () => void;
  onCreate: (fields: NewTokenFields) => void;
}) {
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [name, setName] = useState(() => generateTokenName());
  const [permissions, setPermissions] = useState<GroupPermissions>({ ...DEFAULT_PERMISSIONS });
  const [expiryPreset, setExpiryPreset] = useState<TokenExpiryPreset>("none");
  const [endDate, setEndDate] = useState("");
  const [ipMode, setIpMode] = useState<IpFilterMode>("allow");
  const [ipAddresses, setIpAddresses] = useState<string[]>([]);
  const [summaryTab, setSummaryTab] = useState("summary");

  const expiry: TokenExpiry =
    expiryPreset === "custom" ? { preset: "custom", endDate } : { preset: expiryPreset };
  const ipFilter: TokenIpFilter = { mode: ipMode, addresses: ipAddresses.filter((a) => a.trim()) };
  const grantedPermissions = PERMISSION_RESOURCES.filter((r) => permissions[r.key] !== "No Access");
  const trimmedName = name.trim();
  const customIncomplete = expiryPreset === "custom" && !endDate;
  const valid = Boolean(trimmedName) && !customIncomplete;

  const jsonPayload = JSON.stringify(
    {
      name: trimmedName || "untitled-token",
      policies: grantedPermissions.map((r) => ({ resource: r.key, permission: permissions[r.key] })),
      expires_on: expiry.preset === "none" ? null : expiry.preset === "custom" ? expiry.endDate : expiry.preset,
      condition: {
        request_ip: { [ipFilter.mode === "allow" ? "in" : "not_in"]: ipFilter.addresses },
      },
    },
    null,
    2
  );

  const terraformSnippet = `resource "cloudplus_api_token" "${(trimmedName || "untitled_token")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")}" {
  name = "${trimmedName || "untitled-token"}"
${grantedPermissions
    .map((r) => `  policy {\n    resource   = "${r.key}"\n    permission = "${permissions[r.key]}"\n  }`)
    .join("\n")}
${expiry.preset !== "none" ? `  expires_on = "${expiry.preset === "custom" ? expiry.endDate : expiry.preset}"\n` : ""}${
    ipFilter.addresses.length > 0
      ? `  condition {\n    request_ip_${ipFilter.mode === "allow" ? "in" : "not_in"} = [${ipFilter.addresses
          .map((a) => `"${a}"`)
          .join(", ")}]\n  }\n`
      : ""
  }}`;

  return (
    <div>
      <button
        type="button"
        onClick={step === "edit" ? onCancel : () => setStep("edit")}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        {step === "edit" ? "Back to Tokens" : "Back to Edit"}
      </button>

      <div className="mt-5 flex items-center gap-3">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Create {scopeLabel}
        </h1>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          Step {step === "edit" ? "1" : "2"} of 2 · {step === "edit" ? "Configure" : "Review"}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {step === "edit"
          ? "Name it, scope what it can do, and optionally limit when and where it works."
          : "Review exactly what this token will be created with, then confirm."}
      </p>

      {step === "edit" ? (
        <div className="mt-6 max-w-[640px] space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-zinc-400" />
                <CardTitle>Token Name</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setName(generateTokenName())}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
              >
                <RefreshCw className="h-3.5 w-3.5" animateOnHover animateOnTap />
                Generate
              </button>
            </div>
            <Input
              id="token-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI Deploy Token"
              className="mt-3"
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Permission Policy</CardTitle>
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]">
                {grantedPermissions.length} of {PERMISSION_RESOURCES.length} granted
              </span>
            </div>
            <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {PERMISSION_RESOURCES.map((resource) => {
                const ResourceIcon = PERMISSION_RESOURCE_ICONS[resource.key];
                const isGranted = permissions[resource.key] !== "No Access";
                return (
                  <div
                    key={resource.key}
                    className="flex items-center justify-between gap-4 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                          (isGranted
                            ? "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600")
                        }
                      >
                        <ResourceIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {resource.label}
                        </p>
                        <p className="truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                          {resource.description}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={permissions[resource.key]}
                      onValueChange={(v) =>
                        setPermissions((prev) => ({ ...prev, [resource.key]: v as PermissionLevel }))
                      }
                    >
                      <SelectTrigger className="h-9 w-[150px] shrink-0 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <CardTitle>Token Expiration</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="What is Token Expiration?"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Automatically expire this token after a set time</TooltipContent>
              </Tooltip>
            </div>
            <Select value={expiryPreset} onValueChange={(v) => setExpiryPreset(v as TokenExpiryPreset)}>
              <SelectTrigger className="mt-3 h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_EXPIRY_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {expiryPreset === "custom" && (
              <div className="mt-3">
                <Label htmlFor="token-end-date" className="text-[13px] text-zinc-600 dark:text-zinc-400">
                  End Date
                </Label>
                <Input
                  id="token-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
              <CardTitle>Client IP Address Filtering</CardTitle>
            </div>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Restrict this token to only work from (or never work from) specific IPs.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[13px] text-zinc-600 dark:text-zinc-400">Mode</span>
              <Select value={ipMode} onValueChange={(v) => setIpMode(v as IpFilterMode)}>
                <SelectTrigger className="h-9 w-[160px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow these IPs</SelectItem>
                  <SelectItem value="deny">Deny these IPs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <IpRowInputs addresses={ipAddresses} onChange={setIpAddresses} />
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} className="h-9 text-sm">
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!valid}
              onClick={() => setStep("review")}
              className="h-9 text-sm"
            >
              Review
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-[640px] space-y-5">
          <Card>
            <Tabs value={summaryTab} onValueChange={setSummaryTab}>
              <TabsList className={PILL_TABS_LIST_CLASS}>
                <TabsTrigger value="summary" className={PILL_TAB_TRIGGER_CLASS}>
                  Summary
                </TabsTrigger>
                <TabsTrigger value="json" className={PILL_TAB_TRIGGER_CLASS}>
                  JSON Payload
                </TabsTrigger>
                <TabsTrigger value="terraform" className={PILL_TAB_TRIGGER_CLASS}>
                  Terraform
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
                  <div className="flex items-start gap-3 py-2.5 first:pt-0">
                    <Key className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Name</p>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">{trimmedName || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Permissions
                      </p>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {grantedPermissions.length === 0
                          ? "No access granted"
                          : grantedPermissions.map((r) => `${r.label} (${permissions[r.key]})`).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2.5">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Expiration
                      </p>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">{expiryDescription(expiry)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2.5 last:pb-0">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        IP Filter
                      </p>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {ipFilter.addresses.length === 0
                          ? "No restriction — works from any IP"
                          : `${ipFilter.mode === "allow" ? "Allowed" : "Denied"} from ${ipFilter.addresses.join(", ")}`}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="json">
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-100">
                  {jsonPayload}
                </pre>
              </TabsContent>

              <TabsContent value="terraform">
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-100">
                  {terraformSnippet}
                </pre>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("edit")} className="h-9 text-sm">
              Back
            </Button>
            <Button
              variant="brand"
              onClick={() => onCreate({ name: trimmedName, permissions, expiry, ipFilter })}
              className="h-9 text-sm"
            >
              Create Token
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* One-time secret reveal — shown exactly once (on create, and again on
   roll); after closing this dialog there's no way to see the value
   again, only to roll a fresh one. */
function RevealSecretDialog({
  open,
  onOpenChange,
  title,
  secret,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  secret: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Copy this now — for your security, you won't be able to see it again.
          </DialogDescription>
        </DialogHeader>

        {secret && <CredentialField label="Token" value={secret} />}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="brand" className="h-9 text-sm">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* One table (User or Account tokens) — same columns/actions either way,
   just a different scope fed into creates/rolls so the right secret
   prefix (cfut_/cfat_) comes out. Includes its own one-time-reveal
   dialog so each panel (User, Account) is fully self-contained. */
function TokenTable({
  title,
  description,
  scope,
  tokens,
}: {
  title?: string;
  description: string;
  scope: ApiTokenScope;
  tokens: ApiToken[];
}) {
  const [rows, setRows] = useState<ApiToken[]>(tokens);
  const [creating, setCreating] = useState(false);
  const [rollTarget, setRollTarget] = useState<ApiToken | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiToken | null>(null);
  const [revealTitle, setRevealTitle] = useState("");
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  const scopeLabel = scope === "account" ? "Account API Token" : "User API Token";

  if (creating) {
    return (
      <CreateApiTokenView
        scopeLabel={scopeLabel}
        onCancel={() => setCreating(false)}
        onCreate={(fields) => {
          const { token, secret } = addApiToken(fields, scope);
          setRows((prev) => [token, ...prev]);
          setRevealTitle(`${scopeLabel} Created`);
          setRevealSecret(secret);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          {title && <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>}
          <p className={"max-w-[460px] text-sm text-zinc-500 dark:text-zinc-400 " + (title ? "mt-1" : "")}>
            {description}
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => setCreating(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
          Create Token
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Key className="h-6 w-6 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} animateOnView />
          </span>
          <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No tokens yet</p>
          <p className="mt-1 max-w-sm text-[13px] text-zinc-500 dark:text-zinc-400">
            Create one to authenticate scripts without sharing your account password.
          </p>
          <Button
            variant="brand"
            onClick={() => setCreating(true)}
            className="mt-4 h-9 gap-1.5 px-4 text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create Token
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-px text-right">
                    <span className="sr-only sm:not-sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => {
                  const granted = PERMISSION_RESOURCES.filter((r) => t.permissions[r.key] !== "No Access");
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                            <Key className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">{t.name}</p>
                            <p className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                              {granted.length === 0
                                ? "No access granted"
                                : `${granted.map((r) => r.label).join(", ")}`}
                              {t.ipFilter.addresses.length > 0 && (
                                <span className="ml-1.5 inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                                  <ShieldCheck className="h-3 w-3" /> IP restricted
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={t.status} tone={t.status === "Active" ? "green" : "zinc"} />
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">
                        {expiryDescription(t.expiry)}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{t.createdOn}</TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{t.lastUsed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <RowActionIconButton
                            icon={RefreshCw}
                            label={`Roll ${t.name}`}
                            onClick={() => setRollTarget(t)}
                          />
                          <RowActionIconButton
                            icon={Trash2}
                            label={`Delete ${t.name}`}
                            onClick={() => setDeleteTarget(t)}
                            destructive
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}


      <RevealSecretDialog
        open={revealSecret != null}
        onOpenChange={(open) => !open && setRevealSecret(null)}
        title={revealTitle}
        secret={revealSecret}
      />

      <ConfirmDialog
        open={rollTarget != null}
        onOpenChange={(open) => !open && setRollTarget(null)}
        title={rollTarget ? `Roll ${rollTarget.name}?` : "Roll token?"}
        description="Generates a new secret for this token — anything still using the old one stops working immediately."
        confirmLabel="Roll Token"
        variant="destructive"
        onConfirm={() => {
          if (rollTarget) {
            const secret = rollApiToken(rollTarget.scope);
            setRevealTitle(`${rollTarget.name} Rolled`);
            setRevealSecret(secret);
          }
          setRollTarget(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete token?"}
        description="This can't be undone — anything using this token loses access immediately."
        confirmLabel="Delete Token"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            removeApiToken(deleteTarget.id);
            setRows((prev) => prev.filter((t) => t.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function GlobalApiKeyPanel() {
  const [globalKey, setGlobalKey] = useState(GLOBAL_API_KEY);
  const [globalKeyRevealed, setGlobalKeyRevealed] = useState(false);
  const [viewKeyOpen, setViewKeyOpen] = useState(false);
  const [regenKeyOpen, setRegenKeyOpen] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Global API Key</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Full access tied to your user account under one legacy key — prefer a scoped API Token
          above for anything new.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <Label className="text-sm">Global API Key</Label>
          {globalKeyRevealed ? (
            <div className="mt-2 max-w-sm">
              <CredentialField label="Key" value={globalKey} />
            </div>
          ) : (
            <p className="mt-1 font-mono text-sm tracking-widest text-zinc-400 dark:text-zinc-500">
              ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!globalKeyRevealed && (
            <Button variant="outline" onClick={() => setViewKeyOpen(true)} className="h-9 text-sm">
              View
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setRegenKeyOpen(true)}
            className="h-9 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Change API Key
          </Button>
        </div>
      </div>

      <Dialog
        open={viewKeyOpen}
        onOpenChange={(open) => {
          setViewKeyOpen(open);
          if (!open) setPassword("");
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Your Identity</DialogTitle>
            <DialogDescription>Re-enter your password to view your Global API Key.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="confirm-password" className="text-zinc-900 dark:text-zinc-100">
              Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="brand"
              disabled={!password}
              onClick={() => {
                setGlobalKeyRevealed(true);
                setViewKeyOpen(false);
                setPassword("");
              }}
              className="h-9 text-sm"
            >
              View Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={regenKeyOpen}
        onOpenChange={setRegenKeyOpen}
        title="Change Global API Key?"
        description="Immediately invalidates the current key — anything still using it stops working until you update it there too."
        confirmLabel="Change API Key"
        variant="destructive"
        onConfirm={() => {
          const next = regenerateGlobalApiKey();
          setGlobalKey(next);
          setGlobalKeyRevealed(true);
        }}
      />
    </div>
  );
}

/* Profile-only: User API Tokens + the Global API Key — both tied to
   the signed-in user, so they live exclusively on the Profile page's
   "API Tokens" tab, not the sidebar's standalone page. */
export function UserApiTokensSection() {
  const [seedTokens] = useState(() => [...API_TOKENS]);
  const userTokens = seedTokens.filter((t) => t.scope === "user");

  return (
    <div className="space-y-8">
      <TokenTable
        title="User API Tokens"
        description="Scoped to you — each one is its own secret you can roll or revoke without touching the others."
        scope="user"
        tokens={userTokens}
      />

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <GlobalApiKeyPanel />
    </div>
  );
}

/* Sidebar-only: Account API Tokens — owned by the account rather than
   any one user, so it keeps working even if the user who created it
   leaves; reached from the Manage group's standalone "API Tokens"
   page, not the Profile page. */
export function AccountApiTokensSection() {
  const [seedTokens] = useState(() => [...API_TOKENS]);
  const accountTokens = seedTokens.filter((t) => t.scope === "account");

  return (
    <TokenTable
      description="Owned by the account rather than any one user — keeps working even if the user who created it leaves."
      scope="account"
      tokens={accountTokens}
    />
  );
}
