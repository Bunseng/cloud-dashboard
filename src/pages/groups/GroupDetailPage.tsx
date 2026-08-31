import { useEffect, useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Save } from "@/components/animate-ui/icons/save";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { UserPlus } from "@/components/animate-ui/icons/user-plus";
import { Users } from "@/components/animate-ui/icons/users";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS, SearchField } from "../../components/atoms";
import {
  addGroupMember,
  CLOUD_USERS,
  GROUP_ROLES,
  GROUPS,
  PERMISSION_LEVELS,
  PERMISSION_RESOURCES,
  removeGroupMember,
  renameGroup,
  saveGroupPermissions,
  type Group,
  type GroupPermissions,
  type GroupRole,
} from "../../data/groups";

/* ------------------------------------------------------------------ *
 * Group detail — Member / Permission / Setting, the same three
 * concerns any IAM-style "group" needs: who's in it, what it can
 * touch, and its own identity/lifecycle. Reuses the app's existing
 * Sheet-drawer (Invite User), pill Tabs, and ConfirmDialog patterns
 * rather than inventing new ones for this one page.
 * ------------------------------------------------------------------ */

const ROLE_TONE: Record<GroupRole, string> = {
  Owner: "text-[#1C75BC] dark:text-[#6FA8D8]",
  Admin: "text-emerald-600 dark:text-emerald-400",
  Member: "text-zinc-600 dark:text-zinc-400",
};

/* Invite User — right-side Drawer. Members are added by picking an
   existing Cloud ID rather than typing an email, so a Group can only
   ever contain real Cloud+ accounts. */
function InviteUserDrawer({
  open,
  onOpenChange,
  candidates,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: typeof CLOUD_USERS;
  onInvite: (cloudId: string, role: GroupRole) => void;
}) {
  const [cloudId, setCloudId] = useState("");
  const [role, setRole] = useState<GroupRole>("Member");

  useEffect(() => {
    if (open) {
      setCloudId(candidates[0]?.cloudId ?? "");
      setRole("Member");
    }
  }, [open, candidates]);

  const valid = Boolean(cloudId);

  function submit() {
    if (!valid) return;
    onInvite(cloudId, role);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite User</SheetTitle>
          <SheetDescription>
            Add an existing Cloud+ account to this group by its Cloud ID.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex-1 space-y-5 overflow-y-auto">
          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">
              Cloud ID<span className="ml-0.5 text-red-500">*</span>
            </Label>
            {candidates.length > 0 ? (
              <Select value={cloudId} onValueChange={setCloudId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a Cloud ID" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((u) => (
                    <SelectItem key={u.cloudId} value={u.cloudId}>
                      {u.name} · {u.cloudId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                Every Cloud+ account is already a member of this group.
              </p>
            )}
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as GroupRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
              Owner and Admin can manage this group's members and permissions;
              Member only inherits its resource access.
            </p>
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
            Invite User
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MemberTab({ group, onChange }: { group: Group; onChange: () => void }) {
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Group["members"][number] | null>(null);

  const candidates = CLOUD_USERS.filter(
    (u) => !group.members.some((m) => m.cloudId === u.cloudId)
  );
  const visible = group.members.filter(
    (m) =>
      !search.trim() ||
      m.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      m.cloudId.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <SearchField
          placeholder="Search members"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="brand"
          onClick={() => setInviteOpen(true)}
          className="h-9 shrink-0 gap-1.5 px-4 text-sm"
        >
          <UserPlus className="h-4 w-4" animateOnHover animateOnTap />
          Invite User
        </Button>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Name</TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Cloud ID</TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Email</TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">Role</TableHead>
              <TableHead className="text-right text-[13px] text-zinc-500 dark:text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length > 0 ? (
              visible.map((member) => (
                <TableRow key={member.cloudId}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {member.name}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
                    {member.cloudId}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">{member.email}</TableCell>
                  <TableCell className={"font-medium " + ROLE_TONE[member.role]}>
                    {member.role}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => setRemoveTarget(member)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="ml-auto h-4 w-4" animateOnHover animateOnTap />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Users className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} animateOnView />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      No members yet
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      Invite a teammate by their Cloud ID to add them to this group.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserDrawer
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        candidates={candidates}
        onInvite={(cloudId, role) => {
          addGroupMember(group.id, cloudId, role);
          onChange();
        }}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name}?`}
        description="They immediately lose whatever access this group granted them."
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={() => {
          if (removeTarget) {
            removeGroupMember(group.id, removeTarget.cloudId);
            onChange();
          }
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

function PermissionTab({ group, onChange }: { group: Group; onChange: () => void }) {
  const [draft, setDraft] = useState<GroupPermissions>({ ...group.permissions });
  const dirty = JSON.stringify(draft) !== JSON.stringify(group.permissions);

  return (
    <div className="mt-5 space-y-5">
      <Card>
        <CardTitle>Resource Access</CardTitle>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Every member of this group inherits exactly this access — set it once
          here instead of per person.
        </p>

        <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {PERMISSION_RESOURCES.map((resource) => (
            <div
              key={resource.key}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {resource.label}
                </p>
                <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                  {resource.description}
                </p>
              </div>
              <Select
                value={draft[resource.key]}
                onValueChange={(v) =>
                  setDraft((prev) => ({ ...prev, [resource.key]: v as GroupPermissions[typeof resource.key] }))
                }
              >
                <SelectTrigger className="h-9 w-[160px] shrink-0 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="brand"
            disabled={!dirty}
            onClick={() => {
              saveGroupPermissions(group.id, draft);
              onChange();
            }}
            className="h-9 gap-1.5 px-4 text-sm"
          >
            <Save className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Save Permissions
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SettingTab({
  group,
  onChange,
  onDeleted,
}: {
  group: Group;
  onChange: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const trimmed = name.trim();
  const dirty = trimmed !== group.name && trimmed.length > 0;

  return (
    <div className="mt-5 space-y-5">
      <Card>
        <CardTitle>Group Name</CardTitle>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Shown everywhere this group is referenced.
        </p>
        <div className="mt-4 flex max-w-md items-center gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button
            variant="brand"
            disabled={!dirty}
            onClick={() => {
              renameGroup(group.id, trimmed);
              onChange();
            }}
            className="h-9 shrink-0 gap-1.5 px-4 text-sm"
          >
            <Save className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Save
          </Button>
        </div>
      </Card>

      <Card className="border-red-200 dark:border-red-900/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Deleting this group removes every member's access granted through
              it. This can't be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="h-9 shrink-0 text-sm"
          >
            Delete Group
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${group.name}?`}
        description="This permanently deletes the group and its permissions. This can't be undone."
        confirmLabel="Delete Group"
        variant="destructive"
        onConfirm={onDeleted}
      />
    </div>
  );
}

export function GroupDetailPage({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  // `version` just forces a re-render after a mutation — the helpers in
  // data/groups.ts write straight into the shared GROUPS array, so
  // re-reading it here (rather than keying/remounting the page, which
  // would also reset whichever tab you were on) is all that's needed
  // to pick the change up.
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState("member");
  const group = GROUPS.find((g) => g.id === groupId);

  if (!group) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
        >
          <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
          Back to Group Members
        </button>
        <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
          This group no longer exists.
        </p>
      </div>
    );
  }

  function refresh() {
    setVersion((v) => v + 1);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to Group Members
      </button>

      <div className="mt-5 flex items-center gap-3">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          {group.name}
        </h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="member" className={PILL_TAB_TRIGGER_CLASS}>
            Member
          </TabsTrigger>
          <TabsTrigger value="permission" className={PILL_TAB_TRIGGER_CLASS}>
            Permission
          </TabsTrigger>
          <TabsTrigger value="setting" className={PILL_TAB_TRIGGER_CLASS}>
            Setting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="member">
          <MemberTab group={group} onChange={refresh} />
        </TabsContent>
        <TabsContent value="permission">
          <PermissionTab group={group} onChange={refresh} />
        </TabsContent>
        <TabsContent value="setting">
          <SettingTab group={group} onChange={refresh} onDeleted={onBack} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
