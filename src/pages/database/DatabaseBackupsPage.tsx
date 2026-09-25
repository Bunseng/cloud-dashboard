import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { ServicePlanCard } from "../../components/PlanCards";
import { usePlanSchedule } from "../../context/PlanScheduleContext";
import { SERVICE_PRICING } from "../../data/pricing";
import { DATABASE_INSTANCES } from "./DatabaseInstanceDetailPage";
import { useDatabaseBackup } from "./DatabaseBackupContext";

const INSTANCE_NAMES = Object.keys(DATABASE_INSTANCES);

/* ------------------------------------------------------------------ *
 * Database → Backups — each instance carries its own separate Backup
 * subscription (Basic/Standard/Premium/Enterprise), not one blanket
 * plan for every database, so this reads exactly like the Database
 * list page itself: one card per instance (its Backup plan, or an
 * "Enable Backup" prompt if it hasn't got one yet). Every other detail
 * — the actual backups, History, Restore — lives one level down, on
 * that instance's own Backup List page.
 * ------------------------------------------------------------------ */

export function DatabaseBackupsPage() {
  const navigate = useNavigate();
  const { isSubscribed, getTierId, backups } = useDatabaseBackup();
  const { getSchedule, cancelSchedule } = usePlanSchedule();

  return (
    <div>
      <div>
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Backups
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Automated, restorable backups — each database has its own Backup subscription, captured
          automatically with no action needed.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        {INSTANCE_NAMES.map((name) => {
          const tierId = getTierId(name);
          const plan = SERVICE_PRICING.databaseBackup.find((t) => t.id === tierId);
          const backupsPath = `/database/${encodeURIComponent(name)}/backups`;

          if (!isSubscribed(name) || !plan) {
            return (
              <div
                key={name}
                className="flex flex-col justify-between rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700"
              >
                <div>
                  <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
                  <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Backup isn't enabled for this database yet.
                  </p>
                </div>
                <Button
                  variant="brand"
                  onClick={() => navigate(backupsPath)}
                  className="mt-4 h-9 w-full text-sm"
                >
                  Enable Backup
                </Button>
              </div>
            );
          }

          return (
            <ServicePlanCard
              key={name}
              title={name}
              planName={plan.name}
              stats={[
                ["Status", "Active", "text-emerald-600 dark:text-emerald-400"],
                ["Backups", String(backups.filter((b) => b.instanceName === name).length)],
                ["Backup Frequency", plan.specs[0][1]],
                ["Retention", plan.specs[1][1]],
              ]}
              footerLabel="View Backups"
              onSelect={() => navigate(backupsPath)}
              onUpgrade={() =>
                navigate(
                  `/subscribe/databaseBackup/${tierId}?upgrade=1&return=${encodeURIComponent(backupsPath)}&instance=${encodeURIComponent(name)}`
                )
              }
              scheduledUpgrade={getSchedule(`databaseBackup:${name}`)}
              onCancelSchedule={() => cancelSchedule(`databaseBackup:${name}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
