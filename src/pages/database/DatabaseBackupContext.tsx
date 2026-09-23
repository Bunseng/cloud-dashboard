import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Database Backup — each database instance carries its own separate
 * Backup subscription (Basic/Standard/Premium/Enterprise, see
 * data/pricing's "databaseBackup" tiers), not one blanket plan
 * covering every instance — the same way each instance already has
 * its own Database plan. `subscriptions` maps instance name -> tier
 * id; an instance with no entry hasn't enabled Backup at all. Lives
 * here (not any one page's local state) so it survives the trip
 * through the Subscribe flow and back, and stays in sync between the
 * sidebar's global Backups list and each instance's own page.
 *
 * Every backup also carries its own audit trail (`history`) — one
 * entry per action taken against it (the automated Backup that
 * created it, any later Restore), each with its own timing and
 * outcome, for the Backup History dialog. `status` gates whether it
 * can be restored right now — Ready/Completed can; Processing/
 * Restoring/Expired can't (either not settled yet, or too late).
 * ------------------------------------------------------------------ */

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

export type BackupStatus = "Processing" | "Restoring" | "Ready" | "Completed" | "Expired";

// Restoring from a backup that isn't settled (still Processing/Restoring)
// or is past its retention window (Expired) isn't allowed.
export const RESTORE_DISABLED_STATUSES: BackupStatus[] = ["Processing", "Restoring", "Expired"];

export function backupStatusTone(status: BackupStatus): "green" | "amber" | "red" {
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

export interface BackupHistoryEntry {
  id: string;
  actionType: "Backup" | "Restore";
  status: "Success" | "Failed";
  initializedAt: string;
  finishedAt: string;
}

export interface Backup {
  id: string;
  name: string;
  instanceName: string;
  size: string;
  createdOn: string;
  status: BackupStatus;
  history: BackupHistoryEntry[];
}

interface DatabaseBackupContextValue {
  isSubscribed: (instanceName: string) => boolean;
  getTierId: (instanceName: string) => string | undefined;
  subscribe: (instanceName: string, tierId: string) => void;
  backups: Backup[];
  addBackup: (backup: Omit<Backup, "id" | "status" | "history">) => void;
  setBackupStatus: (backupId: string, status: BackupStatus) => void;
  addHistoryEntry: (backupId: string, entry: Omit<BackupHistoryEntry, "id">) => void;
}

const DatabaseBackupContext = createContext<DatabaseBackupContextValue | null>(null);

let nextBackupId = 1;
let nextHistoryId = 1;

export function DatabaseBackupProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Record<string, string>>({});
  const [backups, setBackups] = useState<Backup[]>([]);

  const value = useMemo(
    () => ({
      isSubscribed: (instanceName: string) => subscriptions[instanceName] != null,
      getTierId: (instanceName: string) => subscriptions[instanceName],
      subscribe: (instanceName: string, tierId: string) =>
        setSubscriptions((prev) => ({ ...prev, [instanceName]: tierId })),
      backups,
      addBackup: (backup: Omit<Backup, "id" | "status" | "history">) => {
        const now = formatHistoryTimestamp(new Date());
        setBackups((prev) => [
          {
            ...backup,
            id: `backup-${nextBackupId++}`,
            status: "Ready",
            history: [
              {
                id: `history-${nextHistoryId++}`,
                actionType: "Backup",
                status: "Success",
                initializedAt: now,
                finishedAt: now,
              },
            ],
          },
          ...prev,
        ]);
      },
      setBackupStatus: (backupId: string, status: BackupStatus) =>
        setBackups((prev) => prev.map((b) => (b.id === backupId ? { ...b, status } : b))),
      addHistoryEntry: (backupId: string, entry: Omit<BackupHistoryEntry, "id">) =>
        setBackups((prev) =>
          prev.map((b) =>
            b.id === backupId
              ? { ...b, history: [...b.history, { ...entry, id: `history-${nextHistoryId++}` }] }
              : b
          )
        ),
    }),
    [subscriptions, backups]
  );
  return <DatabaseBackupContext.Provider value={value}>{children}</DatabaseBackupContext.Provider>;
}

export function useDatabaseBackup(): DatabaseBackupContextValue {
  const ctx = useContext(DatabaseBackupContext);
  if (!ctx) {
    throw new Error("useDatabaseBackup must be used within a DatabaseBackupProvider");
  }
  return ctx;
}
