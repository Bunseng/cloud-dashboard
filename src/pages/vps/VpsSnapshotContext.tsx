import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { PricingPlan } from "../../data/pricing";

/* ------------------------------------------------------------------ *
 * VPS Snapshot — same shape as Database Backup (DatabaseBackupContext),
 * copied deliberately rather than shared: each VPS instance carries its
 * own separate Snapshot subscription (Basic/Standard/Premium/Enterprise,
 * see data/pricing's "vpsSnapshot" tiers), not one blanket plan covering
 * every instance — the same way each VPS instance already has its own
 * VPS plan. `subscriptions` maps instance name -> tier id; an instance
 * with no entry hasn't enabled Snapshot at all.
 *
 * Every snapshot also carries its own audit trail (`history`) — one
 * entry per action taken against it (the manual Snapshot that created
 * it, any later Restore), each with its own timing and outcome.
 * `status` gates whether it can be restored right now — Ready/Completed
 * can; Processing/Restoring/Expired can't (either not settled yet, or
 * too late). How many snapshots an instance can hold at once is capped
 * by its plan's own "Max Snapshots" spec — Create Snapshot disables
 * once that's reached (see `snapshotLimitFor`).
 * ------------------------------------------------------------------ */

// Reads the plan's own "Max Snapshots" spec — null means unlimited (no
// spec, or a non-numeric value like "Unlimited"), a number is the cap.
export function snapshotLimitFor(plan: PricingPlan | undefined): number | null {
  const raw = plan?.specs.find(([label]) => label === "Max Snapshots")?.[1];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatHistoryTimestamp(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
}

export type SnapshotStatus = "Processing" | "Restoring" | "Ready" | "Completed" | "Expired";

// Restoring from a snapshot that isn't settled (still Processing/Restoring)
// or is past its retention window (Expired) isn't allowed.
export const RESTORE_DISABLED_STATUSES: SnapshotStatus[] = ["Processing", "Restoring", "Expired"];

export function snapshotStatusTone(status: SnapshotStatus): "green" | "amber" | "red" {
  switch (status) {
    case "Ready":
    case "Completed":
      return "green";
    case "Expired":
      return "red";
    default:
      return "amber";
  }
}

export interface SnapshotHistoryEntry {
  id: string;
  actionType: "Snapshot" | "Restore";
  status: "Success" | "Failed";
  initializedAt: string;
  finishedAt: string;
}

export interface Snapshot {
  id: string;
  name: string;
  instanceName: string;
  size: string;
  createdOn: string;
  status: SnapshotStatus;
  history: SnapshotHistoryEntry[];
}

interface VpsSnapshotContextValue {
  isSubscribed: (instanceName: string) => boolean;
  getTierId: (instanceName: string) => string | undefined;
  subscribe: (instanceName: string, tierId: string) => void;
  snapshots: Snapshot[];
  addSnapshot: (snapshot: Omit<Snapshot, "id" | "status" | "history">) => void;
  setSnapshotStatus: (snapshotId: string, status: SnapshotStatus) => void;
  addHistoryEntry: (snapshotId: string, entry: Omit<SnapshotHistoryEntry, "id">) => void;
}

const VpsSnapshotContext = createContext<VpsSnapshotContextValue | null>(null);

let nextSnapshotId = 1;
let nextHistoryId = 1;

export function VpsSnapshotProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Record<string, string>>({});
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const value = useMemo(
    () => ({
      isSubscribed: (instanceName: string) => subscriptions[instanceName] != null,
      getTierId: (instanceName: string) => subscriptions[instanceName],
      subscribe: (instanceName: string, tierId: string) =>
        setSubscriptions((prev) => ({ ...prev, [instanceName]: tierId })),
      snapshots,
      addSnapshot: (snapshot: Omit<Snapshot, "id" | "status" | "history">) => {
        const now = formatHistoryTimestamp(new Date());
        setSnapshots((prev) => [
          {
            ...snapshot,
            id: `snapshot-${nextSnapshotId++}`,
            status: "Ready",
            history: [
              {
                id: `history-${nextHistoryId++}`,
                actionType: "Snapshot",
                status: "Success",
                initializedAt: now,
                finishedAt: now,
              },
            ],
          },
          ...prev,
        ]);
      },
      setSnapshotStatus: (snapshotId: string, status: SnapshotStatus) =>
        setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? { ...s, status } : s))),
      addHistoryEntry: (snapshotId: string, entry: Omit<SnapshotHistoryEntry, "id">) =>
        setSnapshots((prev) =>
          prev.map((s) =>
            s.id === snapshotId
              ? { ...s, history: [...s.history, { ...entry, id: `history-${nextHistoryId++}` }] }
              : s
          )
        ),
    }),
    [subscriptions, snapshots]
  );
  return <VpsSnapshotContext.Provider value={value}>{children}</VpsSnapshotContext.Provider>;
}

export function useVpsSnapshot(): VpsSnapshotContextValue {
  const ctx = useContext(VpsSnapshotContext);
  if (!ctx) {
    throw new Error("useVpsSnapshot must be used within a VpsSnapshotProvider");
  }
  return ctx;
}
