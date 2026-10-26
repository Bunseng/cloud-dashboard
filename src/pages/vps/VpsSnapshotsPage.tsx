import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Camera } from "@/components/animate-ui/icons/camera";
import { Button } from "@/components/ui/button";

import { ServicePlanCard } from "../../components/PlanCards";
import { usePlanSchedule } from "../../context/PlanScheduleContext";
import { SERVICE_PRICING } from "../../data/pricing";
import { CreateSnapshotDialog } from "./VpsDialogs";
import { VPS_INSTANCES } from "./VpsInstanceDetailPage";
import { snapshotLimitFor, useVpsSnapshot } from "./VpsSnapshotContext";

const INSTANCE_NAMES = Object.keys(VPS_INSTANCES);

/* ------------------------------------------------------------------ *
 * VPS → Snapshots — same shape as Database → Backups: each instance
 * carries its own separate Snapshot subscription (Basic/Standard/
 * Premium/Enterprise), not one blanket plan for every server, so this
 * reads exactly like the VPS list page itself: one card per instance
 * (its Snapshot plan, or an "Enable Snapshot" prompt if it hasn't got
 * one yet). Every other detail — History, Restore — lives one level
 * down, on that instance's own Snapshot List page; "Create Snapshot"
 * lives both there (that instance only, no picker needed) and here
 * (an instance picker, restricted to subscribed instances — the only
 * ones a snapshot can actually be taken for).
 * ------------------------------------------------------------------ */

export function VpsSnapshotsPage() {
  const navigate = useNavigate();
  const { isSubscribed, getTierId, snapshots, addSnapshot } = useVpsSnapshot();
  const { getSchedule, cancelSchedule } = usePlanSchedule();
  const [createOpen, setCreateOpen] = useState(false);
  const subscribedInstances = INSTANCE_NAMES.filter((name) => isSubscribed(name));
  // Only instances that are both subscribed AND still under their plan's
  // Max Snapshots cap can actually take a new one from here.
  const instancesWithRoom = subscribedInstances.filter((name) => {
    const plan = SERVICE_PRICING.vpsSnapshot.find((t) => t.id === getTierId(name));
    const limit = snapshotLimitFor(plan);
    if (limit == null) return true;
    return snapshots.filter((s) => s.instanceName === name).length < limit;
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Snapshots
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Restorable images of your servers — each has its own Snapshot subscription, which
            unlocks taking one whenever you need it.
          </p>
        </div>
        <Button
          variant="brand"
          disabled={instancesWithRoom.length === 0}
          onClick={() => setCreateOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Camera className="h-4 w-4" animateOnHover animateOnTap />
          Create Snapshot
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        {INSTANCE_NAMES.map((name) => {
          const tierId = getTierId(name);
          const plan = SERVICE_PRICING.vpsSnapshot.find((t) => t.id === tierId);
          const snapshotsPath = `/vps/${encodeURIComponent(name)}/snapshots`;

          if (!isSubscribed(name) || !plan) {
            return (
              <div
                key={name}
                className="flex flex-col justify-between rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700"
              >
                <div>
                  <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
                  <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Snapshot isn't enabled for this server yet.
                  </p>
                </div>
                <Button
                  variant="brand"
                  onClick={() => navigate(snapshotsPath)}
                  className="mt-4 h-9 w-full text-sm"
                >
                  Enable Snapshot
                </Button>
              </div>
            );
          }

          const instanceSnapshotCount = snapshots.filter((s) => s.instanceName === name).length;
          const limit = snapshotLimitFor(plan);

          return (
            <ServicePlanCard
              key={name}
              title={name}
              planName={plan.name}
              stats={[
                ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
                [
                  "Snapshots",
                  limit != null ? `${instanceSnapshotCount} / ${limit}` : `${instanceSnapshotCount}`,
                ],
                ["Snapshot Frequency", plan.specs[0][1]],
                ["Retention", plan.specs[1][1]],
              ]}
              footerLabel="View Snapshots"
              onSelect={() => navigate(snapshotsPath)}
              onUpgrade={() =>
                navigate(
                  `/subscribe/vpsSnapshot/${tierId}?upgrade=1&return=${encodeURIComponent(snapshotsPath)}&instance=${encodeURIComponent(name)}`
                )
              }
              scheduledUpgrade={getSchedule(`vpsSnapshot:${name}`)}
              onCancelSchedule={() => cancelSchedule(`vpsSnapshot:${name}`)}
            />
          );
        })}
      </div>

      <CreateSnapshotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        instances={instancesWithRoom}
        onCreate={({ name, instanceName }) =>
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
