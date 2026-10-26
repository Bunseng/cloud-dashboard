import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import { Plus } from "@/components/animate-ui/icons/plus";
import { X } from "@/components/animate-ui/icons/x";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  AddCardDialog,
  cardSelectionId,
  PayDialog,
  PaymentMethodPicker,
  resolvePaymentSelection,
  type PaymentSelection,
} from "../../components/PaymentFlow";
import { addSavedCard, SAVED_CARDS } from "../../data/paymentMethods";
import { getTierTheme, SERVICE_PRICING } from "../../data/pricing";
import {
  addVpsSshKey,
  deleteVpsSshKey,
  SelectSshKeyDialog,
  updateVpsSshKey,
  VPS_OS_FAMILIES,
  VPS_SSH_KEYS,
} from "./VpsDialogs";

/* ------------------------------------------------------------------ *
 * Create VPS — full page, same shape as Create Run App (fields up top,
 * a plan summary rail on the side, then Cancel/Create) rather than a
 * small modal, since provisioning a server has more to confirm than a
 * bucket name. Plan here picks the actual subscription tier (vCPU/RAM/
 * Storage/Bandwidth + price) from the same rate card Planning uses,
 * rather than a fixed "Standard" — the side rail mirrors every other
 * Feature's own Subscription card so this reads the same way once
 * you're actually looking at the instance.
 * ------------------------------------------------------------------ */

// Local datacenter presence only — Phnom Penh is the one Province with
// a live region today, the rest list for roadmap visibility but can't
// be selected yet.
const VPS_PROVINCES: { name: string; available: boolean }[] = [
  { name: "Phnom Penh", available: true },
  { name: "Siem Reap", available: false },
  { name: "Battambang", available: false },
  { name: "Preah Sihanouk", available: false },
  { name: "Kampong Cham", available: false },
  { name: "Kandal", available: false },
];

const VPS_TIERS = SERVICE_PRICING.vps;
// Fixed — this subscription's resources aren't picked here, just shown;
// resizing later is a plan change via "Upgrade Plan" on the instance.
const VPS_TIER_ID = "standard";
const SNAPSHOT_TIERS = SERVICE_PRICING.vpsSnapshot;

export interface VpsCreateResult {
  hostname: string;
  os: string;
  region: string;
  tierId: string;
  snapshotEnabled: boolean;
  snapshotTierId?: string;
}

/* Module-level (not React state) so it survives navigating away and
   back within the same session — VpsInstanceRoute remounts on every
   visit, but checks this map first to know whether to show this page
   again or the real instance it already created. Resets on a full
   page reload, same as every other mock data store in this app. */
export const VPS_PROVISIONED: Record<string, VpsCreateResult> = {};

/* How many VPS subscriptions exist — starts at the same fixed count
   every other multi-subscription Feature uses, but "New Subscription"
   here actually grows it (unlike Run App/Database, which still just
   point at Planning) so a newly added VPS subscription has a real
   number and — same as Subscription 3 always has — lands on this
   Create VPS form instead of a ready-made instance. */
export let VPS_SUBSCRIPTION_COUNT = 3;

export function addVpsSubscription(): number {
  VPS_SUBSCRIPTION_COUNT += 1;
  return VPS_SUBSCRIPTION_COUNT;
}

export function CreateVpsPage({
  instanceName,
  onBack,
  onCreate,
}: {
  instanceName: string;
  onBack: () => void;
  onCreate: (result: VpsCreateResult) => void;
}) {
  const [step, setStep] = useState<"edit" | "pay" | "review" | "creating" | "created">("edit");
  const defaultHostname = `${instanceName.toLowerCase().replace(/\s+/g, "-")}.cloudplus.test`;
  const [hostname, setHostname] = useState(defaultHostname);
  const [osFamily, setOsFamily] = useState<string>(VPS_OS_FAMILIES[0].family);
  const osVersions = VPS_OS_FAMILIES.find((f) => f.family === osFamily)?.versions ?? [];
  const [osVersion, setOsVersion] = useState<string>(osVersions[0]);
  const [province, setProvince] = useState<string>(VPS_PROVINCES[0].name);
  const [snapshotEnabled, setSnapshotEnabled] = useState(false);
  const [snapshotTierId, setSnapshotTierId] = useState<string>(SNAPSHOT_TIERS[0].id);
  // Paying for the Snapshot add-on — same picker/dialog/add-card shape
  // every other Subscribe/Upgrade payment in the app uses.
  const [cards, setCards] = useState(() => [...SAVED_CARDS]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentSelection | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  // SSH keys are account-level and reusable across instances, and more
  // than one can be authorized on the same server (e.g. one per admin) —
  // pick any number of existing keys, same place every other feature
  // offers a saved thing (payment methods, projects, …); "+ Add New SSH
  // Key" drops into the same name + paste form as the instance detail
  // page's own "Add Key", and what you save there becomes available
  // here next time too.
  const [sshKeys, setSshKeys] = useState(() => [...VPS_SSH_KEYS]);
  const [selectedSshKeyIds, setSelectedSshKeyIds] = useState<string[]>(() =>
    sshKeys[0] ? [sshKeys[0].id] : []
  );
  const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [confirmSnapshotPayOpen, setConfirmSnapshotPayOpen] = useState(false);
  const pendingTimers = useRef<number[]>([]);
  useEffect(() => () => pendingTimers.current.forEach(window.clearTimeout), []);

  const tier = VPS_TIERS.find((t) => t.id === VPS_TIER_ID) ?? VPS_TIERS[2];
  const tierTheme = getTierTheme(tier.id);
  const snapshotTier = SNAPSHOT_TIERS.find((t) => t.id === snapshotTierId) ?? SNAPSHOT_TIERS[0];
  const selectedSshKeys = sshKeys.filter((k) => selectedSshKeyIds.includes(k.id));

  const hostnameValid = hostname.trim().length > 0;
  const sshKeysValid = selectedSshKeyIds.length > 0;
  const valid = hostnameValid && sshKeysValid;

  function selectOsFamily(family: string) {
    setOsFamily(family);
    setOsVersion(VPS_OS_FAMILIES.find((f) => f.family === family)?.versions[0] ?? "");
  }

  function addExistingSshKey(id: string) {
    setSelectedSshKeyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeSshKey(id: string) {
    setSelectedSshKeyIds((prev) => prev.filter((existing) => existing !== id));
  }

  function addNewSshKey(key: { name: string; publicKey: string }) {
    const saved = addVpsSshKey(key);
    setSshKeys((prev) => [...prev, saved]);
    setSelectedSshKeyIds((prev) => [...prev, saved.id]);
  }

  // Edits/deletes the saved key itself (account-wide), not just this
  // server's list — the "X" on the SSH Keys card below only detaches a
  // key from this server; this is the actual key record.
  function updateExistingSshKey(id: string, key: { name: string; publicKey: string }) {
    updateVpsSshKey(id, key);
    setSshKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...key } : k)));
  }

  function deleteExistingSshKey(id: string) {
    deleteVpsSshKey(id);
    setSshKeys((prev) => prev.filter((k) => k.id !== id));
    setSelectedSshKeyIds((prev) => prev.filter((existing) => existing !== id));
  }

  function goToReview() {
    setTouched(true);
    if (!valid) return;
    setStep("review");
  }

  // Loading → brief success, same shape as PayDialog's own confirm →
  // loading → done, before actually handing off to the real instance
  // page — provisioning a server should feel like it took a moment, not
  // return instantly.
  function confirmCreate() {
    setStep("creating");
    const loadingTimer = window.setTimeout(() => {
      setStep("created");
      const doneTimer = window.setTimeout(() => {
        onCreate({
          hostname: hostname.trim(),
          os: `${osFamily} ${osVersion}`,
          region: province,
          tierId: tier.id,
          snapshotEnabled,
          snapshotTierId: snapshotEnabled ? snapshotTier.id : undefined,
        });
      }, 900);
      pendingTimers.current.push(doneTimer);
    }, 1400);
    pendingTimers.current.push(loadingTimer);
  }

  const isFinalizing = step === "creating" || step === "created";

  return (
    <div>
      {!isFinalizing && (
        <button
          type="button"
          onClick={step === "edit" ? onBack : step === "pay" ? () => setStep("review") : () => setStep("edit")}
          className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
        >
          <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
          {step === "edit" ? "Back to Subscriptions" : step === "pay" ? "Back to Review" : "Back to Edit"}
        </button>
      )}

      {!isFinalizing && (
        <>
          <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {step === "pay" ? "Pay for Snapshot Protection" : "Create VPS"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {step === "edit"
              ? `Provision ${instanceName} — this subscription's server hasn't been created yet.`
              : step === "pay"
              ? "This add-on bills separately from the server — pay now, then the server will be created."
              : "Review everything below, then confirm to provision this server."}
          </p>
        </>
      )}

      {step === "creating" || step === "created" ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          {step === "creating" ? (
            <>
              <LoaderCircle
                className="h-10 w-10 animate-spin text-[#1C75BC]"
                animate
                loop
              />
              <p className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Creating {instanceName}…
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Provisioning {hostname.trim()} — this only takes a moment.
              </p>
            </>
          ) : (
            <>
              <CircleCheck className="h-10 w-10 text-emerald-500" animateOnView />
              <p className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {instanceName} is ready
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Taking you to your new server…
              </p>
            </>
          )}
        </div>
      ) : step === "edit" ? (
      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 max-w-[640px] flex-1 space-y-5">
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
              <Select value={osFamily} onValueChange={selectOsFamily}>
                <SelectTrigger className="mt-2 h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VPS_OS_FAMILIES.map((f) => (
                    <SelectItem key={f.family} value={f.family}>
                      {f.family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Version</p>
              <Select value={osVersion} onValueChange={setOsVersion}>
                <SelectTrigger className="mt-2 h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {osVersions.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Province</p>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VPS_PROVINCES.map((p) => (
                  <SelectItem key={p.name} value={p.name} disabled={!p.available}>
                    {p.name}
                    {!p.available && " (Coming soon)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              Only Phnom Penh has a live datacenter today.
            </p>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Snapshot Protection</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  On-demand snapshots of this server.
                </p>
              </div>
              <Switch checked={snapshotEnabled} onCheckedChange={setSnapshotEnabled} />
            </div>

            {snapshotEnabled && (
              <>
                <Select value={snapshotTierId} onValueChange={setSnapshotTierId}>
                  <SelectTrigger className="mt-3 h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SNAPSHOT_TIERS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.priceKHR.toLocaleString()} KHR/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* What this snapshot plan actually configures — so
                    picking a tier isn't just a name and a price. */}
                <dl className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-zinc-50 p-3 text-[12px] dark:bg-zinc-900/60">
                  {snapshotTier.specs.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </Card>

          {/* SSH Keys — same shape as Database's IP Whitelist card
              (title + Add button, rows with a remove "X", dashed empty
              state) since both are "authorize one or more things for
              this server" lists; Add opens a dialog that can pick any
              saved key not already here or create a brand new one. */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>SSH Keys</CardTitle>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Any key listed here can log in as root.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddKeyDialogOpen(true)}
                className="h-9 shrink-0 gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
                Add
              </Button>
            </div>

            {selectedSshKeys.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {selectedSshKeys.map((k) => (
                  <li
                    key={k.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{k.name}</p>
                      <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {k.publicKey}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${k.name}`}
                      onClick={() => removeSshKey(k.id)}
                      className="shrink-0 text-zinc-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" animateOnHover animateOnTap />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 pt-4 pb-6 text-center dark:border-zinc-800">
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  No SSH keys added yet.
                </p>
              </div>
            )}

            {touched && !sshKeysValid && (
              <p className="mt-1.5 text-xs text-red-500">Add at least one SSH key.</p>
            )}
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onBack} className="h-9 text-sm">
              Cancel
            </Button>
            <Button variant="brand" onClick={goToReview} className="h-9 text-sm">
              Review
            </Button>
          </div>
        </div>

        {/* Right rail — mirrors every other Feature's own Subscription
            card, just for a subscription that isn't created yet. */}
        <div className="w-[320px] shrink-0 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>

          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">Plan</p>
              <Badge className={"border-transparent font-bold text-white hover:opacity-100 " + tierTheme.badge}>
                {tier.name.toUpperCase()}
              </Badge>
            </div>
            <dl className="mt-4 space-y-2 text-[13px]">
              {tier.specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {snapshotEnabled && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add-ons</p>
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Snapshot ({snapshotTier.name})
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {snapshotTier.priceKHR.toLocaleString()} KHR/mo
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : step === "pay" ? (
        <div className="mt-6">
          <PaymentMethodPicker
            summary={
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Snapshot Add-on</p>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {snapshotTier.name}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {snapshotTier.priceKHR.toLocaleString()} KHR/mo
                  </p>
                </div>
              </Card>
            }
            payLabel={`Pay ${snapshotTier.priceKHR.toLocaleString()} KHR`}
            amount={snapshotTier.priceKHR}
            allowBG
            selected={paymentMethod}
            cards={cards}
            onSelect={setPaymentMethod}
            onPay={() => setPayOpen(true)}
            onAddCard={() => setAddCardOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 max-w-[640px] space-y-5">
          <Card>
            <CardTitle>Server</CardTitle>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Hostname</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{hostname.trim()}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Operating System</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {osFamily} {osVersion}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Province</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{province}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <CardTitle>Plan</CardTitle>
              <Badge className={"border-transparent font-bold text-white hover:opacity-100 " + tierTheme.badge}>
                {tier.name.toUpperCase()}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-3 text-[13px]">
              {tier.specs.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardTitle>Snapshot Protection</CardTitle>
            {snapshotEnabled ? (
              <>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  {snapshotTier.name} — {snapshotTier.priceKHR.toLocaleString()} KHR/mo
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
                  {snapshotTier.specs.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Not enabled.</p>
            )}
          </Card>

          <Card>
            <CardTitle>SSH Keys</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              {selectedSshKeys.length > 0
                ? `Log in with ${selectedSshKeys.map((k) => `"${k.name}"`).join(", ")}.`
                : "No SSH key selected."}
            </p>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("edit")} className="h-9 text-sm">
              Back
            </Button>
            <Button
              variant="brand"
              onClick={snapshotEnabled ? () => setConfirmSnapshotPayOpen(true) : confirmCreate}
              className="h-9 text-sm"
            >
              Confirm & Create VPS
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSnapshotPayOpen}
        onOpenChange={setConfirmSnapshotPayOpen}
        title="Payment required for Snapshot Protection"
        description={`You've added Snapshot Protection (${snapshotTier.name} — ${snapshotTier.priceKHR.toLocaleString()} KHR/mo). Pay for it now to confirm and create this server.`}
        confirmLabel="Continue to Payment"
        onConfirm={() => setStep("pay")}
      />

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={snapshotTier.priceKHR}
        selection={resolvePaymentSelection(paymentMethod, cards)}
        onSuccess={() => {
          setPayOpen(false);
          confirmCreate();
        }}
      />

      <AddCardDialog
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        onSave={(card) => {
          const saved = addSavedCard(card);
          setCards((prev) => [...prev, saved]);
          setPaymentMethod(cardSelectionId(saved.id));
        }}
      />

      <SelectSshKeyDialog
        open={addKeyDialogOpen}
        onOpenChange={setAddKeyDialogOpen}
        availableKeys={sshKeys.filter((k) => !selectedSshKeyIds.includes(k.id))}
        onSelectExisting={addExistingSshKey}
        onCreateNew={addNewSshKey}
        onUpdateExisting={updateExistingSshKey}
        onDeleteExisting={deleteExistingSshKey}
      />
    </div>
  );
}
