import { useState } from "react";

import { Camera } from "@/components/animate-ui/icons/camera";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { StatusBadge } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EmptyState } from "../../firstusersrc/EmptyState";
import { CreateSnapshotDialog } from "./VpsDialogs";
import { VPS_INSTANCES } from "./VpsInstanceDetailPage";

/* ------------------------------------------------------------------ *
 * VPS → Snapshots — full-disk images across every instance, listed
 * and created from one place (same list + create flow as Database's
 * backups) instead of being buried per-instance. Restoring a new VPS
 * from one isn't wired here, just the capture/delete steps.
 * ------------------------------------------------------------------ */

interface Snapshot {
  name: string;
  instanceName: string;
  size: string;
  createdOn: string;
}

const INSTANCE_NAMES = Object.keys(VPS_INSTANCES);

const INITIAL_SNAPSHOTS: Snapshot[] = INSTANCE_NAMES.slice(0, 2).map((instanceName, i) => ({
  name: `${instanceName}-snapshot`,
  instanceName,
  size: VPS_INSTANCES[instanceName]?.resource.storage ?? "80 GB",
  createdOn: new Date(Date.now() - (i + 1) * 86_400_000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
}));

export function VpsSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Snapshots
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Full-disk images of your servers, ready to restore from later.
          </p>
        </div>
        <Button variant="brand" onClick={() => setCreateOpen(true)} className="h-9 gap-1.5 px-4 text-sm">
          <Camera className="h-4 w-4" animateOnHover animateOnTap />
          Create Snapshot
        </Button>
      </div>

      <div className="mt-6">
        {snapshots.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No snapshots yet"
            description="Create a snapshot to capture a server's current state so you can restore it later."
            actionLabel="Create Snapshot"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Instance</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-px text-right">
                      <span className="sr-only sm:not-sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((snap, i) => (
                    <TableRow key={`${snap.name}-${i}`}>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                        {snap.name}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">
                        {snap.instanceName}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{snap.size}</TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400">{snap.createdOn}</TableCell>
                      <TableCell>
                        <StatusBadge label="Ready" tone="green" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${snap.name}`}
                          onClick={() => setSnapshots((prev) => prev.filter((_, idx) => idx !== i))}
                          className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
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

      <CreateSnapshotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        instances={INSTANCE_NAMES}
        onCreate={({ name, instanceName }) =>
          setSnapshots((prev) => [
            {
              name,
              instanceName,
              size: VPS_INSTANCES[instanceName]?.resource.storage ?? "80 GB",
              createdOn: new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            },
            ...prev,
          ])
        }
      />
    </div>
  );
}
