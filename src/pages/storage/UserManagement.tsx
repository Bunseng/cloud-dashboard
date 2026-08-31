import { useEffect, useState } from "react";
import { Ellipsis } from "@/components/animate-ui/icons/ellipsis";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Plus } from "@/components/animate-ui/icons/plus";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { Users } from "@/components/animate-ui/icons/users";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  CredentialField,
  PAGINATION_CONTROLS,
  RefreshIconButton,
  SearchField,
} from "../../components/atoms";
import { STORAGE_BUCKET_ROWS } from "./StoragePanel";

/* ------------------------------------------------------------------ *
 * Storage / User Management — from Figma's "Storage" frame (fileKey
 * EvjrpwXJD9JlayN1Ij5I4J, node 446:21085, "User Management" tab):
 * a sub-user table (Name/Bucket/Permission/Key/Actions) plus a
 * right-side Drawer for creating or editing one. The Drawer's Figma
 * copy ("Give your bucket a name...") was a leftover from a different,
 * copy-pasted dialog, so it's rewritten here to actually describe what
 * the drawer does — everything else (fields, layout, Sheet style)
 * follows the design as-is.
 *
 * Same Sheet shell as Run App's Create/Edit Service drawers, and the
 * same SearchField/RefreshIconButton/PAGINATION_CONTROLS/table shell as
 * Storage's own Buckets tab, so both tabs (and both features) read as
 * one system rather than two different tables bolted together.
 * ------------------------------------------------------------------ */

export type StoragePermission = "Read Only" | "Write Only" | "Read & Write" | "Full Access";

/* Every level a bucket grant can be given, in the order they should
   list — least to most access — so the drawer's Select and the
   table's color legend always read in the same order. */
export const STORAGE_PERMISSIONS: StoragePermission[] = [
  "Read Only",
  "Write Only",
  "Read & Write",
  "Full Access",
];

export interface StorageUserGrant {
  id: string;
  bucket: string;
  permission: StoragePermission;
}

export interface StorageUser {
  id: string;
  name: string;
  accessKey: string;
  secretKey: string;
  grants: StorageUserGrant[];
}

let nextGrantId = 1;
function makeGrantId() {
  return `grant-${nextGrantId++}`;
}

/* One seeded sub-user, matching the Figma table's sample row exactly
   (Name "GG", bucket "streamingbucket", Read Only). */
export const STORAGE_USERS: StorageUser[] = [
  {
    id: "user-gg",
    name: "GG",
    accessKey: "AKIA3F7QX9M2LH5R8K1J",
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    grants: [{ id: makeGrantId(), bucket: "streamingbucket", permission: "Read Only" }],
  },
];

/* Chip tone for the Bucket Access column — one user, one row, one
   chip per bucket they can reach, colored by level so the same
   permission always reads the same color everywhere it shows up:
   green (view only) → amber (write only) → blue (both) → violet
   (full access, including delete). The legend rendered above the
   table (STORAGE_PERMISSIONS) is what actually explains the colors —
   see PermissionLegend below. */
const PERMISSION_CHIP_TONE: Record<StoragePermission, string> = {
  "Read Only": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  "Write Only": "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  "Read & Write": "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]",
  "Full Access": "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
};

/* The dot color used both by the chips above and the legend's swatch
   below — kept separate from PERMISSION_CHIP_TONE (a bg+text pair)
   since the legend only needs one solid dot, not a whole pill. */
const PERMISSION_DOT_TONE: Record<StoragePermission, string> = {
  "Read Only": "bg-emerald-500",
  "Write Only": "bg-amber-500",
  "Read & Write": "bg-[#1C75BC]",
  "Full Access": "bg-violet-500",
};

/* A persistent color key for the Bucket Access column — without this,
   a green vs. amber vs. violet chip means nothing until you've
   memorized it. Sits right above the table, next to its header, so
   it's in view wherever the column itself is. */
function PermissionLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
      {STORAGE_PERMISSIONS.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span className={"h-2 w-2 shrink-0 rounded-full " + PERMISSION_DOT_TONE[level]} />
          {level}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Add/Edit User — right-side Drawer. One Access Key Name, and one or
 * more Bucket + Permission grants (Figma's "Bucket & Permission" list
 * area) so a single sub-user can be scoped to several buckets at once.
 * ------------------------------------------------------------------ */

interface DraftGrant {
  key: string;
  bucket: string;
  permission: StoragePermission;
}

function emptyDraftGrant(): DraftGrant {
  return { key: makeGrantId(), bucket: STORAGE_BUCKET_ROWS[0]?.name ?? "", permission: "Read Only" };
}

export function UserFormDrawer({
  open,
  onOpenChange,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StorageUser | null;
  onSave: (fields: { name: string; grants: { bucket: string; permission: StoragePermission }[] }) => void;
}) {
  const [name, setName] = useState("");
  const [grants, setGrants] = useState<DraftGrant[]>([emptyDraftGrant()]);

  // Re-seed the draft each time the drawer opens — a fresh blank form
  // for "Add", the user's current grants for "Edit".
  useEffect(() => {
    if (!open) return;
    if (user) {
      setName(user.name);
      setGrants(
        user.grants.map((g) => ({ key: makeGrantId(), bucket: g.bucket, permission: g.permission }))
      );
    } else {
      setName("");
      setGrants([emptyDraftGrant()]);
    }
  }, [open, user]);

  const trimmedName = name.trim();
  const validGrants = grants.filter((g) => g.bucket);
  const valid = Boolean(trimmedName && validGrants.length > 0);

  function updateGrant(key: string, patch: Partial<DraftGrant>) {
    setGrants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeGrant(key: string) {
    setGrants((rows) => rows.filter((r) => r.key !== key));
  }

  function submit() {
    if (!valid) return;
    onSave({
      name: trimmedName,
      grants: validGrants.map((g) => ({ bucket: g.bucket, permission: g.permission })),
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user ? "Edit User" : "Add User"}</SheetTitle>
          <SheetDescription>
            {user
              ? `Update ${user.name}'s access key name and bucket permissions.`
              : "Create a scoped access key and grant it permission to specific buckets."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex-1 space-y-5 overflow-y-auto">
          <div>
            <Label htmlFor="user-access-key-name" className="text-zinc-900 dark:text-zinc-100">
              Access Key Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="user-access-key-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GG"
              className="mt-2"
            />
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Bucket & Permission</p>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Choose which buckets this key can access, and at what level.
            </p>

            <div className="mt-3 space-y-2.5">
              {grants.map((grant) => (
                <div
                  key={grant.key}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800"
                >
                  <Select
                    value={grant.bucket}
                    onValueChange={(v) => updateGrant(grant.key, { bucket: v })}
                  >
                    <SelectTrigger className="h-9 flex-1 text-[13px]">
                      <SelectValue placeholder="Search Bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_BUCKET_ROWS.map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={grant.permission}
                    onValueChange={(v) => updateGrant(grant.key, { permission: v as StoragePermission })}
                  >
                    <SelectTrigger className="h-9 w-[136px] shrink-0 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_PERMISSIONS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    aria-label="Remove bucket"
                    disabled={grants.length === 1}
                    onClick={() => removeGrant(grant.key)}
                    className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-zinc-900"
                  >
                    <X className="h-3.5 w-3.5" animateOnHover animateOnTap />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setGrants((rows) => [...rows, emptyDraftGrant()])}
              className="mt-3 h-8 gap-1.5 text-sm"
            >
              <Plus className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Add Bucket
            </Button>
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline" className="h-9 w-[164px] text-sm">
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="button"
            variant="brand"
            disabled={!valid}
            onClick={submit}
            className="h-9 w-[164px] text-sm"
          >
            {user ? "Save Changes" : "Create User"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* "View Detail" opens the Access/Secret key pair — same CredentialField
   atom Storage's Usage panel already uses for its own keys, so a key
   looks and copies the same way everywhere it appears. */
function ViewAccessKeyDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StorageUser | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-[18px] w-[18px] text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            {user?.name}'s Access Key
          </DialogTitle>
          <DialogDescription>
            Keep this secret key private — anyone with it can access the buckets below.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-2">
            <CredentialField label="Access Key" value={user.accessKey} />
            <CredentialField label="Secret Key" value={user.secretKey} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * The table itself — one row per user (one Name), with every bucket
 * they can reach shown as a colored chip in a single Bucket Access
 * column instead of repeating the user's name down a run of rows.
 * A user with 3 buckets is still 1 row, just with 3 chips — reads
 * faster and scans better than the old one-row-per-grant layout, and
 * matches how the Edit drawer already treats it (one form, several
 * bucket rows). Search + Refresh + "Add User" mirror the Buckets
 * tab's own toolbar exactly.
 * ------------------------------------------------------------------ */

export function UserManagementTable() {
  const [users, setUsers] = useState<StorageUser[]>(STORAGE_USERS);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StorageUser | null>(null);
  const [viewingUser, setViewingUser] = useState<StorageUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<StorageUser | null>(null);

  function openCreate() {
    setEditingUser(null);
    setDrawerOpen(true);
  }

  function openEdit(user: StorageUser) {
    setEditingUser(user);
    setDrawerOpen(true);
  }

  function saveUser(fields: { name: string; grants: { bucket: string; permission: StoragePermission }[] }) {
    if (editingUser) {
      setUsers((list) =>
        list.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: fields.name,
                grants: fields.grants.map((g) => ({ id: makeGrantId(), ...g })),
              }
            : u
        )
      );
    } else {
      setUsers((list) => [
        ...list,
        {
          id: `user-${Date.now()}`,
          name: fields.name,
          accessKey: `AKIA${Math.random().toString(36).slice(2, 18).toUpperCase()}`,
          secretKey: `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
          grants: fields.grants.map((g) => ({ id: makeGrantId(), ...g })),
        },
      ]);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <SearchField placeholder="Search users" />
        <RefreshIconButton />
        <Button
          variant="brand"
          onClick={openCreate}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
          Add User
        </Button>
      </div>

      <div className="mt-3 flex justify-end">
        <PermissionLegend />
      </div>

      <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Name</TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Bucket Access
              </TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Key</TableHead>
              <TableHead className="text-right text-[13px] text-zinc-500 dark:text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </TableCell>
                  <TableCell className="max-w-[360px]">
                    <div className="flex flex-wrap gap-1.5">
                      {user.grants.map((grant) => (
                        <span
                          key={grant.id}
                          title={grant.permission}
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                            PERMISSION_CHIP_TONE[grant.permission]
                          }
                        >
                          {grant.bucket}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setViewingUser(user)}
                      className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                    >
                      View Detail
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${user.name}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          <Ellipsis className="h-4 w-4" animateOnHover animateOnTap />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Users
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                      animateOnView
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      No users yet
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      Add a scoped access key to let teammates or services reach specific buckets.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400">
        <p>0 of {users.length} row(s) selected.</p>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="h-7 w-14 border-zinc-200 dark:border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span>Page 1 of 1</span>

          <div className="flex items-center gap-1">
            {PAGINATION_CONTROLS.map(({ Icon, label }) => (
              <Button
                key={label}
                variant="outline"
                size="icon"
                disabled
                aria-label={label}
                className="h-7 w-7 border-zinc-200 dark:border-zinc-800"
              >
                <Icon className="h-4 w-4" animateOnHover animateOnTap />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <UserFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={editingUser} onSave={saveUser} />
      <ViewAccessKeyDialog open={Boolean(viewingUser)} onOpenChange={(o) => !o && setViewingUser(null)} user={viewingUser} />
      <ConfirmDialog
        open={Boolean(deletingUser)}
        onOpenChange={(o) => !o && setDeletingUser(null)}
        title={`Delete ${deletingUser?.name}?`}
        description="This revokes the access key immediately. Any service using it will lose access to these buckets."
        confirmLabel="Delete User"
        variant="destructive"
        onConfirm={() => {
          setUsers((list) => list.filter((u) => u.id !== deletingUser?.id));
          setDeletingUser(null);
        }}
      />
    </div>
  );
}
