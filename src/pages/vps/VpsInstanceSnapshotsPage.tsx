import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Camera } from "@/components/animate-ui/icons/camera";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { History as HistoryIcon } from "@/components/animate-ui/icons/history";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ServicePlanCard } from "../../components/PlanCards";
import { StatusBadge } from "../../components/atoms";
import { usePlanSchedule } from "../../context/PlanScheduleContext";
import { SERVICE_PRICING } from "../../data/pricing";
import { EmptyState } from "../../firstusersrc/EmptyState";
import { CreateSnapshotDialog, SnapshotHistoryDialog, SnapshotInfoSummary } from "./VpsDialogs";
import { VPS_INSTANCES } from "./VpsInstanceDetailPage";
import {
  RESTORE_DISABLED_STATUSES,
  formatHistoryTimestamp,
  snapshotLimitFor,
  snapshotStatusTone,
  useVpsSnapshot,
  type Snapshot,
} from "./VpsSnapshotContext";

/* ------------------------------------------------------------------ *
 * One VPS instance's own Snapshots — its own page (not a card embedded
 * in the instance detail view), same shape as Database's per-instance
 * Backup List page (File Name / Date / Size / Status / History /
 * Action), plus a manual "Create Snapshot" step Database's Backup
 * doesn't have — unlike a Backup (auto-captured on a schedule), a
 * Snapshot is a deliberate, on-demand image the user asks for; the
 * Snapshot subscription just unlocks the ability to take one, at the
 * frequency/retention its plan promises, rather than taking one for
 * you. Restore is only enabled once a snapshot has actually settled
 * (Ready/Completed), not while it's Processing/Restoring or once it's
 * Expired. Landing here without a Snapshot subscription sends you
 * straight into the Subscribe flow — this list only ever renders once
 * a plan is active.
 * ------------------------------------------------------------------ */

export function VpsInstanceSnapshotsPage({
  instanceName,
  onBack,
}: {
  instanceName: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { isSubscribed, getTierId, snapshots, addSnapshot, setSnapshotStatus, addHistoryEntry } =
    useVpsSnapshot();
  const { getSchedule, cancelSchedule } = usePlanSchedule();
  const subscribed = isSubscribed(instanceName);
  const scheduleKey = `vpsSnapshot:${instanceName}`;
  const [createOpen, setCreateOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Snapshot | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Snapshot | null>(null);
  const tierId = getTierId(instanceName);
  const plan = SERVICE_PRICING.vpsSnapshot.find((t) => t.id === tierId);
  const instanceSnapshots = snapshots.filter((s) => s.instanceName === instanceName);
  const returnTo = `/vps/${encodeURIComponent(instanceName)}/snapshots`;
  const snapshotLimit = snapshotLimitFor(plan);
  const atSnapshotLimit = snapshotLimit != null && instanceSnapshots.length >= snapshotLimit;
  const planStats = plan
    ? [
        ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
        ["Snapshot Frequency", plan.specs[0][1]],
        ["Retention", plan.specs[1][1]],
        [
          "Max Snapshots",
          snapshotLimit != null
            ? `${instanceSnapshots.length} / ${snapshotLimit}`
            : `${instanceSnapshots.length} (Unlimited)`,
        ],
        ["Pricing", plan.priceKHR === 0 ? "FREE" : `${plan.priceKHR.toLocaleString()} KHR/mo`],
      ]
    : [];

  useEffect(() => {
    if (!subscribed) {
      navigate(
        `/subscribe/vpsSnapshot/basic?return=${encodeURIComponent(returnTo)}&instance=${encodeURIComponent(instanceName)}`,
        { replace: true }
      );
    }
  }, [subscribed, returnTo, instanceName, navigate]);

  // Redirecting to Subscribe — render nothing rather than flash an
  // empty list underneath the navigation.
  if (!subscribed) return null;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to {instanceName}
      </button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {instanceName} — Snapshot List
          </h1>
          {atSnapshotLimit && (
            <p className="mt-1 text-[13px] text-amber-600 dark:text-amber-400">
              Snapshot limit reached ({instanceSnapshots.length}/{snapshotLimit}) — restore or
              wait for one to expire, or upgrade your plan for more.
            </p>
          )}
        </div>
        <Button
          variant="brand"
          disabled={atSnapshotLimit}
          onClick={() => setCreateOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Camera className="h-4 w-4" animateOnHover animateOnTap />
          Create Snapshot
        </Button>
      </div>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          {instanceSnapshots.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No snapshots yet"
              description="Create a snapshot to capture this server's current state so you can restore it later."
              actionLabel="Create Snapshot"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                      <TableHead>File Name</TableHead>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>History</TableHead>
                      <TableHead className="w-px text-right">
                        <span className="sr-only sm:not-sr-only">Action</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instanceSnapshots.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                          {s.name}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-300">{s.createdOn}</TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-300">{s.size}</TableCell>
                        <TableCell>
                          <StatusBadge label={s.status} tone={snapshotStatusTone(s.status)} />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setHistoryTarget(s)}
                            className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                          >
                            History
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={RESTORE_DISABLED_STATUSES.includes(s.status)}
                            onClick={() => setRestoreTarget(s)}
                            className="h-7 px-3 text-xs"
                          >
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Right rail: this instance's Snapshot subscription — same
            Subscription card shape as the Database/VPS/Run App detail
            pages, so Snapshot reads as a real subscription, not a
            special case. Upgrading here is still the only way to
            change a Snapshot plan — always scoped to this one
            instance. */}
        <div className="w-[320px] shrink-0 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
          <ServicePlanCard
            title="Snapshot Plan"
            planName={plan?.name ?? "Basic"}
            stats={planStats}
            showFooter={false}
            onUpgrade={() =>
              navigate(
                `/subscribe/vpsSnapshot/${tierId ?? "basic"}?upgrade=1&return=${encodeURIComponent(returnTo)}&instance=${encodeURIComponent(instanceName)}`
              )
            }
            scheduledUpgrade={getSchedule(scheduleKey)}
            onCancelSchedule={() => cancelSchedule(scheduleKey)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={restoreTarget != null}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title={restoreTarget ? `Restore ${restoreTarget.name}?` : "Restore snapshot?"}
        description="This overwrites the server's current disk with this snapshot. This can't be undone."
        confirmLabel="Restore"
        variant="destructive"
        onConfirm={() => {
          if (restoreTarget) {
            const id = restoreTarget.id;
            const initializedAt = formatHistoryTimestamp(new Date());
            setSnapshotStatus(id, "Restoring");
            // No real backend to await — a brief delay stands in for the
            // restore actually running, so "Restoring" (Restore disabled)
            // is visible before it settles back to a restorable state.
            setTimeout(() => {
              setSnapshotStatus(id, "Completed");
              addHistoryEntry(id, {
                actionType: "Restore",
                status: "Success",
                initializedAt,
                finishedAt: formatHistoryTimestamp(new Date()),
              });
            }, 1500);
          }
          setRestoreTarget(null);
        }}
      >
        {restoreTarget && <SnapshotInfoSummary snapshot={restoreTarget} />}
      </ConfirmDialog>

      <SnapshotHistoryDialog
        open={historyTarget != null}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        snapshot={historyTarget}
      />

      <CreateSnapshotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        instances={[instanceName]}
        onCreate={({ name }) =>
          addSnapshot({
            name,
            instanceName,
            size: VPS_INSTANCES[instanceName]?.resource.storage ?? "80 GB",
            createdOn: new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })
        }
      />
    </div>
  );
}
