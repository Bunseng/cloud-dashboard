import { useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { VPS_OS_OPTIONS } from "./VpsDialogs";

/* ------------------------------------------------------------------ *
 * Create VPS — full page, same shape as Create Run App (Hostname/OS up
 * top, a fixed plan summary card, then Cancel/Create) rather than a
 * small modal, since provisioning a server has more to confirm than a
 * bucket name. CPU/RAM/Storage aren't pickable here — they're already
 * fixed by the subscription's Standard plan (see VpsInstanceDetailPage's
 * own "resizing is a plan change" note) — so this page only collects
 * what's actually this VM's own: hostname, OS, region, and how you'll
 * log into it.
 * ------------------------------------------------------------------ */

const VPS_REGIONS = ["Phnom Penh, KH", "Singapore, SG", "Bangkok, TH", "Ho Chi Minh City, VN"] as const;

export interface VpsCreateResult {
  hostname: string;
  os: string;
  region: string;
}

/* Module-level (not React state) so it survives navigating away and
   back within the same session — VpsInstanceRoute remounts on every
   visit, but checks this map first to know whether to show this page
   again or the real instance it already created. Resets on a full
   page reload, same as every other mock data store in this app. */
export const VPS_PROVISIONED: Record<string, VpsCreateResult> = {};

export function CreateVpsPage({
  instanceName,
  onBack,
  onCreate,
}: {
  instanceName: string;
  onBack: () => void;
  onCreate: (result: VpsCreateResult) => void;
}) {
  const defaultHostname = `${instanceName.toLowerCase().replace(/\s+/g, "-")}.cloudplus.test`;
  const [hostname, setHostname] = useState(defaultHostname);
  const [os, setOs] = useState<string>(VPS_OS_OPTIONS[0]);
  const [region, setRegion] = useState<string>(VPS_REGIONS[0]);
  const [authMethod, setAuthMethod] = useState<"password" | "ssh">("ssh");
  const [password, setPassword] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [touched, setTouched] = useState(false);

  const hostnameValid = hostname.trim().length > 0;
  const authValid =
    authMethod === "password" ? password.length >= 8 : publicKey.trim().startsWith("ssh-");
  const valid = hostnameValid && authValid;

  function submit() {
    setTouched(true);
    if (!valid) return;
    onCreate({ hostname: hostname.trim(), os, region });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to Subscriptions
      </button>

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Create VPS
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Provision {instanceName} — this subscription's server hasn't been created yet.
      </p>

      <div className="mt-6 max-w-[640px] space-y-5">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Hostname</p>
          <Input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="my-server.cloudplus.test"
            className="mt-2 h-9 font-mono text-[13px]"
            autoFocus
          />
          {touched && !hostnameValid && (
            <p className="mt-1.5 text-xs text-red-500">Enter a hostname.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Operating System</p>
            <Select value={os} onValueChange={setOs}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VPS_OS_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Region</p>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VPS_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardTitle>Plan (Standard)</CardTitle>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            Fixed by this subscription — resize later via "Upgrade Plan" on the instance page.
          </p>
          <dl className="mt-3 grid grid-cols-4 gap-3 text-[13px]">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">vCPU</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">2 Core</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Memory</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">4 GB</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Storage</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">80 GB</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Bandwidth</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">4 TB</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Authentication</CardTitle>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            How you'll log in as root the first time.
          </p>

          <RadioGroup
            value={authMethod}
            onValueChange={(v) => setAuthMethod(v as "password" | "ssh")}
            className="mt-3 grid grid-cols-2 gap-2"
          >
            <Label
              htmlFor="auth-ssh"
              className={
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium " +
                (authMethod === "ssh"
                  ? "border-[#1C75BC] bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]"
                  : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300")
              }
            >
              <RadioGroupItem value="ssh" id="auth-ssh" />
              SSH Key
            </Label>
            <Label
              htmlFor="auth-password"
              className={
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium " +
                (authMethod === "password"
                  ? "border-[#1C75BC] bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]"
                  : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300")
              }
            >
              <RadioGroupItem value="password" id="auth-password" />
              Password
            </Label>
          </RadioGroup>

          <div className="mt-3">
            {authMethod === "ssh" ? (
              <>
                <Textarea
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... you@laptop"
                  rows={3}
                  className="font-mono text-[12.5px]"
                />
                {touched && !authValid && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Paste a public key starting with "ssh-".
                  </p>
                )}
              </>
            ) : (
              <>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Root password"
                  className="h-9"
                />
                {touched && !authValid && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Use at least 8 characters.
                  </p>
                )}
              </>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack} className="h-9 text-sm">
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} className="h-9 text-sm">
            Create VPS
          </Button>
        </div>
      </div>
    </div>
  );
}
