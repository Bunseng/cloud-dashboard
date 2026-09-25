import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import {
  backupStatusTone,
  formatHistoryTimestamp,
  RESTORE_DISABLED_STATUSES,
  useDatabaseBackup,
  type Backup,
} from "./DatabaseBackupContext";
import { BackupHistoryDialog, BackupInfoSummary } from "./DatabaseDialogs";

/* ------------------------------------------------------------------ *
 * One database instance's own Backups — its own page (not a card
 * embedded in the instance detail view), matching Figma's dedicated
 * "{instance} - Back Up list" screen (File Name / Date / Size /
 * Status / History / Action) adapted to this app's Table/StatusBadge/
 * Button instead of the raw Figma markup. Backups are produced
 * automatically by the subscription — there's no manual "Create
 * Backup"/"Delete" step, so this page is read-only (Restore/History);
 * Restore is only enabled once a backup has actually settled (Ready/
 * Completed), not while it's Processing/Restoring or once it's
 * Expired. Landing here without a Backup subscription sends you
 * straight into the Subscribe flow — this list only ever renders once
 * a plan is active ("auto follow subscription").
 * ------------------------------------------------------------------ */

export function DatabaseInstanceBackupsPage({
  instanceName,
  onBack,
}: {
  instanceName: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { isSubscribed, getTierId, backups, setBackupStatus, addHistoryEntry } = useDatabaseBackup();
  const { getSchedule, cancelSchedule } = usePlanSchedule();
  const subscribed = isSubscribed(instanceName);
  const scheduleKey = `databaseBackup:${instanceName}`;
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Backup | null>(null);
  const tierId = getTierId(instanceName);
  const plan = SERVICE_PRICING.databaseBackup.find((t) => t.id === tierId);
  const instanceBackups = backups.filter((b) => b.instanceName === instanceName);
  const returnTo = `/database/${encodeURIComponent(instanceName)}/backups`;
  const planStats = plan
    ? [
        ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
        ["Backup Frequency", plan.specs[0][1]],
        ["Retention", plan.specs[1][1]],
        ["Pricing", plan.priceKHR === 0 ? "FREE" : `${plan.priceKHR.toLocaleString()} KHR/mo`],
      ]
    : [];

  useEffect(() => {
    if (!subscribed) {
      navigate(
        `/subscribe/databaseBackup/basic?return=${encodeURIComponent(returnTo)}&instance=${encodeURIComponent(instanceName)}`,
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

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        {instanceName} — Back Up List
      </h1>

      <div className="mt-5 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          {instanceBackups.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No backups yet"
              description="Your first automated backup will show up here shortly."
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
                    {instanceBackups.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                          {b.name}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-300">{b.createdOn}</TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-300">{b.size}</TableCell>
                        <TableCell>
                          <StatusBadge label={b.status} tone={backupStatusTone(b.status)} />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setHistoryTarget(b)}
                            className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                          >
                            History
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={RESTORE_DISABLED_STATUSES.includes(b.status)}
                            onClick={() => setRestoreTarget(b)}
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

        {/* Right rail: this instance's Backup subscription — same
            Subscription card shape as the Database/VPS/Run App detail
            pages, so Backup reads as a real subscription, not a
            special case. Upgrading here is still the only way to
            change a Backup plan — always scoped to this one instance. */}
        <div className="w-[320px] shrink-0 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
          <ServicePlanCard
            title="Backup Plan"
            planName={plan?.name ?? "Basic"}
            stats={planStats}
            showFooter={false}
            onUpgrade={() =>
              navigate(
                `/subscribe/databaseBackup/${tierId ?? "basic"}?upgrade=1&return=${encodeURIComponent(returnTo)}&instance=${encodeURIComponent(instanceName)}`
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
        title={restoreTarget ? `Restore ${restoreTarget.name}?` : "Restore backup?"}
        description="This overwrites the instance's current data with this backup. This can't be undone."
        confirmLabel="Restore"
        variant="destructive"
        onConfirm={() => {
          if (restoreTarget) {
            const id = restoreTarget.id;
            const initializedAt = formatHistoryTimestamp(new Date());
            setBackupStatus(id, "Restoring");
            // No real backend to await — a brief delay stands in for the
            // restore actually running, so "Restoring" (Restore disabled)
            // is visible before it settles back to a restorable state.
            setTimeout(() => {
              setBackupStatus(id, "Completed");
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
        {restoreTarget && <BackupInfoSummary backup={restoreTarget} />}
      </ConfirmDialog>

      <BackupHistoryDialog
        open={historyTarget != null}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        backup={historyTarget}
      />
    </div>
  );
}
