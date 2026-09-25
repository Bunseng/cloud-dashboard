import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Plan Schedule — every "Upgrade Plan" button across the app (Database,
 * VPS, Run App, Storage, Database Backup) now asks "upgrade now or
 * schedule for a date", via the shared Subscribe flow's new schedule
 * step. A scheduled change is purely informational here (there's no
 * backend/cron to actually flip the plan when the date arrives) — it
 * just needs to persist and be shown back on the right subscription's
 * card ("Upgrading to X on <date>") until cancelled or re-scheduled.
 * Keyed by a plain string built by each caller — e.g. "database:DB
 * Instance 1", "vps:VPS Instance 2", "runapp:3", "storage",
 * "databaseBackup:DB Instance 1" — so every subscription (down to one
 * specific instance) tracks its own schedule independently.
 * ------------------------------------------------------------------ */

export interface ScheduledPlanChange {
  tierId: string;
  tierName: string;
  // yyyy-mm-dd, from the schedule step's <input type="date">.
  date: string;
}

interface PlanScheduleContextValue {
  getSchedule: (key: string) => ScheduledPlanChange | undefined;
  schedule: (key: string, change: ScheduledPlanChange) => void;
  cancelSchedule: (key: string) => void;
}

const PlanScheduleContext = createContext<PlanScheduleContextValue | null>(null);

export function PlanScheduleProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Record<string, ScheduledPlanChange>>({});

  const value = useMemo(
    () => ({
      getSchedule: (key: string) => schedules[key],
      schedule: (key: string, change: ScheduledPlanChange) =>
        setSchedules((prev) => ({ ...prev, [key]: change })),
      cancelSchedule: (key: string) =>
        setSchedules((prev) => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }),
    }),
    [schedules]
  );

  return <PlanScheduleContext.Provider value={value}>{children}</PlanScheduleContext.Provider>;
}

export function usePlanSchedule(): PlanScheduleContextValue {
  const ctx = useContext(PlanScheduleContext);
  if (!ctx) {
    throw new Error("usePlanSchedule must be used within a PlanScheduleProvider");
  }
  return ctx;
}

export function formatScheduleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
