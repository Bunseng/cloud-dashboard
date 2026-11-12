import { useState } from "react";

import { Key } from "@/components/animate-ui/icons/key";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CopyIconButton } from "../../components/atoms";
import {
  addVpsSshKey,
  AddSshKeyDialog,
  deleteVpsSshKey,
  VPS_SSH_KEYS,
  type VpsSshKey,
} from "./VpsDialogs";

/* ------------------------------------------------------------------ *
 * VPS → SSH Keys — the account's key list, one level up from any one
 * server. A key added here is the same key Subscribe's SSH Key step and
 * an instance's own SSH Keys tab both read from (VPS_SSH_KEYS), so this
 * page is where you manage the set and those are where you choose from
 * it. Deleting one here stops it authorizing *future* servers; it
 * doesn't reach into instances already carrying it.
 * ------------------------------------------------------------------ */

export function VpsSshKeysPage() {
  const [keys, setKeys] = useState<VpsSshKey[]>(() => [...VPS_SSH_KEYS]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VpsSshKey | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            SSH Keys
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Public keys on your account. Any of these can be attached to a server when you create
            it, or added to one that's already running.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => setAddOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Key className="h-4 w-4" animateOnHover animateOnTap />
          Add SSH Key
        </Button>
      </div>

      <Card className={keys.length > 0 ? "mt-5 p-0" : "mt-5"}>
        {keys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Public Key</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => {
                // An OpenSSH public key is "<type> <body> [comment]" —
                // splitting it gives real columns instead of one long
                // unreadable string.
                const [type, body, ...comment] = key.publicKey.trim().split(/\s+/);
                return (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      {key.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                      {type}
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <span className="block truncate font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                        {body}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {comment.join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <CopyIconButton value={key.publicKey} label={key.name} />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${key.name}`}
                          onClick={() => setDeleteTarget(key)}
                          className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" animateOnHover animateOnTap />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Key className="h-5 w-5 text-zinc-400" animateOnView />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                No SSH keys yet
              </p>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                Add one to log into your servers without a password.
              </p>
            </div>
            <Button variant="brand" onClick={() => setAddOpen(true)} className="mt-1 h-9 text-sm">
              Add SSH Key
            </Button>
          </div>
        )}
      </Card>

      <AddSshKeyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(key) => setKeys((prev) => [...prev, addVpsSshKey(key)])}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete SSH key?"}
        description="Servers already using this key keep it — this only stops it being offered for new ones."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteVpsSshKey(deleteTarget.id);
            setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
